namespace GitHubCopilotAPI.Models;

// ── API response: one markdown report generated per user ─────────────────────

public record AIBatchReport(
    AIReportPeriod Period,
    DateTime GeneratedAt,
    int UsersProcessed,
    AIUserReport[] Users,
    string[] Errors
);

public record AIReportPeriod(int Year, int? Month, string Label);

public record AIUserReport(
    string Username,
    string Team,
    int FilesAnalyzed,
    string ReportContent,
    string SavedPath
);
