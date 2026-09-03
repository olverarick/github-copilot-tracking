using CsvHelper;
using CsvHelper.Configuration;
using System.Globalization;
using GitHubCopilotAPI.Models;
using GitHubCopilotAPI.Data;
using Microsoft.EntityFrameworkCore;

namespace GitHubCopilotAPI.Services;

public interface ICsvParserService
{
    Task<List<PremiumRequest>> ParsePremiumRequestsCsvAsync(Stream stream);
    Task<(List<User> users, int newLicenses, int updatedLicenses, int protectedLicenses)> ParseTeamCsvAsync(Stream stream, string teamName, int year);
}

public class CsvParserService : ICsvParserService
{
    private readonly ILogger<CsvParserService> _logger;
    private readonly CopilotDbContext _context;

    public CsvParserService(ILogger<CsvParserService> logger, CopilotDbContext context)
    {
        _logger = logger;
        _context = context;
    }

    public async Task<List<PremiumRequest>> ParsePremiumRequestsCsvAsync(Stream stream)
    {
        using var reader = new StreamReader(stream);
        using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HasHeaderRecord = true,
            MissingFieldFound = null,
            HeaderValidated = null,
            TrimOptions = TrimOptions.Trim
        });

        var records = new List<PremiumRequest>();
        
        try
        {
            await csv.ReadAsync();
            csv.ReadHeader();

            while (await csv.ReadAsync())
            {
                try
                {
                    var record = new PremiumRequest
                    {
                        Date = ParseDate(csv.GetField("date")),
                        Username = csv.GetField("username")?.ToLower() ?? string.Empty,
                        Product = csv.GetField("product"),
                        Sku = csv.GetField("sku"),
                        Model = csv.GetField("model") ?? string.Empty,
                        Quantity = ParseDecimal(csv.GetField("quantity")),
                        UnitType = csv.GetField("unit_type"),
                        AppliedCostPerQuantity = ParseDecimal(csv.GetField("applied_cost_per_quantity")),
                        GrossAmount = ParseDecimal(csv.GetField("gross_amount")),
                        DiscountAmount = ParseDecimal(csv.GetField("discount_amount")),
                        NetAmount = ParseDecimal(csv.GetField("net_amount")),
                        ExceedsQuota = csv.GetField("exceeds_quota"),
                        TotalMonthlyQuota = ParseInt(csv.GetField("total_monthly_quota"), 300),
                        Organization = csv.GetField("organization"),
                        CostCenterName = csv.GetField("cost_center_name"),
                        UploadDate = DateTime.UtcNow
                    };

                    records.Add(record);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error parsing row {Row}", csv.Context.Parser.Row);
                    // Continuar con el siguiente registro
                }
            }

            _logger.LogInformation("Successfully parsed {Count} records from CSV", records.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading CSV file");
            throw new InvalidDataException("Error al leer el archivo CSV. Verifique el formato.", ex);
        }

        return records;
    }

    public async Task<(List<User> users, int newLicenses, int updatedLicenses, int protectedLicenses)> ParseTeamCsvAsync(Stream stream, string teamName, int year)
    {
        using var reader = new StreamReader(stream);
        using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HasHeaderRecord = true,
            MissingFieldFound = null,
            TrimOptions = TrimOptions.Trim
        });

        var users = new List<User>();
        var licensesToProcess = new List<(string usuario, int month, bool hasLicense)>();

        try
        {
            await csv.ReadAsync();
            csv.ReadHeader();

            // Nombres de los meses en español
            var monthNames = new[] { "enero", "febrero", "marzo", "abril", "mayo", "junio", 
                                    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre" };

            while (await csv.ReadAsync())
            {
                try
                {
                    var usuario = csv.GetField("usuario")?.ToLower() ?? string.Empty;
                    
                    if (string.IsNullOrWhiteSpace(usuario))
                        continue;

                    var user = new User
                    {
                        Nombre = csv.GetField("nombre"),
                        Usuario = usuario,
                        Correo = csv.GetField("correo"),
                        Equipo = teamName,
                        CreatedAt = DateTime.UtcNow
                    };

                    users.Add(user);

                    // Procesar licencias por mes
                    for (int month = 1; month <= 12; month++)
                    {
                        var monthName = monthNames[month - 1];
                        var licenseValue = csv.GetField(monthName);
                        
                        if (!string.IsNullOrWhiteSpace(licenseValue))
                        {
                            var hasLicense = ParseLicenciaValue(licenseValue);
                            licensesToProcess.Add((usuario, month, hasLicense));
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error parsing user row {Row}", csv.Context.Parser.Row);
                }
            }

            _logger.LogInformation("Parsed {UserCount} users and {LicenseCount} licenses from team CSV", 
                users.Count, licensesToProcess.Count);

            // Procesar licencias con UPSERT inteligente
            int newLicenses = 0;
            int updatedLicenses = 0;
            int protectedLicenses = 0;

            foreach (var (usuario, month, hasLicense) in licensesToProcess)
            {
                var existing = await _context.UserLicenses
                    .FirstOrDefaultAsync(ul => ul.Usuario == usuario && ul.Year == year && ul.Month == month);

                if (existing == null)
                {
                    // No existe: crear nuevo registro
                    _context.UserLicenses.Add(new UserLicense
                    {
                        Usuario = usuario,
                        Year = year,
                        Month = month,
                        HasLicense = hasLicense,
                        ModifiedBy = "CSV_IMPORT",
                        CreatedAt = DateTime.UtcNow
                    });
                    newLicenses++;
                }
                else if (existing.ModifiedBy == "CSV_IMPORT" || existing.ModifiedBy == null)
                {
                    // Existe y fue importado por CSV: actualizar
                    existing.HasLicense = hasLicense;
                    existing.ModifiedBy = "CSV_IMPORT";
                    existing.CreatedAt = DateTime.UtcNow;
                    updatedLicenses++;
                }
                else
                {
                    // Existe y fue modificado manualmente: NO tocar
                    protectedLicenses++;
                    _logger.LogDebug("Protected manual edit for {Usuario} {Year}-{Month}", usuario, year, month);
                }
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("License processing: {New} new, {Updated} updated, {Protected} protected", 
                newLicenses, updatedLicenses, protectedLicenses);

            return (users, newLicenses, updatedLicenses, protectedLicenses);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading team CSV file");
            throw new InvalidDataException("Error al leer el archivo CSV de equipo.", ex);
        }
    }

    private static bool ParseLicenciaValue(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return false;

        var trimmed = value.Trim().ToUpper();
        return trimmed == "SI" || trimmed == "SÍ" || trimmed == "YES";
    }

    private static DateTime ParseDate(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return DateTime.UtcNow;

        if (DateTime.TryParse(value, out var date))
            return date;

        return DateTime.UtcNow;
    }

    private static int ParseInt(string? value, int defaultValue = 0)
    {
        if (string.IsNullOrWhiteSpace(value))
            return defaultValue;

        if (int.TryParse(value, out var result))
            return result;

        return defaultValue;
    }

    private static decimal ParseDecimal(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return 0m;

        if (decimal.TryParse(value, NumberStyles.Any, CultureInfo.InvariantCulture, out var result))
            return result;

        return 0m;
    }
}
