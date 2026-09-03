using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GitHubCopilotAPI.Models;

[Table("usage_quota_rules")]
public class UsageQuotaRule
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("year")]
    public int Year { get; set; }

    [Required]
    [Column("month")]
    public int Month { get; set; }

    [Required]
    [Column("monthly_quota")]
    public int MonthlyQuota { get; set; }

    [Required]
    [MaxLength(100)]
    [Column("quota_label")]
    public string QuotaLabel { get; set; } = "IA credits";

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}