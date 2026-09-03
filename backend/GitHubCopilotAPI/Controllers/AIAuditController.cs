using GitHubCopilotAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GitHubCopilotAPI.Controllers;

[ApiController]
[Route("api/ai-audit")]
public class AIAuditController(AIAuditService auditService, ILogger<AIAuditController> logger) : ControllerBase
{
    /// <summary>Returns a previously saved audit for a period without calling the AI.</summary>
    [HttpGet("{year:int}/{month:int}")]
    public IActionResult GetSavedAudit(int year, int month, [FromQuery] string? team = null)
    {
        if (month < 1 || month > 12)
            return BadRequest(new { message = "Mes inválido." });
        var report = auditService.ReadSavedAudit(year, month, team);
        if (report is null)
            return NotFound(new { message = "No hay auditoría guardada para este período." });
        return Ok(report);
    }

    /// <summary>Runs the full audit for a period and caches the result for 2 hours.</summary>
    [Authorize]
    [HttpPost("{year:int}/{month:int}")]
    public async Task<IActionResult> FullAudit(int year, int month, [FromQuery] string? team = null)
    {
        if (month < 1 || month > 12)
            return BadRequest(new { message = "Mes inválido." });
        try
        {
            // CAL-04: HttpContext.RequestAborted propagado para cancelar la llamada al LLM si el cliente desconecta
            var report = await auditService.GenerateFullAuditAsync(year, month, team, HttpContext.RequestAborted);
            if (report is null)
                return NotFound(new { message = "No se encontraron casos de uso para auditar en el período indicado." });
            return Ok(report);
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499, new { message = "Solicitud cancelada por el cliente." });
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("configurad"))
        {
            return StatusCode(503, new { message = "Azure OpenAI no está configurado." });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error en auditoría AI {year}/{month}", year, month);
            return StatusCode(500, new { message = "Error interno en la auditoría." });
        }
    }

    /// <summary>Returns the cached score for a specific user (requires full audit to have been run first).</summary>
    [HttpGet("{year:int}/{month:int}/{team}/{username}")]
    public IActionResult GetCachedScore(int year, int month, string team, string username)
    {
        var score = auditService.GetCachedUserScore(year, month, team, username);
        if (score is null)
            return NotFound(new { message = "No hay auditoría cacheada para este usuario y período. Ejecute primero la auditoría completa." });
        return Ok(score);
    }

    /// <summary>Runs an on-demand audit for a single user (also checks cache first).</summary>
    [Authorize]
    [HttpPost("{year:int}/{month:int}/{team}/{username}")]
    public async Task<IActionResult> UserAudit(int year, int month, string team, string username)
    {
        try
        {
            // CAL-04: HttpContext.RequestAborted propagado al servicio
            var entry = await auditService.GenerateUserAuditAsync(year, month, team, username, HttpContext.RequestAborted);
            if (entry is null)
                return NotFound(new { message = "No se encontraron casos de uso para este usuario." });
            return Ok(entry);
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499, new { message = "Solicitud cancelada por el cliente." });
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("configurad"))
        {
            return StatusCode(503, new { message = "Azure OpenAI no está configurado." });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error auditando usuario {username}", username);
            return StatusCode(500, new { message = "Error interno en la auditoría del usuario." });
        }
    }
}
