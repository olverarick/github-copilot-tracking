using Microsoft.AspNetCore.Mvc;

namespace GitHubCopilotAPI.Controllers;

[ApiController]
[Route("api/use-cases")]
public class UseCasesController : ControllerBase
{
    // CAL-02: ruta leída de configuración (Storage:UseCasesPath), con fallback al default de contenedor
    private readonly string _baseDir;
    private const long MaxFileSizeBytes = 1_048_576; // 1 MB

    public UseCasesController(IConfiguration config)
    {
        _baseDir = Path.GetFullPath(config["Storage:UseCasesPath"] ?? "/app/use-cases");
    }

    // ── GET /api/use-cases/{year}/{month}/{team}/{username} ───────────────────
    [HttpGet("{year:int}/{month:int}/{team}/{username}")]
    public IActionResult ListUseCases(int year, int month, string team, string username)
    {
        var dir = SafeUserDir(year, month, team, username);
        if (dir is null) return BadRequest(new { message = "Ruta no válida." });

        if (!Directory.Exists(dir))
            return Ok(Array.Empty<object>());

        var files = Directory.GetFiles(dir, "*.md")
            .Select(f => new
            {
                filename     = Path.GetFileName(f),
                lastModified = System.IO.File.GetLastWriteTimeUtc(f).ToString("o"),
            })
            .OrderBy(f => f.filename)
            .ToArray();

        return Ok(files);
    }

    // ── GET /api/use-cases/{year}/{month}/{team}/{username}/{filename} ─────────
    [HttpGet("{year:int}/{month:int}/{team}/{username}/{filename}")]
    public IActionResult GetUseCaseContent(int year, int month, string team, string username, string filename)
    {
        var path = SafeFilePath(year, month, team, username, filename);
        if (path is null) return BadRequest(new { message = "Ruta no válida." });
        if (!System.IO.File.Exists(path)) return NotFound(new { message = "Archivo no encontrado." });

        var content = System.IO.File.ReadAllText(path);
        return Content(content, "text/plain; charset=utf-8");
    }

