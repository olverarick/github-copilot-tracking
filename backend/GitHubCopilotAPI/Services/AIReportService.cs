using Azure;
using Azure.AI.OpenAI;
using GitHubCopilotAPI.Models;
using OpenAI.Chat;
using System.Globalization;
using System.Text;

namespace GitHubCopilotAPI.Services;

public class AIReportService(IConfiguration config, ILogger<AIReportService> logger)
{
    // CAL-02: ruta leída de configuración (Storage:UseCasesPath), con fallback al default de contenedor
    private readonly string _baseDir = Path.GetFullPath(
        config["Storage:UseCasesPath"] ?? "/app/use-cases");

    private (ChatClient Chat, string Deployment, int MaxTokens, float Temperature) CreateClient()
    {
        var endpoint = config["AzureOpenAI:Endpoint"]
            ?? throw new InvalidOperationException("Azure OpenAI Endpoint no configurado (AzureOpenAI:Endpoint).");
        var apiKey = config["AzureOpenAI:ApiKey"]
            ?? throw new InvalidOperationException("Azure OpenAI ApiKey no configurada (AzureOpenAI:ApiKey).");
        var deployment = config["AzureOpenAI:DeploymentName"] ?? "gpt-4o";
        int maxTokens = int.TryParse(config["AzureOpenAI:MaxTokens"], out var mt) ? mt : 2000;
        float temperature = float.TryParse(config["AzureOpenAI:Temperature"],
            NumberStyles.Any, CultureInfo.InvariantCulture, out var t) ? t : 0.7f;

        var azureClient = new AzureOpenAIClient(new Uri(endpoint), new AzureKeyCredential(apiKey));
        return (azureClient.GetChatClient(deployment), deployment, maxTokens, temperature);
    }

    private record FileEntry(string Team, string Username, string Month, string Filename, string Content);

    private List<FileEntry> ReadFiles(int year, int? month, string? teamFilter = null)
    {
        var entries = new List<FileEntry>();
        // Directory names use underscores for spaces (NormalizeSegment); align the filter
        teamFilter = teamFilter?.Replace(' ', '_');

        var searchRoot = month.HasValue
            ? Path.GetFullPath(Path.Combine(_baseDir, year.ToString(), month.Value.ToString()))
            : Path.GetFullPath(Path.Combine(_baseDir, year.ToString()));

        if (!Directory.Exists(searchRoot)) return entries;

        // Limit per file (per-user calls are smaller — 2500 chars each)
        const int perFileLimit = 2500;

        if (month.HasValue)
        {
            foreach (var teamDir in Directory.GetDirectories(searchRoot).OrderBy(d => d))
            {
                var team = Path.GetFileName(teamDir);
                if (teamFilter != null && !string.Equals(team, teamFilter, StringComparison.OrdinalIgnoreCase)) continue;
                foreach (var userDir in Directory.GetDirectories(teamDir).OrderBy(d => d))
                {
                    var username = Path.GetFileName(userDir);
                    foreach (var file in Directory.GetFiles(userDir, "*.md").OrderBy(f => f))
                    {
                        var fname = Path.GetFileName(file);
                        if (fname.StartsWith("reporte-ia-", StringComparison.OrdinalIgnoreCase)) continue;
                        var content = File.ReadAllText(file);
                        if (content.Length > perFileLimit)
                            content = content[..perFileLimit] + "\n[...]";
                        entries.Add(new FileEntry(team, username, month.Value.ToString(), fname, content));
                    }
                }
            }
        }
        else
        {
            foreach (var monthDir in Directory.GetDirectories(searchRoot).OrderBy(d => d))
            {
                if (!int.TryParse(Path.GetFileName(monthDir), out _)) continue;
                var monthNum = Path.GetFileName(monthDir);
                foreach (var teamDir in Directory.GetDirectories(monthDir).OrderBy(d => d))
                {
                    var team = Path.GetFileName(teamDir);
                    if (teamFilter != null && !string.Equals(team, teamFilter, StringComparison.OrdinalIgnoreCase)) continue;
                    foreach (var userDir in Directory.GetDirectories(teamDir).OrderBy(d => d))
                    {
                        var username = Path.GetFileName(userDir);
                        foreach (var file in Directory.GetFiles(userDir, "*.md").OrderBy(f => f))
                        {
                            var fname = Path.GetFileName(file);
                            if (fname.StartsWith("reporte-ia-", StringComparison.OrdinalIgnoreCase)) continue;
                            var content = File.ReadAllText(file);
                            if (content.Length > perFileLimit)
                                content = content[..perFileLimit] + "\n[...]";
                            entries.Add(new FileEntry(team, username, monthNum, fname, content));
                        }
                    }
                }
            }
        }

        return entries;
    }

