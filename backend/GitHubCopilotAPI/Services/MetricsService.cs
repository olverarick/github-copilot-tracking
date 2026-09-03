using GitHubCopilotAPI.Data;

namespace GitHubCopilotAPI.Services;

public interface IMetricsService
{
    string GetCategoryLabel(decimal requests, int monthlyQuota);
    decimal CalculateUsagePercentage(decimal requests, int monthlyQuota);
}

public class MetricsService : IMetricsService
{
    /// <summary>
    /// Obtiene la categoría de uso basada en el número de requests
    /// </summary>
    /// <param name="requests">Total de requests utilizados</param>
    /// <param name="monthlyQuota">Cuota mensual aplicable al período</param>
    /// <returns>Categoría de uso: SIN USO, USO BAJO, USO MODERADO, USO ALTO</returns>
    public string GetCategoryLabel(decimal requests, int monthlyQuota)
    {
        if (monthlyQuota <= 0)
            return "SIN USO";

        var lowThreshold = monthlyQuota * 0.4m;
        var mediumThreshold = monthlyQuota * 0.7m;

        return requests switch
        {
            0 => "SIN USO",
            _ when requests < lowThreshold => "USO BAJO (<40%)",
            _ when requests < mediumThreshold => "USO MODERADO (40-70%)",
            _ => "USO ALTO (>70%)"
        };
    }

    /// <summary>
    /// Calcula el porcentaje de uso respecto al quota mensual
    /// </summary>
    /// <param name="requests">Total de requests utilizados</param>
    /// <param name="monthlyQuota">Cuota mensual aplicable al período</param>
    /// <returns>Porcentaje de uso</returns>
    public decimal CalculateUsagePercentage(decimal requests, int monthlyQuota)
    {
        if (monthlyQuota == 0)
            return 0m;

        return Math.Round(requests / monthlyQuota * 100, 2);
    }
}
