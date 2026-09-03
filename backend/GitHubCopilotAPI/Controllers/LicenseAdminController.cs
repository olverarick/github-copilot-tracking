using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GitHubCopilotAPI.Data;
using GitHubCopilotAPI.Models;
using GitHubCopilotAPI.Models.DTOs;

namespace GitHubCopilotAPI.Controllers;

[ApiController]
[Route("api/licenses")]
public class LicenseAdminController : ControllerBase
{
    private readonly CopilotDbContext _context;
    private readonly ILogger<LicenseAdminController> _logger;

    public LicenseAdminController(CopilotDbContext context, ILogger<LicenseAdminController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Obtiene todas las licencias de un usuario para un año específico (12 meses)
    /// </summary>
    [HttpGet("user/{usuario}")]
    public async Task<ActionResult<UserYearLicensesDto>> GetUserYearLicenses(string usuario, [FromQuery] int year)
    {
        try
        {
            var licenses = await _context.UserLicenses
                .Where(ul => ul.Usuario == usuario && ul.Year == year)
                .ToListAsync();

            var result = new UserYearLicensesDto
            {
                Usuario = usuario,
                Year = year,
                Months = new Dictionary<int, bool?>()
            };

            // Inicializar todos los meses como null
            for (int month = 1; month <= 12; month++)
            {
                var license = licenses.FirstOrDefault(l => l.Month == month);
                result.Months[month] = license?.HasLicense;
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user licenses");
            return StatusCode(500, new { error = "Error interno del servidor." });
        }
    }

    /// <summary>
    /// Obtiene todos los usuarios con su estado de licencia para un período específico
    /// </summary>
    [HttpGet("period")]
    public async Task<ActionResult<List<UserLicenseDto>>> GetPeriodLicenses([FromQuery] int year, [FromQuery] int month)
    {
        try
        {
            var licenses = await _context.UserLicenses
                .Where(ul => ul.Year == year && ul.Month == month)
                .Select(ul => new UserLicenseDto
                {
                    Usuario = ul.Usuario,
                    Year = ul.Year,
                    Month = ul.Month,
                    HasLicense = ul.HasLicense,
                    ModifiedBy = ul.ModifiedBy,
                    CreatedAt = ul.CreatedAt
                })
                .OrderBy(ul => ul.Usuario)
                .ToListAsync();

            return Ok(licenses);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting period licenses");
            return StatusCode(500, new { error = "Error interno del servidor." });
        }
    }

    /// <summary>
    /// Actualiza la licencia de un usuario para un período específico (UPSERT)
    /// </summary>
    [HttpPut("user/{usuario}")]
    public async Task<IActionResult> UpdateUserLicense(string usuario, [FromBody] LicenseUpdateDto dto)
    {
        if (dto.Usuario != usuario)
        {
            return BadRequest(new { error = "Usuario in URL and body must match" });
        }

        try
        {
            var existing = await _context.UserLicenses
                .FirstOrDefaultAsync(ul => ul.Usuario == usuario && ul.Year == dto.Year && ul.Month == dto.Month);

            if (existing != null)
            {
                // Actualizar existente
                existing.HasLicense = dto.HasLicense;
                existing.ModifiedBy = "MANUAL";
                existing.CreatedAt = DateTime.UtcNow;
                _logger.LogInformation("Updated license for {Usuario} {Year}-{Month} to {HasLicense}",
                    usuario, dto.Year, dto.Month, dto.HasLicense);
            }
            else
            {
                // Crear nuevo
                var newLicense = new UserLicense
                {
                    Usuario = usuario,
                    Year = dto.Year,
                    Month = dto.Month,
                    HasLicense = dto.HasLicense,
                    ModifiedBy = "MANUAL",
                    CreatedAt = DateTime.UtcNow
                };
                _context.UserLicenses.Add(newLicense);
                _logger.LogInformation("Created license for {Usuario} {Year}-{Month} with {HasLicense}",
                    usuario, dto.Year, dto.Month, dto.HasLicense);
            }

            await _context.SaveChangesAsync();

            return Ok(new {
                success = true,
                message = $"License updated for {usuario} on {dto.Year}-{dto.Month:D2}"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user license");
            return StatusCode(500, new { error = "Error interno del servidor." });
        }
    }

    /// <summary>
    /// Actualiza múltiples licencias en batch (para guardar cambios desde UI)
    /// </summary>
    [HttpPost("bulk")]
    public async Task<IActionResult> UpdateLicensesBulk([FromBody] List<LicenseUpdateDto> updates)
    {
        if (updates == null || !updates.Any())
        {
            return BadRequest(new { error = "No updates provided" });
        }

        try
        {
            int created = 0;
            int updated = 0;

            foreach (var dto in updates)
            {
                var existing = await _context.UserLicenses
                    .FirstOrDefaultAsync(ul => ul.Usuario == dto.Usuario && ul.Year == dto.Year && ul.Month == dto.Month);

                if (existing != null)
                {
                    existing.HasLicense = dto.HasLicense;
                    existing.ModifiedBy = "MANUAL";
                    existing.CreatedAt = DateTime.UtcNow;
                    updated++;
                }
                else
                {
                    _context.UserLicenses.Add(new UserLicense
                    {
                        Usuario = dto.Usuario,
                        Year = dto.Year,
                        Month = dto.Month,
                        HasLicense = dto.HasLicense,
                        ModifiedBy = "MANUAL",
                        CreatedAt = DateTime.UtcNow
                    });
                    created++;
                }
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Bulk update: {Created} created, {Updated} updated", created, updated);

            return Ok(new
            {
                success = true,
                message = $"{created} licenses created, {updated} licenses updated",
                details = new { created, updated, total = updates.Count }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in bulk license update");
            return StatusCode(500, new { error = "Error interno del servidor." });
        }
    }

    /// <summary>
    /// Retorna todos los usuarios con sus 12 meses de licencia para un año dado (vista completa para UI admin)
    /// </summary>
    [HttpGet("year-view")]
    public async Task<ActionResult> GetYearView([FromQuery] int year)
    {
        try
        {
            // Todos los usuarios registrados
            var allUsers = await _context.Users
                .OrderBy(u => u.Usuario)
                .Select(u => new { u.Usuario, u.Equipo })
                .Distinct()
                .ToListAsync();

            // Todas las licencias del año (una sola query)
            var allLicenses = await _context.UserLicenses
                .Where(ul => ul.Year == year)
                .ToListAsync();

            var licenseMap = allLicenses
                .GroupBy(ul => ul.Usuario)
                .ToDictionary(
                    g => g.Key,
                    g => g.ToDictionary(ul => ul.Month, ul => new { ul.HasLicense, ul.ModifiedBy })
                );

            var result = allUsers.Select(u =>
            {
                var userLicenses = licenseMap.TryGetValue(u.Usuario, out var months) ? months : null;
                var licenses = new Dictionary<int, bool>();
                var modifiedBy = new Dictionary<int, string?>();
                for (int m = 1; m <= 12; m++)
                {
                    if (userLicenses != null && userLicenses.TryGetValue(m, out var lic))
                    {
                        licenses[m] = lic.HasLicense;
                        modifiedBy[m] = lic.ModifiedBy;
                    }
                    else
                    {
                        licenses[m] = false;
                        modifiedBy[m] = null;
                    }
                }
                return new { usuario = u.Usuario, equipo = u.Equipo, licenses, modifiedBy };
            }).ToList();

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting year view");
            return StatusCode(500, new { error = "Error interno del servidor." });
        }
    }

    /// <summary>
    /// Obtiene la lista de años disponibles en la tabla UserLicenses
    /// </summary>
    [HttpGet("years")]
    public async Task<ActionResult<List<int>>> GetAvailableYears()
    {
        try
        {
            var years = await _context.UserLicenses
                .Select(ul => ul.Year)
                .Distinct()
                .OrderByDescending(y => y)
                .ToListAsync();

            // Si no hay años, agregar el año actual por defecto
            if (!years.Any())
            {
                years.Add(DateTime.UtcNow.Year);
            }

            return Ok(years);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting available years");
            return StatusCode(500, new { error = "Error interno del servidor." });
        }
    }

    /// <summary>
    /// Obtiene todos los usuarios con su estado de licencia para un período específico (incluyendo usuarios sin licencia)
    /// </summary>
    [HttpGet("period/all")]
    public async Task<ActionResult> GetAllUsersWithLicenseStatus([FromQuery] int year, [FromQuery] int month)
    {
        try
        {
            // Obtener todos los usuarios
            var allUsers = await _context.Users
                .Select(u => u.Usuario)
                .Distinct()
                .OrderBy(u => u)
                .ToListAsync();

            // Obtener licencias del período
            var licenses = await _context.UserLicenses
                .Where(ul => ul.Year == year && ul.Month == month)
                .ToListAsync();

            var result = allUsers.Select(usuario => new
            {
                Usuario = usuario,
                Year = year,
                Month = month,
                HasLicense = licenses.FirstOrDefault(l => l.Usuario == usuario)?.HasLicense ?? false,
                ModifiedBy = licenses.FirstOrDefault(l => l.Usuario == usuario)?.ModifiedBy
            }).ToList();

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all users with license status");
            return StatusCode(500, new { error = "Error interno del servidor." });
        }
    }
}
