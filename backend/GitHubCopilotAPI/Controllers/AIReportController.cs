using GitHubCopilotAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GitHubCopilotAPI.Controllers;

[ApiController]
[Route("api/ai-report")]
public class AIReportController(AIReportService reportService, ILogger<AIReportController> logger) : ControllerBase
{
    [HttpGet("{year:int}/{month:int}")]
    public IActionResult GetMonthly(int year, int month, [FromQuery] string? team = null)
    {
        if (month < 1 || month > 12)
            return BadRequest(new { message = "Mes inválido. Debe ser entre 1 y 12." });
        var report = reportService.ReadSavedReports(year, month, team);
        if (report is null)
            return NotFound(new { message = "No hay reportes guardados para este período." });
        return Ok(report);
    }

    [Authorize]
    [HttpPost("{year:int}/{month:int}")]
    public async Task<IActionResult> Monthly(int year, int month, [FromQuery] string? team = null)
    {
        if (month < 1 || month > 12)
            return BadRequest(new { message = "Mes inválido. Debe ser entre 1 y 12." });
        return await RunReport(year, month, team);
    }

    [Authorize]
    [HttpPost("{year:int}")]
    public async Task<IActionResult> Annual(int year, [FromQuery] string? team = null)
        => await RunReport(year, null, team);

    // CAL-04: HttpContext.RequestAborted propagado al servicio para cancelar la llamada al LLM
    private async Task<IActionResult> RunReport(int year, int? month, string? team)
    {
        try
        {
            var report = await reportService.GenerateAsync(year, month, team, HttpContext.RequestAborted);
            if (report is null)
                return NotFound(new { message = "No se encontraron casos de uso para el período indicado." });
            return Ok(report);
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499, new { message = "Solicitud cancelada por el cliente." });
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("configurad"))
        {
            return StatusCode(503, new { message = "Azure OpenAI no está configurado. Verifique las variables de entorno." });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error generando reporte AI {year}/{month}", year, month);
            return StatusCode(500, new { message = "Error interno al generar el reporte." });
        }
    }
}
