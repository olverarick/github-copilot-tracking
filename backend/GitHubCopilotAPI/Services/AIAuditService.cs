using Azure;
using Azure.AI.OpenAI;
using GitHubCopilotAPI.Models;
using Microsoft.Extensions.Caching.Memory;
using OpenAI.Chat;
using System.Globalization;
using System.Text;
using System.Text.Json;

namespace GitHubCopilotAPI.Services;

public class AIAuditService(IConfiguration config, IMemoryCache cache, ILogger<AIAuditService> logger)
{
    // CAL-02: ruta leída de configuración (Storage:UseCasesPath), con fallback al default de contenedor
    private readonly string _baseDir = Path.GetFullPath(
        config["Storage:UseCasesPath"] ?? "/app/use-cases");

    private const string CacheKeyPrefix = "audit";

    private (ChatClient Chat, int MaxTokens, float Temperature) CreateClient(bool isAudit = true)
    {
        var endpoint = config["AzureOpenAI:Endpoint"]
            ?? throw new InvalidOperationException("Azure OpenAI Endpoint no configurado (AzureOpenAI:Endpoint).");
        var apiKey = config["AzureOpenAI:ApiKey"]
            ?? throw new InvalidOperationException("Azure OpenAI ApiKey no configurada (AzureOpenAI:ApiKey).");
        var deployment = config["AzureOpenAI:DeploymentName"] ?? "gpt-4o";

        int maxTokens = isAudit
            ? (int.TryParse(config["AzureOpenAI:MaxTokensAudit"], out var ma) ? ma : 4000)
            : (int.TryParse(config["AzureOpenAI:MaxTokens"], out var mt) ? mt : 2000);

        float temperature = float.TryParse(config["AzureOpenAI:Temperature"],
            NumberStyles.Any, CultureInfo.InvariantCulture, out var t) ? t : 0.3f;

        var azureClient = new AzureOpenAIClient(new Uri(endpoint), new AzureKeyCredential(apiKey));
        return (azureClient.GetChatClient(deployment), maxTokens, temperature);
    }

    private record FileEntry(string Team, string Username, string Filename, string Content);

    private List<FileEntry> ReadFiles(int year, int month, string? teamFilter = null, string? usernameFilter = null)
    {
        var entries = new List<FileEntry>();
        // Directory names use underscores for spaces (NormalizeSegment); align the filter
        teamFilter = teamFilter?.Replace(' ', '_');
        var searchRoot = Path.GetFullPath(Path.Combine(_baseDir, year.ToString(), month.ToString()));
        if (!Directory.Exists(searchRoot)) return entries;

        foreach (var teamDir in Directory.GetDirectories(searchRoot).OrderBy(d => d))
        {
            var team = Path.GetFileName(teamDir);
            if (teamFilter != null && !string.Equals(team, teamFilter, StringComparison.OrdinalIgnoreCase)) continue;

            foreach (var userDir in Directory.GetDirectories(teamDir).OrderBy(d => d))
            {
                var username = Path.GetFileName(userDir);
                if (usernameFilter != null && !string.Equals(username, usernameFilter, StringComparison.OrdinalIgnoreCase)) continue;

                foreach (var file in Directory.GetFiles(userDir, "*.md").OrderBy(f => f))
                {
                    var fname = Path.GetFileName(file);
                    if (fname.StartsWith("reporte-ia-", StringComparison.OrdinalIgnoreCase)) continue;
                    var content = File.ReadAllText(file);
                    if (content.Length > 3000)
                        content = content[..3000] + "\n[...]";
                    entries.Add(new FileEntry(team, username, Path.GetFileName(file), content));
                }
            }
        }
        return entries;
    }

    // CAL-04: CancellationToken propagado desde el request HTTP
    public async Task<AuditReport?> GenerateFullAuditAsync(
        int year, int month, string? teamFilter = null,
        CancellationToken cancellationToken = default)
    {
        var files = ReadFiles(year, month, teamFilter);
        if (files.Count == 0) return null;

        var (chatClient, maxTokens, temperature) = CreateClient(isAudit: true);

        var sb = new StringBuilder();
        sb.AppendLine($"=== AUDITORÍA: {month}/{year} — {files.Count} archivos ===");
        sb.AppendLine();

        foreach (var teamGroup in files.GroupBy(f => f.Team))
        {
            sb.AppendLine($"\n=== EQUIPO: {teamGroup.Key} ===");
            foreach (var userGroup in teamGroup.GroupBy(f => f.Username))
            {
                sb.AppendLine($"\n--- USUARIO: {userGroup.Key} ---");
                foreach (var f in userGroup)
                {
                    sb.AppendLine($"### ARCHIVO: {f.Filename}");
                    sb.AppendLine(f.Content);
                    sb.AppendLine();
                }
            }
        }

        var completion = await chatClient.CompleteChatAsync(
            [new SystemChatMessage(AuditSystemPrompt), new UserChatMessage(sb.ToString())],
            new ChatCompletionOptions
            {
                ResponseFormat = ChatResponseFormat.CreateJsonObjectFormat(),
                MaxOutputTokenCount = maxTokens,
                Temperature = temperature
            },
            cancellationToken);

        var json = completion.Value.Content[0].Text;
        logger.LogInformation("AIAudit {month}/{year}: {files} archivos, {tokens} tokens",
            month, year, files.Count, completion.Value.Usage?.TotalTokenCount);

        var dto = JsonSerializer.Deserialize<AuditReportDto>(json)
            ?? throw new InvalidOperationException("AI devolvió respuesta vacía o inválida.");

        var result = MapToAuditReport(dto, year, month);

        // Cache for 2 hours
        cache.Set($"{CacheKeyPrefix}_{year}_{month}", result, TimeSpan.FromHours(2));
        SaveAuditToFile(year, month, result);

        return result;
    }

