using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GitHubCopilotAPI.Models;

/// <summary>
/// Representa la asignación de licencia de GitHub Copilot a un usuario en un período específico (año/mes)
/// Permite gestión escalable de licencias multi-año y auditoría de cambios
/// </summary>
[Table("user_licenses")]
public class UserLicense
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    /// <summary>
    /// Nombre de usuario de GitHub (ej: daniel.barba)
    /// </summary>
    [Required]
    [MaxLength(100)]
    [Column("usuario")]
    public string Usuario { get; set; } = string.Empty;

    /// <summary>
    /// Año de la licencia (ej: 2026, 2027)
    /// </summary>
    [Required]
    [Column("year")]
    public int Year { get; set; }

    /// <summary>
    /// Mes de la licencia (1-12)
    /// </summary>
    [Required]
    [Column("month")]
    public int Month { get; set; }

    /// <summary>
    /// Indica si el usuario tiene licencia activa en este período
    /// </summary>
    [Required]
    [Column("has_license")]
    public bool HasLicense { get; set; }

    /// <summary>
    /// Origen de la modificación: "CSV_IMPORT" (carga masiva) o "MANUAL" (edición en UI)
    /// Permite proteger ediciones manuales al re-importar CSVs
    /// </summary>
    [MaxLength(50)]
    [Column("modified_by")]
    public string? ModifiedBy { get; set; }

    /// <summary>
    /// Fecha de creación/última modificación del registro
    /// </summary>
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