    // CAL-04: CancellationToken propagado desde el request HTTP
    public async Task<AIBatchReport?> GenerateAsync(
        int year, int? month, string? teamFilter = null,
        CancellationToken cancellationToken = default)
    {
        var files = ReadFiles(year, month, teamFilter);
        if (files.Count == 0) return null;

        var (chatClient, _, _, _) = CreateClient();

        var ci = new CultureInfo("es-MX");
        var periodLabel = month.HasValue
            ? $"{ci.DateTimeFormat.GetMonthName(month.Value)} {year}"
            : year.ToString();

        var results = new List<AIUserReport>();
        var errors  = new List<string>();
        bool first = true;

        // One AI call per user — avoids 429 rate-limit on large batches
        foreach (var teamGroup in files.GroupBy(f => f.Team).OrderBy(g => g.Key))
        {
            foreach (var userGroup in teamGroup.GroupBy(f => f.Username).OrderBy(g => g.Key))
            {
                if (!first) await Task.Delay(2500, cancellationToken); // ~24 RPM spacing
                first = false;

                var username  = userGroup.Key;
                var team      = teamGroup.Key;
                var userFiles = userGroup.ToList();

                try
                {
                    var userContent = BuildUserContent(username, team, periodLabel, userFiles, month);

                    var completion = await chatClient.CompleteChatAsync(
                        [new SystemChatMessage(PerUserSystemPrompt), new UserChatMessage(userContent)],
                        new ChatCompletionOptions
                        {
                            MaxOutputTokenCount = 700,
                            Temperature = 0.5f
                        },
                        cancellationToken);

                    var markdown  = completion.Value.Content[0].Text.Trim();
                    var savedPath = SaveReport(year, month, team, username, markdown, periodLabel);

                    results.Add(new AIUserReport(username, team, userFiles.Count, markdown, savedPath));
                    logger.LogInformation("AIReport {team}/{user}: OK ({tokens} tokens)",
                        team, username, completion.Value.Usage?.TotalTokenCount);
                }
                catch (OperationCanceledException)
                {
                    logger.LogWarning("AIReport cancelado por el cliente en {team}/{user}", team, username);
                    throw;
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "AIReport {team}/{user}: error", team, username);
                    errors.Add($"{team}/{username}: {ex.Message[..Math.Min(120, ex.Message.Length)]}");
                }
            }
        }

        if (results.Count == 0) return null;

