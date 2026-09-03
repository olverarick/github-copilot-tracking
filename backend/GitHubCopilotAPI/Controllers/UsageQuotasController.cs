using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GitHubCopilotAPI.Models.DTOs;
using GitHubCopilotAPI.Services;

namespace GitHubCopilotAPI.Controllers;

[ApiController]
[Route("api/usage-quotas")]
public class UsageQuotasController : ControllerBase
{
    private readonly IUsageQuotaService _usageQuotaService;
    private readonly ILogger<UsageQuotasController> _logger;

    public UsageQuotasController(IUsageQuotaService usageQuotaService, ILogger<UsageQuotasController> logger)
    {
        _usageQuotaService = usageQuotaService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<UsageQuotaDto>>> GetAll(CancellationToken cancellationToken)
    {
        var result = await _usageQuotaService.ListAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("effective")]
    public async Task<ActionResult<UsageQuotaResolutionDto>> GetEffective([FromQuery] int? year = null, [FromQuery] int? month = null, CancellationToken cancellationToken = default)
    {
        var result = await _usageQuotaService.ResolveAsync(year, month, cancellationToken);
        return Ok(result);
    }

    [Authorize]
    [HttpPut]
    public async Task<ActionResult<UsageQuotaDto>> Upsert([FromBody] UsageQuotaUpsertDto dto, CancellationToken cancellationToken)
    {
        if (dto.Year < 2000)
            return BadRequest(new { error = "El año es inválido" });

        if (dto.Month is < 1 or > 12)
            return BadRequest(new { error = "El mes es inválido" });

        if (dto.MonthlyQuota <= 0)
            return BadRequest(new { error = "La cuota mensual debe ser mayor a cero" });

        try
        {
            var result = await _usageQuotaService.UpsertAsync(dto, cancellationToken);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error upserting usage quota rule for {Year}-{Month}", dto.Year, dto.Month);
            return StatusCode(500, new { error = ex.Message });
        }
    }
}