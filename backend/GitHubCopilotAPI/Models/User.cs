using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GitHubCopilotAPI.Models;

[Table("users")]
public class User
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("nombre")]
    [MaxLength(255)]
    public string? Nombre { get; set; }

    [Required]
    [Column("usuario")]
    [MaxLength(255)]
    public string Usuario { get; set; } = string.Empty;

    [Column("correo")]
    [MaxLength(255)]
    public string? Correo { get; set; }

    [Required]
    [Column("equipo")]
    [MaxLength(100)]
    public string Equipo { get; set; } = string.Empty;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
