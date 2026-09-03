// ─── Domain types ────────────────────────────────────────────────────────────

export interface Period {
  year: number;
  month: number;
}

export interface Summary {
  totalRequests: number;
  totalUsers: number;
  activeUsers: number;
  totalCost: number;
  period?: string;
}

export interface UserMetrics {
  username: string;
  /** Nombre completo. Ausente si el usuario solo existe en PremiumRequests. */
  nombre?: string;
  /** Correo institucional. Ausente si el usuario solo existe en PremiumRequests. */
  correo?: string;
  equipo: string;
  totalRequests: number;
  diasActivos: number;
  porcentajeUso: number;
  categoriaUso: string;
  totalCost: number;
  modeloFavorito?: string;
  lastActivityDate?: string;
  monthlyQuota?: number;
  quotaLabel?: string;
}

export interface TeamMetrics {
  team: string;
  totalRequests: number;
  userCount: number;
  totalCost: number;
  percentage?: number;
}

export interface ModelMetrics {
  model: string;
  totalRequests: number;
  totalCost: number;
  percentage?: number;
}

export interface DailyTrend {
  date: string;
  totalRequests: number;
  activeUsers?: number;
}

export interface AvailablePeriod {
  year: number;
  month: number;
  label: string;
}

export interface LastUpload {
  uploadedAt: string;
  fileName?: string;
  recordCount?: number;
}

// ─── User detail types ───────────────────────────────────────────────────────

export interface TimelineEntry {
  requests: number;
  model: string;
}

export interface TimelineResponse {
  timeline: Record<string, TimelineEntry[]>;
  raw: Array<{ date: string; requests: number; model: string }>;
}

export interface UserModelMetrics {
  model: string;
  totalRequests: number;
  totalCost: number;
  percentage: number;
  diasUso: number;
}

export interface UseCase {
  filename: string;
  lastModified: string;
}

// ─── License types ───────────────────────────────────────────────────────────

export interface UserLicenseYear {
  usuario: string;
  equipo: string;
  licenses: Record<number, boolean>;
  modifiedBy: Record<number, string | null>;
}

export interface LicenseBulkUpdate {
  usuario: string;
  year: number;
  month: number;
  hasLicense: boolean;
}

// ─── Filter / state types ────────────────────────────────────────────────────

export interface Filters {
  teamFilter: string;
  categoryFilter: string;
  searchQuery: string;
  selectedPeriod: Period | null;
}

// ─── Upload result types ─────────────────────────────────────────────────────

export interface UploadResult {
  message: string;
  count?: number;
}

// ─── AI Report types ────────────────────────────────────────────────────────

export interface AIBatchReport {
  period: { year: number; month: number | null; label: string };
  generatedAt: string;
  usersProcessed: number;
  users: AIUserReport[];
  errors: string[];
}

export interface AIUserReport {
  username: string;
  team: string;
  filesAnalyzed: number;
  reportContent: string;
  savedPath: string;
}

// ─── AI Audit types ───────────────────────────────────────────────────────────

export interface AuditReport {
  period: { year: number; month: number; label: string };
  generatedAt: string;
  resumenEquipos: { equipo: string; scorePromedio: number; usuariosEvaluados: number; casosEvaluados: number }[];
  auditoriasUsuario: AuditUserEntry[];
}

export interface AuditUserEntry {
  username: string;
  equipo: string;
  scorePromedio: number;
  badge: 'green' | 'yellow' | 'red';
  archivos: AuditFileEntry[];
}

export interface AuditFileEntry {
  nombre: string;
  score: number;
  criterios: {
    tienePromptReal: boolean;
    tieneEvidenciaTecnica: boolean;
    problemaEspecifico: boolean;
    leccionesAccionables: boolean;
    evaluacionCompleta: boolean;
  };
  codeReview: {
    tieneCodigo: boolean;
    esBuenasPractica: boolean;
    problemas: string[];
    destacados: string[];
  };
  comentarioIA: string;
}

export interface UserAuditScore {
  username: string;
  equipo: string;
  scorePromedio: number;
  badge: 'green' | 'yellow' | 'red';
}

// ─── Vite env augmentation ───────────────────────────────────────────────────

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
