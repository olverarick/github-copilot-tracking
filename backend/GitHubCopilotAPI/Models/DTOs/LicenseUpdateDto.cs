using System.ComponentModel.DataAnnotations;

namespace GitHubCopilotAPI.Models.DTOs;

/// <summary>
/// DTO para actualizar licencias de usuarios desde la UI de administración
/// </summary>
public class LicenseUpdateDto
{
    [Required]
    [MaxLength(100)]
    public string Usuario { get; set; } = string.Empty;

    [Required]
    [Range(2020, 2100)]
    public int Year { get; set; }

    [Required]
    [Range(1, 12)]
    public int Month { get; set; }

    [Required]
    public bool HasLicense { get; set; }
}

/// <summary>
/// DTO para respuesta de consulta de licencias por período
/// </summary>
public class UserLicenseDto
{
    public string Usuario { get; set; } = string.Empty;
    public int Year { get; set; }
    public int Month { get; set; }
    public bool HasLicense { get; set; }
    public string? ModifiedBy { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// DTO para respuesta de todas las licencias de un usuario en un año
/// </summary>
public class UserYearLicensesDto
{
    public string Usuario { get; set; } = string.Empty;
    public int Year { get; set; }
    public Dictionary<int, bool?> Months { get; set; } = new(); // Mes (1-12) -> HasLicense (null si no existe registro)
}
