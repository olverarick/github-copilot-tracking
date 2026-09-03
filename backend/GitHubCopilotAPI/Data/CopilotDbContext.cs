using Microsoft.EntityFrameworkCore;
using GitHubCopilotAPI.Models;

namespace GitHubCopilotAPI.Data;

public class CopilotDbContext : DbContext
{
    public CopilotDbContext(DbContextOptions<CopilotDbContext> options)
        : base(options)
    {
    }

    public DbSet<PremiumRequest> PremiumRequests { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Upload> Uploads { get; set; }
    public DbSet<UserLicense> UserLicenses { get; set; }
    public DbSet<UsageQuotaRule> UsageQuotaRules { get; set; }
    public DbSet<AppUser> AppUsers { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Índices para mejorar performance de consultas
        modelBuilder.Entity<PremiumRequest>()
            .HasIndex(p => p.Username)
            .HasDatabaseName("IX_PremiumRequests_Username");

        modelBuilder.Entity<PremiumRequest>()
            .HasIndex(p => p.Date)
            .HasDatabaseName("IX_PremiumRequests_Date");

        modelBuilder.Entity<PremiumRequest>()
            .HasIndex(p => p.Model)
            .HasDatabaseName("IX_PremiumRequests_Model");

        // Índice compuesto para validación de duplicados (optimización clave)
        modelBuilder.Entity<PremiumRequest>()
            .HasIndex(p => new { p.Date, p.Username, p.Model, p.Quantity, p.NetAmount })
            .HasDatabaseName("IX_PremiumRequests_DuplicateCheck");

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Usuario)
            .IsUnique()
            .HasDatabaseName("IX_Users_Usuario");

        // Índice único compuesto para UserLicense: un usuario solo puede tener un registro por año/mes
        modelBuilder.Entity<UserLicense>()
            .HasIndex(ul => new { ul.Usuario, ul.Year, ul.Month })
            .IsUnique()
            .HasDatabaseName("IX_UserLicenses_Usuario_Year_Month");

        modelBuilder.Entity<UsageQuotaRule>()
            .HasIndex(r => new { r.Year, r.Month })
            .IsUnique()
            .HasDatabaseName("IX_UsageQuotaRules_Year_Month");

        modelBuilder.Entity<AppUser>()
            .HasIndex(u => u.Username)
            .IsUnique()
            .HasDatabaseName("IX_AppUsers_Username");

        // Configuración de precisión decimal para montos
        modelBuilder.Entity<PremiumRequest>()
            .Property(p => p.AppliedCostPerQuantity)
            .HasPrecision(18, 4);

        modelBuilder.Entity<PremiumRequest>()
            .Property(p => p.GrossAmount)
            .HasPrecision(18, 4);

        modelBuilder.Entity<PremiumRequest>()
            .Property(p => p.DiscountAmount)
            .HasPrecision(18, 4);

        modelBuilder.Entity<PremiumRequest>()
            .Property(p => p.NetAmount)
            .HasPrecision(18, 4);
    }
}
