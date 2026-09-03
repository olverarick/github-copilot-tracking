import type {
  Period, Summary, UserMetrics, TeamMetrics, ModelMetrics,
  DailyTrend, AvailablePeriod, LastUpload, TimelineResponse,
  UserModelMetrics, UserLicenseYear, LicenseBulkUpdate, UploadResult,
  UseCase, AIBatchReport, AuditReport, UserAuditScore,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// ── Auth token store (module-level, updated by AuthContext) ───────────────────
// The ApiService singleton is created before React mounts, so we use a plain
// module variable instead of React state. AuthContext calls setAuthToken() on
// login/logout and registers a callback so ApiService can force-logout on 401.

let _authToken: string | null = null;
let _logoutCallback: (() => void) | null = null;

const SK_ACTIVITY = 'copilot_last_activity';

/** Called by AuthContext after a successful login or on logout (null). */
export function setAuthToken(token: string | null): void {
  _authToken = token;
}

/** Called by AuthContext to register a forced-logout handler for 401 responses. */
export function setLogoutCallback(fn: (() => void) | null): void {
  _logoutCallback = fn;
}

/**
 * Actualiza el timestamp de última actividad en sessionStorage.
 * Llamado por AuthContext en login/eventos de usuario y por los fetch
 * de FormData (uploads) que no pasan por fetchJSON.
 */
export function updateActivity(): void {
  sessionStorage.setItem(SK_ACTIVITY, String(Date.now()));
}

// ── ApiService ────────────────────────────────────────────────────────────────

class ApiService {
  /** Authorization header if a token is present, empty object otherwise. */
  private authHeader(): Record<string, string> {
    return _authToken ? { Authorization: `Bearer ${_authToken}` } : {};
  }

  private async fetchJSON<T>(url: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers as Record<string, string>),
          ...this.authHeader(),
        },
      });

      if (response.status === 401) {
        _logoutCallback?.();
        throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      updateActivity(); // cualquier respuesta exitosa cuenta como actividad
      return await response.json() as T;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // ── Period helpers ──────────────────────────────────────────────────────────

  private buildPeriodQuery(period: Period | null): string {
    if (!period) return '';
    const params = new URLSearchParams();
    if (period.year)  params.append('year',  String(period.year));
    if (period.month) params.append('month', String(period.month));
    return `?${params.toString()}`;
  }

  // ── Upload ──────────────────────────────────────────────────────────────────

  async uploadPremiumRequests(file: File): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/upload/premium-requests`, {
      method: 'POST',
      headers: this.authHeader(),
      body: formData,
    });
    if (response.status === 401) {
      _logoutCallback?.();
      throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
    }
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Error al subir archivo');
    }
    updateActivity();
    return response.json() as Promise<UploadResult>;
  }

  async uploadTeamCsvWithYear(file: File, teamName: string, year: number): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('team', teamName);
    formData.append('year', year.toString());
    const response = await fetch(`${API_BASE_URL}/upload/teams`, {
      method: 'POST',
      headers: this.authHeader(),
      body: formData,
    });
    if (response.status === 401) {
      _logoutCallback?.();
      throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
    }
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Error al subir archivo de equipo');
    }
    updateActivity();
    return response.json() as Promise<UploadResult>;
  }

  async getLastUpload(): Promise<LastUpload> {
    const raw = await this.fetchJSON<{ uploadDate?: string; filename?: string; recordCount?: number; uploadedAt?: string; fileName?: string }>('/upload/last-upload');
    const ts = raw.uploadedAt ?? raw.uploadDate ?? '';
    // SQLite drops DateTimeKind, so backend serializes without 'Z'; append it to force UTC parsing
    const uploadedAt = ts && !ts.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(ts) ? ts + 'Z' : ts;
    return {
      uploadedAt,
      fileName: raw.fileName ?? raw.filename,
      recordCount: raw.recordCount,
    };
  }

  // ── Metrics ─────────────────────────────────────────────────────────────────

  async getSummary(period: Period | null = null): Promise<Summary> {
    return this.fetchJSON<Summary>(`/metrics/summary${this.buildPeriodQuery(period)}`);
  }

  async getUsers(period: Period | null = null): Promise<UserMetrics[]> {
    interface RawUser {
      username: string; equipo: string; totalRequests: number;
      nombre?: string | null; correo?: string | null;
      diasActivos: number; porcentajeUso: number; categoriaUso: string;
      costoTotal: number; modeloFavorito?: string;
      lastDate?: string;
      monthlyQuota?: number;
      quotaLabel?: string;
    }
    const raw = await this.fetchJSON<RawUser[]>(`/metrics/users${this.buildPeriodQuery(period)}`);
    return raw.map(u => ({
      username:         u.username,
      nombre:           u.nombre ?? undefined,
      correo:           u.correo ?? undefined,
      equipo:           u.equipo ?? '',
      totalRequests:    u.totalRequests ?? 0,
      diasActivos:      u.diasActivos ?? 0,
      porcentajeUso:    u.porcentajeUso ?? 0,
      categoriaUso:     u.categoriaUso ?? '',
      totalCost:        u.costoTotal ?? 0,
      modeloFavorito:   u.modeloFavorito,
      lastActivityDate: u.lastDate ?? undefined,
      monthlyQuota:     u.monthlyQuota,
      quotaLabel:       u.quotaLabel,
    }));
  }

  async getUserTimeline(username: string, period: Period | null = null): Promise<TimelineResponse> {
    return this.fetchJSON<TimelineResponse>(
      `/metrics/users/${encodeURIComponent(username)}/timeline${this.buildPeriodQuery(period)}`
    );
  }

  async getUserModels(username: string, period: Period | null = null): Promise<UserModelMetrics[]> {
    return this.fetchJSON<UserModelMetrics[]>(
      `/metrics/users/${encodeURIComponent(username)}/models${this.buildPeriodQuery(period)}`
    );
  }

  async getTeams(period: Period | null = null): Promise<TeamMetrics[]> {
    interface RawTeam {
      equipo: string; usuariosActivos: number;
      totalRequests: number; costoTotal: number;
    }
    const raw = await this.fetchJSON<RawTeam[]>(`/metrics/teams${this.buildPeriodQuery(period)}`);
    return raw.map(t => ({
      team:          t.equipo ?? '',
      totalRequests: t.totalRequests ?? 0,
      userCount:     t.usuariosActivos ?? 0,
      totalCost:     t.costoTotal ?? 0,
    }));
  }

  async getModels(period: Period | null = null): Promise<ModelMetrics[]> {
    return this.fetchJSON<ModelMetrics[]>(`/metrics/models${this.buildPeriodQuery(period)}`);
  }

  async getDailyTrend(period: Period | null = null): Promise<DailyTrend[]> {
    interface RawTrend { date: string; requests: number; usuarios: number; }
    const raw = await this.fetchJSON<RawTrend[]>(`/metrics/daily-trend${this.buildPeriodQuery(period)}`);
    return raw.map(d => ({
      date:          d.date,
      totalRequests: d.requests ?? 0,
      activeUsers:   d.usuarios ?? 0,
    }));
  }

  async getAvailablePeriods(): Promise<AvailablePeriod[]> {
    return this.fetchJSON<AvailablePeriod[]>('/metrics/available-periods');
  }

  // ── Licenses ────────────────────────────────────────────────────────────────

  async getLicenseYears(): Promise<number[]> {
    return this.fetchJSON<number[]>('/licenses/years');
  }

  async getLicenseYearView(year: number): Promise<UserLicenseYear[]> {
    return this.fetchJSON<UserLicenseYear[]>(`/licenses/year-view?year=${year}`);
  }

  async getLicensePeriodAll(year: number, month: number): Promise<unknown[]> {
    return this.fetchJSON<unknown[]>(`/licenses/period/all?year=${year}&month=${month}`);
  }

  async getUserYearLicenses(usuario: string, year: number): Promise<unknown> {
    return this.fetchJSON<unknown>(`/licenses/user/${encodeURIComponent(usuario)}?year=${year}`);
  }

  async updateUserLicense(usuario: string, year: number, month: number, hasLicense: boolean): Promise<unknown> {
    return this.fetchJSON<unknown>(`/licenses/user/${encodeURIComponent(usuario)}`, {
      method: 'PUT',
      body: JSON.stringify({ year, month, hasLicense }),
    });
  }

  async updateLicensesBulk(updates: LicenseBulkUpdate[]): Promise<unknown> {
    return this.fetchJSON<unknown>('/licenses/bulk', {
      method: 'POST',
      body: JSON.stringify(updates),
    });
  }

  // ── Use Cases ────────────────────────────────────────────────────────────────

  async getUseCaseCounts(year: number, month: number): Promise<{ team: string; username: string; count: number }[]> {
    return this.fetchJSON(`/use-cases/counts/${year}/${month}`);
  }

  async getUseCaseCountsByYear(year: number): Promise<{ team: string; username: string; month: number; count: number }[]> {
    return this.fetchJSON(`/use-cases/counts/${year}`);
  }

  async getUserUseCases(username: string, team: string, year: number, month: number): Promise<UseCase[]> {
    return this.fetchJSON<UseCase[]>(`/use-cases/${year}/${month}/${encodeURIComponent(team)}/${encodeURIComponent(username)}`);
  }

  async getUseCaseContent(username: string, team: string, year: number, month: number, filename: string): Promise<string> {
    const response = await fetch(
      `${API_BASE_URL}/use-cases/${year}/${month}/${encodeURIComponent(team)}/${encodeURIComponent(username)}/${encodeURIComponent(filename)}`,
      { headers: this.authHeader() }
    );
    if (response.status === 401) { _logoutCallback?.(); throw new Error('Sesión expirada.'); }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.text();
  }

  async uploadUseCase(username: string, team: string, year: number, month: number, file: File): Promise<{ filename: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(
      `${API_BASE_URL}/use-cases/${year}/${month}/${encodeURIComponent(team)}/${encodeURIComponent(username)}`,
      { method: 'POST', headers: this.authHeader(), body: formData }
    );
    if (response.status === 401) { _logoutCallback?.(); throw new Error('Sesión expirada.'); }
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Error al subir' }));
      throw new Error((err as { message?: string }).message || 'Error al subir caso de uso');
    }
    updateActivity();
    return response.json() as Promise<{ filename: string }>;
  }

  async deleteUseCase(username: string, team: string, year: number, month: number, filename: string): Promise<void> {
    await this.fetchJSON<void>(`/use-cases/${year}/${month}/${encodeURIComponent(team)}/${encodeURIComponent(username)}/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
    });
  }

  // ── AI Report ────────────────────────────────────────────────────────────────

  async getSavedAIReport(year: number, month: number, team?: string): Promise<AIBatchReport | null> {
    const qs = team ? `?team=${encodeURIComponent(team)}` : '';
    try {
      return await this.fetchJSON<AIBatchReport>(`/ai-report/${year}/${month}${qs}`);
    } catch {
      return null;
    }
  }

  async generateAIReport(year: number, month?: number, team?: string): Promise<AIBatchReport> {
    const base = month != null ? `/ai-report/${year}/${month}` : `/ai-report/${year}`;
    const qs = team ? `?team=${encodeURIComponent(team)}` : '';
    return this.fetchJSON<AIBatchReport>(base + qs, { method: 'POST' });
  }

  // ── AI Audit ─────────────────────────────────────────────────────────────────

  async getSavedAIAudit(year: number, month: number, team?: string): Promise<AuditReport | null> {
    const qs = team ? `?team=${encodeURIComponent(team)}` : '';
    try {
      return await this.fetchJSON<AuditReport>(`/ai-audit/${year}/${month}${qs}`);
    } catch {
      return null;
    }
  }

  async generateAIAudit(year: number, month: number, team?: string): Promise<AuditReport> {
    const qs = team ? `?team=${encodeURIComponent(team)}` : '';
    return this.fetchJSON<AuditReport>(`/ai-audit/${year}/${month}${qs}`, { method: 'POST' });
  }

  /** Returns cached score (populated after full audit runs). Returns null on 404. */
  async getAuditScore(team: string, username: string, year: number, month: number): Promise<UserAuditScore | null> {
    const response = await fetch(
      `${API_BASE_URL}/ai-audit/${year}/${month}/${encodeURIComponent(team)}/${encodeURIComponent(username)}`,
      { headers: this.authHeader() }
    ).catch(() => null);
    if (!response || !response.ok) return null;
    return response.json() as Promise<UserAuditScore>;
  }

  // ── Health ──────────────────────────────────────────────────────────────────

  async healthCheck(): Promise<{ status: string; database?: string }> {
    try {
      // Health endpoint is public — no auth header needed
      const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
      return response.json() as Promise<{ status: string; database?: string }>;
    } catch {
      return { status: 'unhealthy' };
    }
  }
}

export default new ApiService();
