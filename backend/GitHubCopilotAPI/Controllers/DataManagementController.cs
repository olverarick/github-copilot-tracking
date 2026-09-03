using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GitHubCopilotAPI.Data;

namespace GitHubCopilotAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DataManagementController : ControllerBase
{
    private readonly CopilotDbContext _context;
    private readonly ILogger<DataManagementController> _logger;

    public DataManagementController(
        CopilotDbContext context,
        ILogger<DataManagementController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetDatabaseStats()
    {
        try
        {
            var stats = new
            {
                totalRecords = await _context.PremiumRequests.CountAsync(),
                totalUsers = await _context.Users.CountAsync(),
                totalUploads = await _context.Uploads.CountAsync(),
                oldestRecord = await _context.PremiumRequests
                    .OrderBy(p => p.Date)
                    .Select(p => p.Date)
                    .FirstOrDefaultAsync(),
                newestRecord = await _context.PremiumRequests
                    .OrderByDescending(p => p.Date)
                    .Select(p => p.Date)
                    .FirstOrDefaultAsync(),
                uploads = await _context.Uploads
                    .OrderByDescending(u => u.UploadDate)
                    .Take(10)
                    .ToListAsync()
            };

            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting database stats");
            return StatusCode(500, new { error = "Error interno del servidor." });
        }
    }

    [HttpDelete("period")]
    public async Task<IActionResult> DeletePeriod([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
    {
        try
        {
            var recordsToDelete = await _context.PremiumRequests
                .Where(p => p.Date >= startDate && p.Date <= endDate)
                .ToListAsync();

            _context.PremiumRequests.RemoveRange(recordsToDelete);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted {Count} records from {Start} to {End}",
                recordsToDelete.Count, startDate, endDate);

            return Ok(new
            {
                success = true,
                message = $"{recordsToDelete.Count} registros eliminados",
                period = new { start = startDate, end = endDate }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting period");
            return StatusCode(500, new { error = "Error interno del servidor." });
        }
    }

    [HttpPost("deduplicate")]
    public async Task<IActionResult> RemoveDuplicates()
    {
        try
        {
            var duplicates = await _context.PremiumRequests
                .GroupBy(p => new { p.Date, p.Username, p.Model, p.Quantity, p.NetAmount })
                .Where(g => g.Count() > 1)
                .SelectMany(g => g.OrderBy(p => p.Id).Skip(1))
                .ToListAsync();

            _context.PremiumRequests.RemoveRange(duplicates);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = $"{duplicates.Count} registros duplicados eliminados"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing duplicates");
            return StatusCode(500, new { error = "Error interno del servidor." });
        }
    }

    [HttpGet("uploads")]
    public async Task<IActionResult> GetUploadHistory()
    {
        try
        {
            var uploads = await _context.Uploads
                .OrderByDescending(u => u.UploadDate)
                .ToListAsync();

            return Ok(uploads);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting upload history");
            return StatusCode(500, new { error = "Error interno del servidor." });
        }
    }
}
