import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import styled from 'styled-components';
import { useData } from '../../context/DataContext';

// ─── Styled ──────────────────────────────────────────────────────────────────

const Wrap = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.1rem 1.25rem 0.75rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.07);
  border: 1px solid #F3F4F6;
`;

const Title = styled.h3`
  font-size: 0.82rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.1rem;
`;

const Subtitle = styled.p`
  font-size: 0.72rem;
  color: #6B7280;
  margin: 0 0 0.5rem;
`;

const Empty = styled.div`
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9CA3AF;
  font-size: 0.8rem;
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Ordered team colors (match TeamsSummaryTable palette)
const TEAM_COLORS = [
  '#1B3A5C', // navy
  '#1976D2', // blue
  '#7B3FA0', // purple
  '#E65100', // orange
  '#2E7D32', // dark green
  '#0891B2', // cyan
];

// Color per usage category for scatter dots
const dotColor = (pct: number) => {
  if (pct === 0) return '#D1D5DB';        // sin uso — gris
  if (pct < 30)  return '#EF4444';        // bajo — rojo
  if (pct < 70)  return '#F59E0B';        // medio — amarillo
  return '#22C55E';                        // alto — verde
};

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lo  = Math.floor(idx);
  const hi  = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function boxStats(values: number[]): [number, number, number, number, number] {
  const s = [...values].sort((a, b) => a - b);
  return [
    s[0],
    percentile(s, 25),
    percentile(s, 50),
    percentile(s, 75),
    s[s.length - 1],
  ];
}

// ─── Component ───────────────────────────────────────────────────────────────

const UsageQuartileChart = React.forwardRef<HTMLDivElement>((_, ref) => {
  const { users, loading } = useData();

  const { teams, boxData, scatterData } = useMemo(() => {
    const u = users ?? [];

    // Group users by equipo
    const grouped: Record<string, { pct: number; username: string }[]> = {};
    u.forEach(user => {
      const team = user.equipo || 'Sin equipo';
      if (!grouped[team]) grouped[team] = [];
      grouped[team].push({ pct: user.porcentajeUso ?? 0, username: user.username });
    });

    const teams = Object.keys(grouped).sort();

    // Boxplot data: [min, Q1, median, Q3, max] per team
    const boxData = teams.map(t => {
      const vals = grouped[t].map(u => u.pct);
      return boxStats(vals);
    });

    // Scatter data: individual users [teamIndex, pct, username, equipo]
    const scatterData: { value: [number, number]; username: string; equipo: string; pct: number }[] = [];
    teams.forEach((t, ti) => {
      grouped[t].forEach(u => {
        scatterData.push({ value: [ti, u.pct], username: u.username, equipo: t, pct: u.pct });
      });
    });

    return { teams, boxData, scatterData };
  }, [users]);

  const isEmpty = !loading && teams.length === 0;

  const option = useMemo(() => ({
    grid: { left: 60, right: 20, top: 30, bottom: 50 },
    tooltip: {
      trigger: 'item' as const,
      formatter: (params: any) => {
        if (params.seriesType === 'scatter') {
          const { username, equipo, pct } = params.data;
          const cat = pct === 0 ? 'Sin uso' : pct < 30 ? 'Bajo' : pct < 70 ? 'Medio' : 'Alto';
          return `<b>${username}</b><br/>${equipo}<br/>Uso: <b>${pct.toFixed(1)}%</b> — ${cat}`;
        }
        // boxplot
        const [min, q1, med, q3, max] = params.data;
        const team = teams[params.dataIndex] ?? '';
        return [
          `<b>${team}</b>`,
          `Máx: ${max.toFixed(1)}%`,
          `Q3:  ${q3.toFixed(1)}%`,
          `Mediana: ${med.toFixed(1)}%`,
          `Q1:  ${q1.toFixed(1)}%`,
          `Mín: ${min.toFixed(1)}%`,
        ].join('<br/>');
      },
    },
    xAxis: {
      type: 'category' as const,
      data: teams,
      axisLabel: { fontSize: 11, color: '#374151' },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#E5E7EB' } },
    },
    yAxis: {
      type: 'value' as const,
      name: 'Uso (%)',
      nameTextStyle: { fontSize: 10, color: '#6B7280' },
      min: 0,
      max: 100,
      interval: 10,
      axisLabel: { formatter: '{value}%', fontSize: 10, color: '#6B7280' },
      splitLine: { lineStyle: { color: '#F3F4F6' } },
    },
    series: [
      // ── Boxplot ──
      {
        name: 'Distribución',
        type: 'boxplot' as const,
        data: boxData,
        itemStyle: {
          color: (params: any) => TEAM_COLORS[params.dataIndex % TEAM_COLORS.length] + '33', // 20% opacity fill
          borderColor: (params: any) => TEAM_COLORS[params.dataIndex % TEAM_COLORS.length],
          borderWidth: 2,
        },
        boxWidth: ['30%', '50%'],
        markLine: {
          silent: true,
          symbol: 'none',
          data: [
            {
              yAxis: 30,
              lineStyle: { color: '#F59E0B', type: 'dashed', width: 1.5 },
              label: { formatter: 'Medio (30%)', position: 'insideEndTop', fontSize: 10, color: '#F59E0B' },
            },
            {
              yAxis: 70,
              lineStyle: { color: '#22C55E', type: 'dashed', width: 1.5 },
              label: { formatter: 'Alto (70%)', position: 'insideEndTop', fontSize: 10, color: '#22C55E' },
            },
          ],
        },
      },
      // ── Scatter — individual users ──
      {
        name: 'Usuario',
        type: 'scatter' as const,
        data: scatterData.map(d => ({
          value: d.value,
          username: d.username,
          equipo: d.equipo,
          pct: d.pct,
          itemStyle: { color: dotColor(d.pct), opacity: 0.85 },
        })),
        symbolSize: 7,
        z: 10,
      },
    ],
  }), [teams, boxData, scatterData]);

  return (
    <Wrap ref={ref}>
      <Title>Distribución de uso por equipo</Title>
      <Subtitle>Cuartiles de % de uso individual · cada punto es un usuario</Subtitle>
      {loading && <Empty>Cargando...</Empty>}
      {isEmpty && <Empty>Sin datos de usuarios</Empty>}
      {!loading && !isEmpty && (
        <ReactECharts option={option} style={{ height: '300px' }} notMerge />
      )}
    </Wrap>
  );
});

UsageQuartileChart.displayName = 'UsageQuartileChart';
export default UsageQuartileChart;
