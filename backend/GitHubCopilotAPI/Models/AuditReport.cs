using System.Text.Json;
using System.Text.Json.Serialization;

namespace GitHubCopilotAPI.Models;

// ── API response records ─────────────────────────────────────────────────────

public record AuditReport(
    AuditPeriod Period,
    DateTime GeneratedAt,
    AuditTeamSummary[] ResumenEquipos,
    AuditUserEntry[] AuditoriasUsuario
);

public record AuditPeriod(int Year, int Month, string Label);

public record AuditTeamSummary(
    string Equipo,
    double ScorePromedio,
    int UsuariosEvaluados,
    int CasosEvaluados
);

public record AuditUserEntry(
    string Username,
    string Equipo,
    double ScorePromedio,
    string Badge,
    AuditFileEntry[] Archivos
);

public record AuditFileEntry(
    string Nombre,
    int Score,
    AuditCriteria Criterios,
    AuditCodeReview CodeReview,
    string ComentarioIA
);

public record AuditCriteria(
    bool TienePromptReal,
    bool TieneEvidenciaTecnica,
    bool ProblemaEspecifico,
    bool LeccionesAccionables,
    bool EvaluacionCompleta
);

public record AuditCodeReview(
    bool TieneCodigo,
    bool EsBuenasPractica,
    string[] Problemas,
    string[] Destacados
);

// Lightweight record for the cached user score endpoint (UserDrawer badge)
public record UserAuditScore(
    string Username,
    string Equipo,
    double ScorePromedio,
    string Badge
);

// ── DTOs for deserializing the AI's Spanish camelCase JSON ───────────────────

internal class AuditReportDto
{
    [JsonPropertyName("resumenEquipos")]    public AuditTeamSummaryDto[]? ResumenEquipos { get; set; }
    [JsonPropertyName("auditoriasUsuario")] public AuditUserEntryDto[]? AuditoriasUsuario { get; set; }
}

internal class AuditTeamSummaryDto
{
    [JsonPropertyName("equipo")]            public string? Equipo { get; set; }
    [JsonPropertyName("scorePromedio")]     public double ScorePromedio { get; set; }
    [JsonPropertyName("usuariosEvaluados")] public int UsuariosEvaluados { get; set; }
    [JsonPropertyName("casosEvaluados")]    public int CasosEvaluados { get; set; }
}

internal class AuditUserEntryDto
{
    [JsonPropertyName("username")]      public string? Username { get; set; }
    [JsonPropertyName("equipo")]        public string? Equipo { get; set; }
    [JsonPropertyName("scorePromedio")] public double ScorePromedio { get; set; }
    [JsonPropertyName("badge")]         public string? Badge { get; set; }
    [JsonPropertyName("archivos")]      public AuditFileEntryDto[]? Archivos { get; set; }
}

internal class AuditFileEntryDto
{
    [JsonPropertyName("nombre")]      public string? Nombre { get; set; }
    [JsonPropertyName("score")]       public int Score { get; set; }
    [JsonPropertyName("criterios")]   public AuditCriteriaDto? Criterios { get; set; }
    [JsonPropertyName("codeReview")]  public AuditCodeReviewDto? CodeReview { get; set; }
    [JsonPropertyName("comentarioIA")] public string? ComentarioIA { get; set; }
}

internal class AuditCriteriaDto
{
    [JsonPropertyName("tienePromptReal")]       [JsonConverter(typeof(FlexibleBoolConverter))] public bool TienePromptReal { get; set; }
    [JsonPropertyName("tieneEvidenciaTecnica")] [JsonConverter(typeof(FlexibleBoolConverter))] public bool TieneEvidenciaTecnica { get; set; }
    [JsonPropertyName("problemaEspecifico")]    [JsonConverter(typeof(FlexibleBoolConverter))] public bool ProblemaEspecifico { get; set; }
    [JsonPropertyName("leccionesAccionables")]  [JsonConverter(typeof(FlexibleBoolConverter))] public bool LeccionesAccionables { get; set; }
    [JsonPropertyName("evaluacionCompleta")]    [JsonConverter(typeof(FlexibleBoolConverter))] public bool EvaluacionCompleta { get; set; }
}

internal class AuditCodeReviewDto
{
    [JsonPropertyName("tieneCodigo")]      [JsonConverter(typeof(FlexibleBoolConverter))] public bool TieneCodigo { get; set; }
    [JsonPropertyName("esBuenasPractica")] [JsonConverter(typeof(FlexibleBoolConverter))] public bool EsBuenasPractica { get; set; }
    [JsonPropertyName("problemas")]        public string[]? Problemas { get; set; }
    [JsonPropertyName("destacados")]       public string[]? Destacados { get; set; }
}

/// <summary>
/// Tolerates booleans returned by OpenAI as strings ("true"/"false"), numbers (0/1)
/// or actual JSON booleans, preventing deserialization errors.
/// </summary>
internal sealed class FlexibleBoolConverter : JsonConverter<bool>
{
    public override bool Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        reader.TokenType switch
        {
            JsonTokenType.True   => true,
            JsonTokenType.False  => false,
            JsonTokenType.String => bool.TryParse(reader.GetString(), out var b) && b,
            JsonTokenType.Number => reader.GetInt32() != 0,
            _                    => false
        };

    public override void Write(Utf8JsonWriter writer, bool value, JsonSerializerOptions options)
        => writer.WriteBooleanValue(value);
}
