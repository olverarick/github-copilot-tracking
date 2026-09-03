using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GitHubCopilotAPI.Data;
using GitHubCopilotAPI.Models.DTOs;
using GitHubCopilotAPI.Services;

namespace GitHubCopilotAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MetricsController : ControllerBase
{
    private readonly CopilotDbContext _context;
    private readonly IMetricsService _metricsService;
    private readonly IUsageQuotaService _usageQuotaService;
    private readonly ILogger<MetricsController> _logger;

    public MetricsController(
        CopilotDbContext context,
        IMetricsService metricsService,
        IUsageQuotaService usageQuotaService,
        ILogger<MetricsController> logger)
    {
        _context = context;
        _metricsService = metricsService;
        _usageQuotaService = usageQuotaService;
        _logger = logger;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<SummaryDto>> GetSummary([FromQuery] int? year = null, [FromQuery] int? month = null)
    {
        try
        {
            var query = _context.PremiumRequests.AsQueryable();

            // Aplicar filtro de fecha si se especifica
            if (year.HasValue && month.HasValue)
            {
                query = query.Where(p => p.Date.Year == year.Value && p.Date.Month == month.Value);
            }
            else if (year.HasValue)
            {
                query = query.Where(p => p.Date.Year == year.Value);
            }

            var totalRequests = (decimal)await query.SumAsync(p => (double)p.Quantity);
            var totalUsers = await query.Select(p => p.Username).Distinct().CountAsync();
            var activeUsers = await query.Where(p => p.Quantity > 0).Select(p => p.Username).Distinct().CountAsync();
            var totalCost = (decimal)await query.SumAsync(p => (double)p.NetAmount);

            return Ok(new SummaryDto
            {
                TotalRequests = totalRequests,
                TotalUsers = totalUsers,
                ActiveUsers = activeUsers,
                TotalCost = totalCost
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting summary");
            return StatusCode(500, new { error = "Error interno del servidor." });
        }
    }

    [HttpGet("users")]
    public async Task<ActionResult<List<UserMetricsDto>>> GetUsers([FromQuery] int? year = null, [FromQuery] int? month = null)
    {
        try
        {
            // Verificar si hay usuarios en la tabla Users
            var hasUsers = await _context.Users.AnyAsync();
            var quota = await _usageQuotaService.ResolveAsync(year, month);
            var monthlyQuota = quota.MonthlyQuota;
            var quotaLabel = quota.QuotaLabel;

            // Construir query de requests con filtro de fecha
            var requestsQuery = _context.PremiumRequests.AsQueryable();
            if (year.HasValue && month.HasValue)
            {
                requestsQuery = requestsQuery.Where(p => p.Date.Year == year.Value && p.Date.Month == month.Value);
            }
            else if (year.HasValue)
            {
                requestsQuery = requestsQuery.Where(p => p.Date.Year == year.Value);
            }

            List<UserMetricsDto> users;

            if (hasUsers)
            {
                // Obtener usuarios con licencia para el período especificado
                var usersQuery = _context.Users.AsQueryable();

                // Si se especifica year y month, hacer JOIN con UserLicenses para filtrar
                if (year.HasValue && month.HasValue)
                {
                    var licensedUsers = await _context.UserLicenses
                        .Where(ul => ul.Year == year.Value && ul.Month == month.Value && ul.HasLicense)
                        .Select(ul => ul.Usuario)
                        .Distinct()
                        .ToListAsync();

                    usersQuery = usersQuery.Where(u => licensedUsers.Contains(u.Usuario));
                }
                else if (month.HasValue)
                {
                    // Si solo se especifica mes, usar el año más reciente disponible para ese mes
                    var latestYear = await _context.UserLicenses
                        .Where(ul => ul.Month == month.Value)
                        .MaxAsync(ul => (int?)ul.Year);

                    if (latestYear.HasValue)
                    {
                        var licensedUsers = await _context.UserLicenses
                            .Where(ul => ul.Year == latestYear.Value && ul.Month == month.Value && ul.HasLicense)
                            .Select(ul => ul.Usuario)
                            .Distinct()
                            .ToListAsync();

                        usersQuery = usersQuery.Where(u => licensedUsers.Contains(u.Usuario));
                    }
                }

                // LEFT JOIN: Todos los usuarios (filtrados por licencia), con o sin requests
                var usersData = await usersQuery
                    .GroupJoin(
                        requestsQuery,
                        u => u.Usuario,
                        p => p.Username,
                        (u, pr) => new { User = u, Requests = pr }
                    )
                    .SelectMany(
                        x => x.Requests.DefaultIfEmpty(),
                        (x, pr) => new { x.User, Request = pr }
                    )
                    .ToListAsync();

                // Agrupar y calcular en memoria
                users = usersData
                    .GroupBy(x => x.User.Usuario)
                    .Select(g => new UserMetricsDto
                    {
                        Username = g.Key,
                        Nombre = g.First().User.Nombre,
                        Correo = g.First().User.Correo,
                        Equipo = g.First().User.Equipo ?? string.Empty,
                        TotalRequests = (decimal)g.Where(x => x.Request != null).Sum(x => (double)x.Request!.Quantity),
                        DiasActivos = g.Where(x => x.Request != null).Select(x => x.Request!.Date.Date).Distinct().Count(),
                        CostoTotal = (decimal)g.Where(x => x.Request != null).Sum(x => (double)x.Request!.NetAmount),
                        FirstDate = g.Any(x => x.Request != null) ? g.Where(x => x.Request != null).Min(x => x.Request!.Date) : (DateTime?)null,
                        LastDate = g.Any(x => x.Request != null) ? g.Where(x => x.Request != null).Max(x => x.Request!.Date) : (DateTime?)null,
                        PorcentajeUso = _metricsService.CalculateUsagePercentage(g.Where(x => x.Request != null).Sum(x => x.Request!.Quantity), monthlyQuota),
                        CategoriaUso = string.Empty,
                        MonthlyQuota = monthlyQuota,
                        QuotaLabel = quotaLabel
                    })
                    .OrderByDescending(u => u.TotalRequests)
                    .ToList();
            }
            else
            {
                // Si no hay usuarios, mostrar los de PremiumRequests
                var requestsData = await requestsQuery
                    .GroupBy(p => p.Username)
                    .Select(g => new
                    {
                        Username = g.Key,
                        TotalRequests = (decimal)g.Sum(p => (double)p.Quantity),
                        DiasActivos = g.Select(p => p.Date.Date).Distinct().Count(),
                        CostoTotal = (decimal)g.Sum(p => (double)p.NetAmount),
                        FirstDate = g.Min(p => p.Date),
                        LastDate = g.Max(p => p.Date)
                    })
                    .ToListAsync();

                users = requestsData
                    .Select(r => new UserMetricsDto
                    {
                        Username = r.Username,
                        TotalRequests = r.TotalRequests,
                        DiasActivos = r.DiasActivos,
                        CostoTotal = r.CostoTotal,
                        FirstDate = r.FirstDate,
                        LastDate = r.LastDate,
                        PorcentajeUso = _metricsService.CalculateUsagePercentage(r.TotalRequests, monthlyQuota),
                        CategoriaUso = string.Empty,
                        MonthlyQuota = monthlyQuota,
                        QuotaLabel = quotaLabel
                    })
                    .OrderByDescending(u => u.TotalRequests)
                    .ToList();
            }

            // Asignar categoría usando el servicio
            users.ForEach(u =>
            {
                u.CategoriaUso = _metricsService.GetCategoryLabel(u.TotalRequests, monthlyQuota);
                u.MonthlyQuota = monthlyQuota;
                u.QuotaLabel = quotaLabel;
            });

            return Ok(users);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting users");
            return StatusCode(500, new { error = "Error interno del servidor." });
        }
    }

    [HttpGet("users/{username}/timeline")]
    public async Task<ActionResult<TimelineDto>> GetUserTimeline(string username, [FromQuery] int? year = null, [FromQuery] int? month = null)
    {
        try
        {
            username = username.ToLower();

            // Traer datos sin formatear fecha (EF no puede traducir ToString)
            var query = _context.PremiumRequests.Where(p => p.Username == username);
            if (year.HasValue && month.HasValue)
                query = query.Where(p => p.Date.Year == year.Value && p.Date.Month == month.Value);
            else if (year.HasValue)
                query = query.Where(p => p.Date.Year == year.Value);
            else if (month.HasValue)
                query = query.Where(p => p.Date.Month == month.Value);

            var timelineData = await query
                .GroupBy(p => new { p.Date, p.Model })
                .Select(g => new
                {
                    DateValue = g.Key.Date,
                    Model = g.Key.Model,
                    Requests = (decimal)g.Sum(p => (double)p.Quantity),
                    Cost = (decimal)g.Sum(p => (double)p.NetAmount)
                })
                .OrderBy(t => t.DateValue)
                .ThenBy(t => t.Model)
                .ToListAsync();

            if (!timelineData.Any())
            {
                return NotFound(new { error = $"No data found for user {username}" });
            }

            // Formatear fechas en memoria
            var timeline = timelineData.Select(t => new TimelineRawEntry
            {
                Date = t.DateValue.ToString("yyyy-MM-dd"),
                Model = t.Model,
                Requests = t.Requests,
                Cost = t.Cost
            }).ToList();

            // Organizar por fecha
            var timelineByDate = timeline
                .GroupBy(t => t.Date)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(t => new TimelineEntry
                    {
                        Model = t.Model,
                        Requests = t.Requests,
                        Cost = t.Cost
                    }).ToList()
                );

            return Ok(new TimelineDto
            {
                Username = username,
                Timeline = timelineByDate,
                Raw = timeline
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user timeline for {Username}", username);
            return StatusCode(500, new { error = "Error interno del servidor." });
        }
    }

    [HttpGet("users/{username}/models")]
    public async Task<ActionResult<List<UserModelDto>>> GetUserModels(string username, [FromQuery] int? year = null, [FromQuery] int? month = null)
    {
        try
        {
            username = username.ToLower();

            var reqQuery = _context.PremiumRequests.Where(p => p.Username == username);
            if (year.HasValue && month.HasValue)
                reqQuery = reqQuery.Where(p => p.Date.Year == year.Value && p.Date.Month == month.Value);
            else if (year.HasValue)
                reqQuery = reqQuery.Where(p => p.Date.Year == year.Value);
            else if (month.HasValue)
                reqQuery = reqQuery.Where(p => p.Date.Month == month.Value);

            var models = await reqQuery
                .GroupBy(p => p.Model)
                .Select(g => new UserModelDto
                {
                    Model = g.Key,
                    TotalRequests = (decimal)g.Sum(p => (double)p.Quantity),
                    TotalCost = (decimal)g.Sum(p => (double)p.NetAmount),
                    DiasUso = g.Select(p => p.Date.Date).Distinct().Count(),
                    Percentage = 0 // Se calcula después
                })
                .ToListAsync();

            // Ordenar en memoria
            models = models.OrderByDescending(m => m.TotalRequests).ToList();

            if (!models.Any())
            {
                return NotFound(new { error = $"No data found for user {username}" });
            }

            var totalRequests = models.Sum(m => m.TotalRequests);
            models.ForEach(m => m.Percentage = totalRequests > 0
                ? Math.Round((decimal)m.TotalRequests / totalRequests * 100, 2)
                : 0);

            return Ok(models);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user models for {Username}", username);
            return StatusCode(500, new { error = "Error interno del servidor." });
        }
    }

    [HttpGet("teams")]
    public async Task<ActionResult<List<TeamMetricsDto>>> GetTeams([FromQuery] int? year = null, [FromQuery] int? month = null)
    {
        try
        {
            // Construir query de requests con filtro de fecha
            var requestsQuery = _context.PremiumRequests.AsQueryable();
            if (year.HasValue && month.HasValue)
            {
                requestsQuery = requestsQuery.Where(p => p.Date.Year == year.Value && p.Date.Month == month.Value);
            }
            else if (year.HasValue)
            {
                requestsQuery = requestsQuery.Where(p => p.Date.Year == year.Value);
            }

            var teams = await _context.Users
                .GroupJoin(
                    requestsQuery,
                    u => u.Usuario,
                    p => p.Username,
                    (u, pr) => new { User = u, Requests = pr }
                )
                .SelectMany(
                    x => x.Requests.DefaultIfEmpty(),
                    (x, pr) => new { x.User, Request = pr }
                )
                .GroupBy(x => x.User.Equipo)
                .Select(g => new TeamMetricsDto
                {
                    Equipo = g.Key,
                    UsuariosActivos = g.Where(x => x.Request != null).Select(x => x.Request!.Username).Distinct().Count(),
                    TotalRequests = (decimal)g.Where(x => x.Request != null).Sum(x => (double)x.Request!.Quantity),
                    CostoTotal = (decimal)g.Where(x => x.Request != null).Sum(x => (double)x.Request!.NetAmount)
                })
                .ToListAsync();

            // Ordenar en memoria
            teams = teams.OrderByDescending(t => t.TotalRequests).ToList();

            return Ok(teams);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting teams");
            return StatusCode(500, new { error = "Error interno del servidor." });
        }
    }

    [HttpGet("models")]
    public async Task<ActionResult<List<ModelMetricsDto>>> GetModels([FromQuery] int? year = null, [FromQuery] int? month = null)
    {
        try
        {
            var query = _context.PremiumRequests.AsQueryable();

            // Aplicar filtro de fecha si se especifica
            if (year.HasValue && month.HasValue)
            {
                query = query.Where(p => p.Date.Year == year.Value && p.Date.Month == month.Value);
            }
            else if (year.HasValue)
            {
                query = query.Where(p => p.Date.Year == year.Value);
            }

            var models = await query
                .GroupBy(p => p.Model)
                .Select(g => new ModelMetricsDto
                {
                    Model = g.Key,
                    TotalRequests = (decimal)g.Sum(p => (double)p.Quantity),
                    Usuarios = g.Select(p => p.Username).Distinct().Count(),
                    TotalCost = (decimal)g.Sum(p => (double)p.NetAmount)
                })
                .ToListAsync();

            // Ordenar en memoria
            models = models.OrderByDescending(m => m.TotalRequests).ToList();

            return Ok(models);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting models");
            return StatusCode(500, new { error = "Error interno del servidor." });
        }
    }

    [HttpGet("daily-trend")]
    public async Task<ActionResult<List<DailyTrendDto>>> GetDailyTrend([FromQuery] int? year = null, [FromQuery] int? month = null)
    {
        try
        {
            var query = _context.PremiumRequests.AsQueryable();

            // Aplicar filtro de fecha si se especifica
            if (year.HasValue && month.HasValue)
            {
                query = query.Where(p => p.Date.Year == year.Value && p.Date.Month == month.Value);
            }
            else if (year.HasValue)
            {
                query = query.Where(p => p.Date.Year == year.Value);
            }

            // Traer datos primero sin formatear fecha (EF no puede traducir ToString)
            var trendData = await query
                .GroupBy(p => p.Date.Date)
                .Select(g => new
                {
                    DateValue = g.Key,
                    Requests = (decimal)g.Sum(p => (double)p.Quantity),
                    Usuarios = g.Select(p => p.Username).Distinct().Count(),
                    Cost = (decimal)g.Sum(p => (double)p.NetAmount)
                })
                .OrderBy(t => t.DateValue)
                .ToListAsync();

            // Formatear fechas en memoria
            var trend = trendData.Select(t => new DailyTrendDto
            {
                Date = t.DateValue.ToString("yyyy-MM-dd"),
                Requests = t.Requests,
                Usuarios = t.Usuarios,
                Cost = t.Cost
            }).ToList();

            return Ok(trend);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting daily trend");
            return StatusCode(500, new { error = "Error interno del servidor." });
        }
    }

    [HttpGet("available-periods")]
    public async Task<ActionResult<object>> GetAvailablePeriods()
    {
        try
        {
            var periods = await _context.PremiumRequests
                .Select(p => new { p.Date.Year, p.Date.Month })
                .Distinct()
                .OrderByDescending(p => p.Year)
                .ThenByDescending(p => p.Month)
                .ToListAsync();

            var result = periods.Select(p => new
            {
                Year = p.Year,
                Month = p.Month,
                Label = $"{GetMonthName(p.Month)} {p.Year}"
            }).ToList();

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting available periods");
            return StatusCode(500, new { error = "Error interno del servidor." });
        }
    }

    private static string GetMonthName(int month)
    {
        return month switch
        {
            1 => "Enero",
            2 => "Febrero",
            3 => "Marzo",
            4 => "Abril",
            5 => "Mayo",
            6 => "Junio",
            7 => "Julio",
            8 => "Agosto",
            9 => "Septiembre",
            10 => "Octubre",
            11 => "Noviembre",
            12 => "Diciembre",
            _ => month.ToString()
        };
    }
}
