namespace GitHubCopilotAPI.Models.DTOs;

public class UserMetricsDto
{
    public string Username { get; set; } = string.Empty;
    /// <summary>Nombre completo desde la tabla Users. Null si el usuario solo existe en PremiumRequests.</summary>
    public string? Nombre { get; set; }
    /// <summary>Correo institucional desde la tabla Users. Null si el usuario solo existe en PremiumRequests.</summary>
    public string? Correo { get; set; }
    public string Equipo { get; set; } = string.Empty;
    public decimal TotalRequests { get; set; }
    public int DiasActivos { get; set; }
    public decimal CostoTotal { get; set; }
    public DateTime? FirstDate { get; set; }
    public DateTime? LastDate { get; set; }
    public decimal PorcentajeUso { get; set; }
    public string CategoriaUso { get; set; } = string.Empty;
    public int MonthlyQuota { get; set; }
    public string QuotaLabel { get; set; } = string.Empty;
}

public class TimelineDto
{
    public string Username { get; set; } = string.Empty;
    public Dictionary<string, List<TimelineEntry>> Timeline { get; set; } = new();
    public List<TimelineRawEntry> Raw { get; set; } = new();
}

public class TimelineEntry
{
    public string Model { get; set; } = string.Empty;
    public decimal Requests { get; set; }
    public decimal Cost { get; set; }
}

public class TimelineRawEntry
{
    public string Date { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public decimal Requests { get; set; }
    public decimal Cost { get; set; }
}

public class UserModelDto
{
    public string Model { get; set; } = string.Empty;
    public decimal TotalRequests { get; set; }
    public decimal TotalCost { get; set; }
    public int DiasUso { get; set; }
    public decimal Percentage { get; set; }
}

public class SummaryDto
{
    public decimal TotalRequests { get; set; }
    public int TotalUsers { get; set; }
    public int ActiveUsers { get; set; }
    public decimal TotalCost { get; set; }
}

public class TeamMetricsDto
{
    public string Equipo { get; set; } = string.Empty;
    public int UsuariosActivos { get; set; }
    public decimal TotalRequests { get; set; }
    public decimal CostoTotal { get; set; }
}

public class ModelMetricsDto
{
    public string Model { get; set; } = string.Empty;
    public decimal TotalRequests { get; set; }
    public int Usuarios { get; set; }
    public decimal TotalCost { get; set; }
}

public class DailyTrendDto
{
    public string Date { get; set; } = string.Empty;
    public decimal Requests { get; set; }
    public int Usuarios { get; set; }
    public decimal Cost { get; set; }
}

public class UsageQuotaDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public int MonthlyQuota { get; set; }
    public string QuotaLabel { get; set; } = string.Empty;
    public DateTime? UpdatedAt { get; set; }
}

public class UsageQuotaUpsertDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public int MonthlyQuota { get; set; }
    public string? QuotaLabel { get; set; }
}

public class UsageQuotaResolutionDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public int MonthlyQuota { get; set; }
    public string QuotaLabel { get; set; } = string.Empty;
    public bool IsFallback { get; set; }
}