    // ── POST /api/use-cases/{year}/{month}/{team}/{username} ──────────────────
    [HttpPost("{year:int}/{month:int}/{team}/{username}")]
    public async Task<IActionResult> UploadUseCase(int year, int month, string team, string username, IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "Archivo vacío." });

        if (file.Length > MaxFileSizeBytes)
            return BadRequest(new { message = "El archivo supera el límite de 1 MB." });

        var originalName = Path.GetFileName(file.FileName);
        if (string.IsNullOrEmpty(originalName) || !originalName.EndsWith(".md", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Solo se permiten archivos .md." });

        var dir = SafeUserDir(year, month, team, username);
        if (dir is null) return BadRequest(new { message = "Ruta no válida." });

        Directory.CreateDirectory(dir);

        var path = SafeFilePath(year, month, team, username, originalName);
        if (path is null) return BadRequest(new { message = "Nombre de archivo no válido." });

        if (System.IO.File.Exists(path))
            return Conflict(new { message = $"El archivo '{Path.GetFileName(path)}' ya existe para este periodo. Elimínalo primero si deseas reemplazarlo." });

        await using var stream = System.IO.File.Create(path);
        await file.CopyToAsync(stream);

        return Ok(new { filename = NormalizeSegment(Path.GetFileName(file.FileName)) });
    }

    // ── DELETE /api/use-cases/{year}/{month}/{team}/{username}/{filename} ──────
    [HttpDelete("{year:int}/{month:int}/{team}/{username}/{filename}")]
    public IActionResult DeleteUseCase(int year, int month, string team, string username, string filename)
    {
        var path = SafeFilePath(year, month, team, username, filename);
        if (path is null) return BadRequest(new { message = "Ruta no válida." });
        if (!System.IO.File.Exists(path)) return NotFound(new { message = "Archivo no encontrado." });

        System.IO.File.Delete(path);
        return NoContent();
    }

    // ── GET /api/use-cases/counts/{year} ─────────────────────────────────────
    [HttpGet("counts/{year:int}")]
    public IActionResult GetCountsByYear(int year)
    {
        var yearDir = Path.GetFullPath(Path.Combine(_baseDir, year.ToString()));
        if (!yearDir.StartsWith(_baseDir + Path.DirectorySeparatorChar) && yearDir != _baseDir)
            return BadRequest(new { message = "Ruta no válida." });

        if (!Directory.Exists(yearDir))
            return Ok(Array.Empty<object>());

        var result = new List<object>();
        foreach (var monthDir in Directory.GetDirectories(yearDir))
        {
            if (!int.TryParse(Path.GetFileName(monthDir), out var month)) continue;
            foreach (var teamDir in Directory.GetDirectories(monthDir))
            {
                var team = Path.GetFileName(teamDir);
                foreach (var userDir in Directory.GetDirectories(teamDir))
                {
                    var username = Path.GetFileName(userDir);
                    var count   = Directory.GetFiles(userDir, "*.md")
                        .Count(f => !Path.GetFileName(f).StartsWith("reporte-ia-", StringComparison.OrdinalIgnoreCase));
                    result.Add(new { team, username, month, count });
                }
            }
        }
        return Ok(result);
    }

    // ── GET /api/use-cases/counts/{year}/{month} ──────────────────────────────
    [HttpGet("counts/{year:int}/{month:int}")]
    public IActionResult GetCounts(int year, int month)
    {
        var periodDir = Path.GetFullPath(Path.Combine(_baseDir, year.ToString(), month.ToString()));
        if (!periodDir.StartsWith(_baseDir + Path.DirectorySeparatorChar) && periodDir != _baseDir)
            return BadRequest(new { message = "Ruta no válida." });

        if (!Directory.Exists(periodDir))
            return Ok(Array.Empty<object>());

        var result = new List<object>();
        foreach (var teamDir in Directory.GetDirectories(periodDir))
        {
            var team = Path.GetFileName(teamDir);
            foreach (var userDir in Directory.GetDirectories(teamDir))
            {
                var username = Path.GetFileName(userDir);
                var count    = Directory.GetFiles(userDir, "*.md")
                    .Count(f => !Path.GetFileName(f).StartsWith("reporte-ia-", StringComparison.OrdinalIgnoreCase));
                result.Add(new { team, username, count });
            }
        }
        return Ok(result);
    }

    // ── Path safety helpers ───────────────────────────────────────────────────

    /// <summary>Replaces spaces with underscores so directory/file names are URL-friendly.</summary>
    private static string NormalizeSegment(string s) => s.Replace(' ', '_');

    private string? SafeUserDir(int year, int month, string team, string username)
    {
        team     = NormalizeSegment(team);
        username = NormalizeSegment(username);
        if (!IsValidSegment(team) || !IsValidSegment(username)) return null;

        var candidate = Path.GetFullPath(Path.Combine(_baseDir, year.ToString(), month.ToString(), team, username));
        return candidate.StartsWith(_baseDir + Path.DirectorySeparatorChar) || candidate == _baseDir
            ? candidate
            : null;
    }

    private string? SafeFilePath(int year, int month, string team, string username, string filename)
    {
        filename = NormalizeSegment(filename);
        if (!IsValidSegment(filename)) return null;
        if (!filename.EndsWith(".md", StringComparison.OrdinalIgnoreCase)) return null;

        var dir = SafeUserDir(year, month, team, username);
        if (dir is null) return null;

        var candidate = Path.GetFullPath(Path.Combine(dir, filename));
        return candidate.StartsWith(dir + Path.DirectorySeparatorChar) || candidate == dir
            ? candidate
            : null;
    }

    private static bool IsValidSegment(string s) =>
        !string.IsNullOrEmpty(s) &&
        s.Length <= 128 &&
        s.All(c => char.IsLetterOrDigit(c) || c == '-' || c == '_' || c == '.');
}
