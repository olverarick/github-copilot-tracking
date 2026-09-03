using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GitHubCopilotAPI.Models;

[Table("uploads")]
public class Upload
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("filename")]
    [MaxLength(500)]
    public string Filename { get; set; } = string.Empty;

    [Column("record_count")]
    public int RecordCount { get; set; }

    [Column("upload_date")]
    public DateTime UploadDate { get; set; } = DateTime.UtcNow;

    [Column("period_start")]
    public DateTime? PeriodStart { get; set; }

    [Column("period_end")]
    public DateTime? PeriodEnd { get; set; }
}
