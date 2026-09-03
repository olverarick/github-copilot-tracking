using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GitHubCopilotAPI.Models;

[Table("premium_requests")]
public class PremiumRequest
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("date")]
    public DateTime Date { get; set; }

    [Required]
    [Column("username")]
    [MaxLength(255)]
    public string Username { get; set; } = string.Empty;

    [Column("product")]
    [MaxLength(100)]
    public string? Product { get; set; }

    [Column("sku")]
    [MaxLength(100)]
    public string? Sku { get; set; }

    [Required]
    [Column("model")]
    [MaxLength(255)]
    public string Model { get; set; } = string.Empty;

    [Column("quantity")]
    public decimal Quantity { get; set; }

    [Column("unit_type")]
    [MaxLength(50)]
    public string? UnitType { get; set; }

    [Column("applied_cost_per_quantity")]
    public decimal AppliedCostPerQuantity { get; set; }

    [Column("gross_amount")]
    public decimal GrossAmount { get; set; }

    [Column("discount_amount")]
    public decimal DiscountAmount { get; set; }

    [Column("net_amount")]
    public decimal NetAmount { get; set; }

    [Column("exceeds_quota")]
    [MaxLength(10)]
    public string? ExceedsQuota { get; set; }

    [Column("total_monthly_quota")]
    public int TotalMonthlyQuota { get; set; } = 300;

    [Column("organization")]
    [MaxLength(255)]
    public string? Organization { get; set; }

    [Column("cost_center_name")]
    [MaxLength(255)]
    public string? CostCenterName { get; set; }

    [Column("upload_date")]
    public DateTime UploadDate { get; set; } = DateTime.UtcNow;
}
