using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GitHubCopilotAPI.Data;
using GitHubCopilotAPI.Services;
using GitHubCopilotAPI.Models;

namespace GitHubCopilotAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UploadController : ControllerBase
{
    private readonly CopilotDbContext _context;
    private readonly ICsvParserService _csvParser;
    private readonly ILogger<UploadController> _logger;

    public UploadController(
        CopilotDbContext context,
        ICsvParserService csvParser,
        ILogger<UploadController> logger)
    {
        _context = context;
        _csvParser = csvParser;
        _logger = logger;
    }

    /// <summary>
    /// Importa CSV de Premium Requests con lógica de UPSERT por (date, username, model).
    /// Si un registro con la misma clave natural ya existe, se actualizan sus valores.
    /// Esto permite reimportar reportes acumulativos del mes sin duplicar datos.
    /// </summary>
    [Authorize]
    [RequestSizeLimit(10 * 1024 * 1024)]
    [HttpPost("premium-requests")]
    public async Task<IActionResult> UploadPremiumRequests(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { error = "No file uploaded" });
        }

        try
        {
            _logger.LogInformation("📥 Processing file: {FileName} ({Size} bytes)",
                file.FileName, file.Length);

            using var stream = file.OpenReadStream();
            var records = await _csvParser.ParsePremiumRequestsCsvAsync(stream);

            _logger.LogInformation("✅ Parsed {Count} records from CSV", records.Count);

            if (!records.Any())
                return BadRequest(new { error = "El CSV no contiene registros válidos" });

            // Rango de fechas del CSV para limitar la consulta al período relevante
            var minDate = records.Min(r => r.Date.Date);
            var maxDate = records.Max(r => r.Date.Date);

            // Cargar en memoria los registros existentes del período (una sola query)
            var existingList = await _context.PremiumRequests
                .Where(p => p.Date.Date >= minDate && p.Date.Date <= maxDate)
                .ToListAsync();

            // Indexar por clave natural (date, username, model)
            var existingIndex = existingList.ToDictionary(
                p => (p.Date.Date, p.Username, p.Model),
                p => p
            );

            var inserted = 0;
            var updated  = 0;

            foreach (var record in records)
            {
                var key = (record.Date.Date, record.Username, record.Model);

                if (existingIndex.TryGetValue(key, out var existingRow))
                {
                    // UPSERT: actualizar si algún valor cambió
                    if (existingRow.Quantity               != record.Quantity               ||
                        existingRow.GrossAmount            != record.GrossAmount            ||
                        existingRow.DiscountAmount         != record.DiscountAmount         ||
                        existingRow.NetAmount              != record.NetAmount              ||
                        existingRow.AppliedCostPerQuantity != record.AppliedCostPerQuantity)
                    {
                        existingRow.Quantity               = record.Quantity;
                        existingRow.GrossAmount            = record.GrossAmount;
                        existingRow.DiscountAmount         = record.DiscountAmount;
                        existingRow.NetAmount              = record.NetAmount;
                        existingRow.AppliedCostPerQuantity = record.AppliedCostPerQuantity;
                        existingRow.ExceedsQuota           = record.ExceedsQuota;
                        existingRow.UploadDate             = DateTime.UtcNow;
                        updated++;
                    }
                }
                else
                {
                    // INSERT: registro nuevo
                    await _context.PremiumRequests.AddAsync(record);
                    existingIndex[key] = record; // evitar duplicados dentro del mismo CSV
                    inserted++;
                }
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("💾 Upsert complete: {Inserted} inserted, {Updated} updated", inserted, updated);

            var upload = new Upload
            {
                Filename    = file.FileName,
                RecordCount = inserted + updated,
                PeriodStart = minDate,
                PeriodEnd   = maxDate,
                UploadDate  = DateTime.UtcNow
            };

            await _context.Uploads.AddAsync(upload);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = $"{inserted} registros nuevos, {updated} actualizados",
                details = new
                {
                    totalParsed = records.Count,
                    imported    = inserted,
                    updated     = updated,
                    unchanged   = records.Count - inserted - updated
                },
                period = new { start = minDate, end = maxDate }
            });
        }
        catch (InvalidDataException ex)
        {
            _logger.LogError(ex, "❌ Invalid CSV format");
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error processing CSV file");
            return StatusCode(500, new { error = "Error interno al procesar el archivo. Contacte al administrador." });
        }
    }

    /// <summary>
    /// Importa CSV de equipos (usuarios) con licencias por año/mes
    /// </summary>
    [Authorize]
    [RequestSizeLimit(10 * 1024 * 1024)]
    [HttpPost("teams")]
    public async Task<IActionResult> UploadTeam(IFormFile file, [FromForm] string team, [FromForm] int year)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { error = "No file uploaded" });
        }

        if (string.IsNullOrWhiteSpace(team))
        {
            return BadRequest(new { error = "Team name required" });
        }

        if (year < 2020 || year > 2100)
        {
            return BadRequest(new { error = "Year must be between 2020 and 2100" });
        }

        try
        {
            _logger.LogInformation("📥 Processing team file: {FileName} for team {Team} year {Year}",
                file.FileName, team, year);

            using var stream = file.OpenReadStream();
            var (users, newLicenses, updatedLicenses, protectedLicenses) = await _csvParser.ParseTeamCsvAsync(stream, team, year);

            var newUsers = 0;
            var updatedUsers = 0;

            // Actualizar o insertar usuarios (UPSERT)
            foreach (var user in users)
            {
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Usuario == user.Usuario);

                if (existingUser != null)
                {
                    existingUser.Nombre = user.Nombre;
                    existingUser.Correo = user.Correo;
                    existingUser.Equipo = user.Equipo;
                    updatedUsers++;
                }
                else
                {
                    await _context.Users.AddAsync(user);
                    newUsers++;
                }
            }

            await _context.SaveChangesAsync();

            var licenseMessage = protectedLicenses > 0
                ? $"{newUsers} usuarios nuevos, {updatedUsers} usuarios actualizados de {team}. Licencias: {newLicenses} nuevas, {updatedLicenses} actualizadas, {protectedLicenses} protegidas (ediciones manuales)"
                : $"{newUsers} usuarios nuevos, {updatedUsers} usuarios actualizados de {team}. Licencias: {newLicenses} nuevas, {updatedLicenses} actualizadas";

            return Ok(new
            {
                success = true,
                message = licenseMessage,
                details = new
                {
                    newUsers,
                    updatedUsers,
                    total = users.Count,
                    team,
                    year,
                    licenses = new
                    {
                        newLicenses,
                        updatedLicenses,
                        protectedLicenses
                    }
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error processing team CSV");
            return StatusCode(500, new { error = "Error interno del servidor." });
        }
    }

    /// <summary>
    /// Obtener información del último upload
    /// </summary>
    [HttpGet("last-upload")]
    public async Task<IActionResult> GetLastUpload()
    {
        try
        {
            var lastUpload = await _context.Uploads
                .OrderByDescending(u => u.UploadDate)
                .FirstOrDefaultAsync();

            if (lastUpload == null)
            {
                return Ok(new { message = "No uploads found" });
            }

            return Ok(lastUpload);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting last upload");
            return StatusCode(500, new { error = "Error interno del servidor." });
        }
    }
}
