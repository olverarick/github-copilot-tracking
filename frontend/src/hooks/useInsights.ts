import type { UserMetrics, TeamMetrics, Summary } from '../types';

export interface Insight {
  type: 'warning' | 'danger' | 'info' | 'success';
  icon: string;
  title: string;
  description: string;
}

/**
 * Derives actionable insights from current period data — no backend changes required.
 * Pure function so it can be tested and memoized easily.
 */
export function deriveInsights(
  users: UserMetrics[] | undefined,
  teams: TeamMetrics[] | undefined,
  summary: Summary | null,
): Insight[] {
  const insights: Insight[] = [];
  const safeUsers = users ?? [];
  const safeTeams = teams ?? [];
  if (!safeUsers.length || !summary) return insights;

  // 1. Inactive users (zero usage) → wasted licenses
  const inactive = safeUsers.filter(u => u.porcentajeUso === 0);
  if (inactive.length > 0) {
    const names = inactive.slice(0, 3).map(u => u.username).join(', ');
    const more = inactive.length > 3 ? ` +${inactive.length - 3}` : '';
    insights.push({
      type: 'danger',
      icon: '🚫',
      title: `${inactive.length} usuario${inactive.length > 1 ? 's' : ''} sin actividad`,
      description: `Licencias potencialmente desperdiciadas: ${names}${more}`,
    });
  }

  // 2. Low usage (> 0% but < 30%)
  const lowUsage = safeUsers.filter(u => u.porcentajeUso > 0 && u.porcentajeUso < 30);
  if (lowUsage.length > 0) {
    const names = lowUsage.slice(0, 3).map(u => u.username).join(', ');
    const more = lowUsage.length > 3 ? ` y ${lowUsage.length - 3} más` : '';
    insights.push({
      type: 'warning',
      icon: '⚠️',
      title: `${lowUsage.length} usuario${lowUsage.length > 1 ? 's' : ''} con uso bajo (<30%)`,
      description: `${names}${more}`,
    });
  }

  // 3. Teams with high requests-per-user vs the cross-team average
  if (safeTeams.length >= 2) {
    // Usar usuarios activos (userCount) — misma fuente que PROM./ACTIVO en la tabla
    const teamsWithUsers = safeTeams
      .map(t => ({ ...t, activeUsers: t.userCount ?? 1 }))
      .filter(t => t.activeUsers > 0);

    const avgPerUser = teamsWithUsers.reduce((s, t) => s + t.totalRequests / t.activeUsers, 0) / teamsWithUsers.length;
    teamsWithUsers
      .filter(t => {
        const perUser = t.totalRequests / t.activeUsers;
        return perUser > avgPerUser * 1.35;
      })
      .forEach(t => {
        const perUser = Math.round(t.totalRequests / t.activeUsers);
        const pct = Math.round(((perUser - avgPerUser) / avgPerUser) * 100);
        insights.push({
          type: 'info',
          icon: '📈',
          title: `${t.team} usa +${pct}% más por activo`,
          description: `${perUser.toLocaleString('es-MX')} req/activo vs promedio ${Math.round(avgPerUser).toLocaleString('es-MX')} (${t.activeUsers} activos)`,
        });
      });
  }

  // 4. Celebrate high adoption: users with usage > 40% of quota
  if (summary.totalUsers > 0) {
    const highAdopters = safeUsers.filter(u => u.porcentajeUso > 40);
    const pct = Math.round((highAdopters.length / summary.totalUsers) * 100);
    if (pct >= 50) {
      insights.push({
        type: 'success',
        icon: '✅',
        title: `Alta adopción: ${pct}% con uso mayor al 40%`,
        description: `${highAdopters.length} de ${summary.totalUsers} usuarios superan el 40% de su cuota`,
      });
    }
  }

  return insights;
}