    // CAL-04: CancellationToken propagado desde el request HTTP
    public async Task<AuditUserEntry?> GenerateUserAuditAsync(
        int year, int month, string team, string username,
        CancellationToken cancellationToken = default)
    {
        var files = ReadFiles(year, month, team, username);
        if (files.Count == 0) return null;

        // Check cache first — avoids an extra AI call if full audit was run
        var cacheKey = $"{CacheKeyPrefix}_{year}_{month}";
        if (cache.TryGetValue(cacheKey, out AuditReport? cached))
        {
            return cached?.AuditoriasUsuario.FirstOrDefault(u =>
                string.Equals(u.Username, username, StringComparison.OrdinalIgnoreCase) &&
                string.Equals(u.Equipo, team, StringComparison.OrdinalIgnoreCase));
        }

        // Per-user audit (fast: only 2-5 files)
        var (chatClient, _, temperature) = CreateClient(isAudit: false);

        var sb = new StringBuilder();
        sb.AppendLine($"=== AUDITORÍA USUARIO: {username} · EQUIPO: {team} · {month}/{year} ===");
        sb.AppendLine($"Archivos: {files.Count}");
        sb.AppendLine();
        foreach (var f in files)
        {
            sb.AppendLine($"### ARCHIVO: {f.Filename}");
            sb.AppendLine(f.Content);
            sb.AppendLine();
        }

        var completion = await chatClient.CompleteChatAsync(
            [new SystemChatMessage(AuditSystemPrompt), new UserChatMessage(sb.ToString())],
            new ChatCompletionOptions
            {
                ResponseFormat = ChatResponseFormat.CreateJsonObjectFormat(),
                MaxOutputTokenCount = 2000,
                Temperature = temperature
            },
            cancellationToken);

        var json = completion.Value.Content[0].Text;
        var dto = JsonSerializer.Deserialize<AuditReportDto>(json);

        return MapToAuditReport(dto, year, month).AuditoriasUsuario.FirstOrDefault();
    }

    public UserAuditScore? GetCachedUserScore(int year, int month, string team, string username)
    {
        if (!cache.TryGetValue($"{CacheKeyPrefix}_{year}_{month}", out AuditReport? report))
            return null;

        var entry = report?.AuditoriasUsuario.FirstOrDefault(u =>
            string.Equals(u.Username, username, StringComparison.OrdinalIgnoreCase) &&
            string.Equals(u.Equipo, team, StringComparison.OrdinalIgnoreCase));

        return entry is null ? null : new UserAuditScore(entry.Username, entry.Equipo, entry.ScorePromedio, entry.Badge);
    }

    private static AuditReport MapToAuditReport(AuditReportDto? dto, int year, int month)
    {
        var teamSummaries = dto?.ResumenEquipos?.Select(t =>
            new AuditTeamSummary(t.Equipo ?? "", t.ScorePromedio, t.UsuariosEvaluados, t.CasosEvaluados)
        ).ToArray() ?? [];

        var userEntries = dto?.AuditoriasUsuario?.Select(u =>
        {
            var fileEntries = u.Archivos?.Select(f =>
            {
                var criterios = f.Criterios is not null
                    ? new AuditCriteria(f.Criterios.TienePromptReal, f.Criterios.TieneEvidenciaTecnica,
                        f.Criterios.ProblemaEspecifico, f.Criterios.LeccionesAccionables, f.Criterios.EvaluacionCompleta)
                    : new AuditCriteria(false, false, false, false, false);

                var codeReview = f.CodeReview is not null
                    ? new AuditCodeReview(f.CodeReview.TieneCodigo, f.CodeReview.EsBuenasPractica,
                        f.CodeReview.Problemas ?? [], f.CodeReview.Destacados ?? [])
                    : new AuditCodeReview(false, false, [], []);

                return new AuditFileEntry(f.Nombre ?? "", f.Score, criterios, codeReview, f.ComentarioIA ?? "");
            }).ToArray() ?? [];

            return new AuditUserEntry(u.Username ?? "", u.Equipo ?? "", u.ScorePromedio, u.Badge ?? "yellow", fileEntries);
        }).ToArray() ?? [];

        return new AuditReport(new AuditPeriod(year, month, $"{month}/{year}"), DateTime.UtcNow, teamSummaries, userEntries);
    }

