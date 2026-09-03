using Microsoft.EntityFrameworkCore;
using GitHubCopilotAPI.Data;
using GitHubCopilotAPI.Models;
using GitHubCopilotAPI.Models.DTOs;

namespace GitHubCopilotAPI.Services;

public interface IUsageQuotaService
{
    Task<UsageQuotaResolutionDto> ResolveAsync(int? year, int? month, CancellationToken cancellationToken = default);
    Task<List<UsageQuotaDto>> ListAsync(CancellationToken cancellationToken = default);
    Task<UsageQuotaDto> UpsertAsync(UsageQuotaUpsertDto dto, CancellationToken cancellationToken = default);
}

public class UsageQuotaService : IUsageQuotaService
{
    private readonly CopilotDbContext _context;

    public UsageQuotaService(CopilotDbContext context)
    {
        _context = context;
    }

    public async Task<UsageQuotaResolutionDto> ResolveAsync(int? year, int? month, CancellationToken cancellationToken = default)
    {
        var ruleQuery = _context.UsageQuotaRules.AsNoTracking().AsQueryable();

        if (year.HasValue && month.HasValue)
        {
            ruleQuery = ruleQuery.Where(r => r.Year < year.Value || (r.Year == year.Value && r.Month <= month.Value));
        }
        else if (year.HasValue)
        {
            ruleQuery = ruleQuery.Where(r => r.Year <= year.Value);
        }
        else if (month.HasValue)
        {
            ruleQuery = ruleQuery.Where(r => r.Month == month.Value);
        }

        var rule = await ruleQuery
            .OrderByDescending(r => r.Year)
            .ThenByDescending(r => r.Month)
            .FirstOrDefaultAsync(cancellationToken);

        if (rule != null)
        {
            return new UsageQuotaResolutionDto
            {
                Year = rule.Year,
                Month = rule.Month,
                MonthlyQuota = rule.MonthlyQuota,
                QuotaLabel = rule.QuotaLabel,
                IsFallback = false
            };
        }

        var requestQuery = _context.PremiumRequests.AsNoTracking().AsQueryable();

        if (year.HasValue && month.HasValue)
        {
            requestQuery = requestQuery.Where(p => p.Date.Year == year.Value && p.Date.Month == month.Value);
        }
        else if (year.HasValue)
        {
            requestQuery = requestQuery.Where(p => p.Date.Year == year.Value);
        }
        else if (month.HasValue)
        {
            requestQuery = requestQuery.Where(p => p.Date.Month == month.Value);
        }

        // Some historical CSVs contain invalid sentinel values (e.g. int.MaxValue).
        // Keep historical behavior stable by ignoring unrealistic quotas.
        var fallbackQuota = await requestQuery
            .Where(p => p.TotalMonthlyQuota > 0 && p.TotalMonthlyQuota <= 100000)
            .Select(p => p.TotalMonthlyQuota)
            .Distinct()
            .ToListAsync(cancellationToken);

        var resolvedQuota = fallbackQuota.Count switch
        {
            1 => fallbackQuota[0],
            > 1 => fallbackQuota.Max(),
            _ => 300
        };

        var label = resolvedQuota > 300 ? "IA credits" : "Premium requests";

        return new UsageQuotaResolutionDto
        {
            Year = year ?? 0,
            Month = month ?? 0,
            MonthlyQuota = resolvedQuota,
            QuotaLabel = label,
            IsFallback = true
        };
    }

    public async Task<List<UsageQuotaDto>> ListAsync(CancellationToken cancellationToken = default)
    {
        return await _context.UsageQuotaRules
            .AsNoTracking()
            .OrderByDescending(r => r.Year)
            .ThenByDescending(r => r.Month)
            .Select(r => new UsageQuotaDto
            {
                Year = r.Year,
                Month = r.Month,
                MonthlyQuota = r.MonthlyQuota,
                QuotaLabel = r.QuotaLabel,
                UpdatedAt = r.UpdatedAt
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<UsageQuotaDto> UpsertAsync(UsageQuotaUpsertDto dto, CancellationToken cancellationToken = default)
    {
        var existing = await _context.UsageQuotaRules
            .FirstOrDefaultAsync(r => r.Year == dto.Year && r.Month == dto.Month, cancellationToken);

        var label = string.IsNullOrWhiteSpace(dto.QuotaLabel)
            ? (dto.MonthlyQuota > 300 ? "IA credits" : "Premium requests")
            : dto.QuotaLabel.Trim();

        if (existing == null)
        {
            existing = new UsageQuotaRule
            {
                Year = dto.Year,
                Month = dto.Month,
                MonthlyQuota = dto.MonthlyQuota,
                QuotaLabel = label
            };
            _context.UsageQuotaRules.Add(existing);
        }
        else
        {
            existing.MonthlyQuota = dto.MonthlyQuota;
            existing.QuotaLabel = label;
            existing.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        return new UsageQuotaDto
        {
            Year = existing.Year,
            Month = existing.Month,
            MonthlyQuota = existing.MonthlyQuota,
            QuotaLabel = existing.QuotaLabel,
            UpdatedAt = existing.UpdatedAt
        };
    }
}