        return new AIBatchReport(
            Period: new AIReportPeriod(year, month, periodLabel),
            GeneratedAt: DateTime.UtcNow,
            UsersProcessed: results.Count,
            Users: [.. results.OrderBy(r => r.Team).ThenBy(r => r.Username)],
            Errors: [.. errors]
        );
    }

    private static string BuildUserContent(
        string username, string team, string period, List<FileEntry> files, int? month)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"Usuario: {username} | Equipo: {team} | Período: {period}");
        sb.AppendLine($"Casos de uso ({files.Count} archivos):");
        sb.AppendLine();
        foreach (var f in files)
        {
            if (!month.HasValue) sb.AppendLine($"[Mes {f.Month}]");
            sb.AppendLine($"### {f.Filename}");
            sb.AppendLine(f.Content);
            sb.AppendLine();
        }
        return sb.ToString();
    }

    private string SaveReport(
        int year, int? month, string team, string username, string content, string periodLabel)
    {
        var dir = month.HasValue
            ? Path.Combine(_baseDir, year.ToString(), month.Value.ToString(), team, username)
            : Path.Combine(_baseDir, year.ToString(), team, username);

        Directory.CreateDirectory(dir);

        var fileName = month.HasValue
            ? $"reporte-ia-{year}-{month.Value:D2}.md"
            : $"reporte-ia-{year}.md";

        var header = $"""
            # Reporte de Uso de GitHub Copilot

            | | |
            |---|---|
            | **Usuario** | {username} |
            | **Equipo** | {team} |
            | **Período** | {periodLabel} |
            | **Generado** | {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC |

            ---

            """;

        File.WriteAllText(Path.Combine(dir, fileName), header + content);
        logger.LogInformation("Reporte guardado: {path}", Path.Combine(dir, fileName));
        return fileName; // return just the filename, not full path
    }

    private const string PerUserSystemPrompt =
        """
        Eres un analista experto en adopción de GitHub Copilot en organizaciones institucionales de México.
        Analiza los casos de uso del desarrollador indicado y genera un reporte mensual en español, en formato Markdown.

        El reporte DEBE contener exactamente estas secciones:

        ## Resumen del Mes
        (2-3 oraciones: en qué usó Copilot principalmente y cuál fue el impacto general)

        ## Categorías de Uso
        (lista con viñetas: cada categoría de uso identificada con una breve descripción del caso específico)

        ## Beneficios Obtenidos
        (lista con viñetas: beneficios concretos — tiempo ahorrado, calidad mejorada, problemas resueltos)

        ## Métricas Destacadas
        (sólo si el documento menciona métricas cuantitativas; omite esta sección si no hay datos)

        ## Lecciones y Observaciones
        (máximo 3 puntos: aprendizajes clave o limitaciones encontradas)

        Sé específico y usa los datos del documento cuando estén disponibles. Máximo 350 palabras.
        Responde ÚNICAMENTE con el contenido Markdown, sin texto adicional ni explicaciones.
        """;

    /// <summary>
    /// Lee los reportes ya generados (reporte-ia-{year}-{month:D2}.md) sin llamar a la IA.
    /// </summary>
    public AIBatchReport? ReadSavedReports(int year, int month, string? teamFilter = null)
    {
        // Directory names use underscores for spaces (NormalizeSegment); align the filter
        teamFilter = teamFilter?.Replace(' ', '_');
        var searchRoot = Path.GetFullPath(Path.Combine(_baseDir, year.ToString(), month.ToString()));
        if (!Directory.Exists(searchRoot)) return null;

        var reportFileName = $"reporte-ia-{year}-{month:D2}.md";
        var results = new List<AIUserReport>();

        foreach (var teamDir in Directory.GetDirectories(searchRoot).OrderBy(d => d))
        {
            var team = Path.GetFileName(teamDir);
            if (teamFilter != null && !string.Equals(team, teamFilter, StringComparison.OrdinalIgnoreCase)) continue;

            foreach (var userDir in Directory.GetDirectories(teamDir).OrderBy(d => d))
            {
                var username = Path.GetFileName(userDir);
                var reportPath = Path.Combine(userDir, reportFileName);
                if (!File.Exists(reportPath)) continue;

                var content = File.ReadAllText(reportPath);
                var useCaseCount = Directory.GetFiles(userDir, "*.md")
                    .Count(f => !Path.GetFileName(f).StartsWith("reporte-ia-", StringComparison.OrdinalIgnoreCase));

                results.Add(new AIUserReport(username, team, useCaseCount, content, reportFileName));
            }
        }

        if (results.Count == 0) return null;

        var ci = new CultureInfo("es-MX");
        var periodLabel = $"{ci.DateTimeFormat.GetMonthName(month)} {year}";

        return new AIBatchReport(
            Period: new AIReportPeriod(year, month, periodLabel),
            GeneratedAt: DateTime.UtcNow,
            UsersProcessed: results.Count,
            Users: [.. results.OrderBy(r => r.Team).ThenBy(r => r.Username)],
            Errors: []
        );
    }
}
