import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import styled from 'styled-components';
import { useData } from '../../context/DataContext';
import api from '../../services/api';

const Wrap = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.1rem 1.25rem 0.75rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.07);
  border: 1px solid #F3F4F6;
  display: flex;
  flex-direction: column;
`;

const Title = styled.h3`
  font-size: 0.82rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem;
`;

const Empty = styled.div`
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9CA3AF;
  font-size: 0.8rem;
`;

interface TeamRow {
  team: string;
  total: number;
  withCase: number;
  pct: number;
}

const colorOf = (pct: number) =>
  pct >= 70 ? '#10B981' : pct >= 30 ? '#F59E0B' : '#EF4444';

const UseCaseComplianceChart: React.FC = () => {
  const { users, loading: ctxLoading, filters } = useData();
  const [rows, setRows] = useState<TeamRow[]>([]);
  const [fetching, setFetching] = useState(false);

  const period = filters.selectedPeriod;

  useEffect(() => {
    if (!period) return;
    let cancelled = false;
    setFetching(true);

    api.getUseCaseCounts(period.year, period.month)
      .then(counts => {
        if (cancelled) return;

        // Users who completed the minimum (≥3 cases) per team
        const withCaseByTeam: Record<string, Set<string>> = {};
        counts.forEach(({ team, username, count }) => {
          if (count >= 3) {
            if (!withCaseByTeam[team]) withCaseByTeam[team] = new Set();
            withCaseByTeam[team].add(username);
          }
        });

        // Total members per team from users context
        const membersByTeam: Record<string, number> = {};
        (users ?? []).forEach(u => {
          if (u.equipo) membersByTeam[u.equipo] = (membersByTeam[u.equipo] ?? 0) + 1;
        });

        const computed: TeamRow[] = Object.entries(membersByTeam).map(([team, total]) => {
          const withCase = withCaseByTeam[team]?.size ?? 0;
          const pct = total > 0 ? Math.round((withCase / total) * 100) : 0;
          return { team, total, withCase, pct };
        });

        // Sort ascending (lowest compliance at top in ECharts)
        computed.sort((a, b) => a.pct - b.pct);
        setRows(computed);
      })
      .catch(() => setRows([]))
      .finally(() => { if (!cancelled) setFetching(false); });

    return () => { cancelled = true; };
  }, [period?.year, period?.month, users]);

  const loading = ctxLoading || fetching;
  const isEmpty = !loading && rows.length === 0;

  const option = {
    tooltip: {
      trigger: 'axis' as const,
      axisPointer: { type: 'none' as const },
      formatter: (params: { name: string; value: number }[]) => {
        const d = params[0];
        const r = rows.find(t => t.team === d.name);
        if (!r) return '';
        return `<div style="font-size:12px"><strong>${r.team}</strong> (${r.total} miembros)<br/>` +
          `Con caso de uso: <strong>${r.withCase}</strong><br/>` +
          `Cumplimiento: <strong>${r.pct}%</strong></div>`;
      },
    },
    grid: { top: 6, right: 55, bottom: 8, left: 10, containLabel: true },
    xAxis: {
      type: 'value' as const,
      max: 100,
      axisLabel: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'category' as const,
      data: rows.map(r => r.team),
      axisLabel: {
        color: '#374151',
        fontSize: 11,
        formatter: (name: string) => {
          const r = rows.find(t => t.team === name);
          return r ? `${name}  (${r.total})` : name;
        },
      },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: rows.map(r => ({
        value: r.pct,
        itemStyle: { color: colorOf(r.pct), borderRadius: [0, 4, 4, 0] },
      })),
      barMaxWidth: 18,
      label: {
        show: true,
        position: 'right' as const,
        fontSize: 11,
        color: '#6B7280',
        formatter: (p: { value: number }) => `${p.value}%`,
      },
    }],
  };

  return (
    <Wrap>
      <Title>% cumplimiento de casos de uso por equipo</Title>
      {loading && <Empty>Cargando...</Empty>}
      {isEmpty && <Empty>Sin datos de casos de uso</Empty>}
      {!loading && !isEmpty && (
        <ReactECharts
          option={option}
          style={{ height: `${Math.max(180, rows.length * 34 + 50)}px` }}
          notMerge
        />
      )}
    </Wrap>
  );
};

UseCaseComplianceChart.displayName = 'UseCaseComplianceChart';
export default UseCaseComplianceChart;