    private void SaveAuditToFile(int year, int month, AuditReport report)
    {
        try
        {
            var dir = Path.GetFullPath(Path.Combine(_baseDir, year.ToString(), month.ToString()));
            Directory.CreateDirectory(dir);
            var path = Path.Combine(dir, $"auditoria-ia-{year}-{month:D2}.json");
            File.WriteAllText(path, JsonSerializer.Serialize(report));
            logger.LogInformation("Auditoría guardada en disco: {path}", path);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "No se pudo guardar la auditoría en disco");
        }
    }

    public AuditReport? ReadSavedAudit(int year, int month, string? teamFilter = null)
    {
        // 1. Check memory cache first
        var cacheKey = $"{CacheKeyPrefix}_{year}_{month}";
        if (cache.TryGetValue(cacheKey, out AuditReport? cached) && cached != null)
            return ApplyTeamFilter(cached, teamFilter);

        // 2. Try disk
        var path = Path.GetFullPath(Path.Combine(_baseDir, year.ToString(), month.ToString(),
            $"auditoria-ia-{year}-{month:D2}.json"));
        if (!File.Exists(path)) return null;

        try
        {
            var report = JsonSerializer.Deserialize<AuditReport>(File.ReadAllText(path));
            if (report == null) return null;
            cache.Set(cacheKey, report, TimeSpan.FromHours(2));
            return ApplyTeamFilter(report, teamFilter);
        }
        catch { return null; }
    }

    private static AuditReport? ApplyTeamFilter(AuditReport report, string? teamFilter)
    {
        if (teamFilter == null) return report;
        var filtered = report with
        {
            ResumenEquipos = report.ResumenEquipos
                .Where(e => string.Equals(e.Equipo, teamFilter, StringComparison.OrdinalIgnoreCase))
                .ToArray(),
            AuditoriasUsuario = report.AuditoriasUsuario
                .Where(u => string.Equals(u.Equipo, teamFilter, StringComparison.OrdinalIgnoreCase))
                .ToArray()
        };
        return filtered.AuditoriasUsuario.Length == 0 ? null : filtered;
    }

    private const string AuditSystemPrompt =
        """
        Eres un auditor experto en calidad de documentación técnica y buenas prácticas de desarrollo de software.
        Evalúa documentos de casos de uso de GitHub Copilot escritos por desarrolladores del INEGI (México).

        RÚBRICA — score = suma de criterios verdaderos (0–5 por archivo):

        1. tienePromptReal: Incluye al menos un ejemplo REAL y específico del prompt usado con Copilot.
           FALSE si solo hay descripción general como "se usó copilot para generar funciones" sin mostrar el prompt.

        2. tieneEvidenciaTecnica: Incluye evidencia técnica verificable y real:
           URL de GitLab real (no ficticia como "gitlab.com/empresa/"), número de commit, ruta de código real, o logs reales.
           "N/A", "por definir", URLs de ejemplo ficticias, o secciones en blanco = FALSE.

        3. problemaEspecifico: El problema está descrito con detalle técnico y contexto específico suficiente.
           Simplemente "migración tecnológica" u "optimización" sin contexto adicional = FALSE.

        4. leccionesAccionables: Las lecciones y recomendaciones son concretas y aplicables por otros desarrolladores.
           Frases genéricas como "verificar el código generado" sin detalle específico = FALSE.

        5. evaluacionCompleta: La sección de evaluación general (Productividad/Calidad/Utilidad) tiene valores
           reales rellenados (Alto/Medio/Bajo), no en blanco ni con texto genérico como "pendiente".

        REVISIÓN DE CÓDIGO (si existen fragmentos en el documento):
        - tieneCodigo: hay al menos un fragmento de código
        - esBuenasPractica: el código sigue prácticas actuales del stack declarado
        - problemas: lista de problemas específicos encontrados (SQL concatenado, System.out en catch, etc.)
        - destacados: aspectos positivos del código

        badge: "green" si score >= 4 · "yellow" si score >= 2 · "red" si score < 2

        IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON válido. Sin markdown ni texto adicional.

        Estructura exacta requerida:
        {
          "resumenEquipos": [
            {"equipo": "nombre", "scorePromedio": 3.5, "usuariosEvaluados": 4, "casosEvaluados": 8}
          ],
          "auditoriasUsuario": [
            {
              "username": "nombre",
              "equipo": "nombre",
              "scorePromedio": 3.5,
              "badge": "green",
              "archivos": [
                {
                  "nombre": "archivo.md",
                  "score": 4,
                  "criterios": {
                    "tienePromptReal": true,
                    "tieneEvidenciaTecnica": false,
                    "problemaEspecifico": true,
                    "leccionesAccionables": true,
                    "evaluacionCompleta": true
                  },
                  "codeReview": {
                    "tieneCodigo": true,
                    "esBuenasPractica": true,
                    "problemas": [],
                    "destacados": ["Uso correcto de PreparedStatement"]
                  },
                  "comentarioIA": "Feedback específico en 2-3 oraciones sobre qué mejorar."
                }
              ]
            }
          ]
        }
        """;
}
