import React from 'react';
import ReactECharts from 'echarts-for-react';
import styled from 'styled-components';
import { useData } from '../../context/DataContext';

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

const LowUsageByTeamChart: React.FC = () => {
  const { users, loading } = useData();

  // Group users by team and calculate low-usage percentages
  const teamMap = (users ?? []).reduce<Record<string, { total: number; inactive: number; low: number }>>((acc, u) => {
    const team = u.equipo || 'Sin equipo';
    if (!acc[team]) acc[team] = { total: 0, inactive: 0, low: 0 };
    acc[team].total += 1;
    if (u.porcentajeUso === 0) acc[team].inactive += 1;
    else if (u.porcentajeUso < 30) acc[team].low += 1;
    return acc;
  }, {});

  const rows = Object.entries(teamMap)
    .map(([team, { total, inactive, low }]) => ({
      team,
      total,
      inactive,
      low,
      pctInactive: total > 0 ? Math.round((inactive / total) * 100) : 0,
      pctLow: total > 0 ? Math.round((low / total) * 100) : 0,
    }))
    .sort((a, b) => (b.pctInactive + b.pctLow) - (a.pctInactive + a.pctLow));

  const isEmpty = !loading && rows.length === 0;

  const option = {
    tooltip: {
      trigger: 'axis' as const,
      axisPointer: { type: 'none' as const },
      formatter: (params: { seriesName: string; value: number; name: string }[]) => {
        const team = rows.find(r => r.team === params[0].name);
        if (!team) return '';
        return `<div style="font-size:12px"><strong>${team.team}</strong> (${team.total} usuarios)<br/>` +
          `Sin actividad: <strong>${team.inactive} (${team.pctInactive}%)</strong><br/>` +
          `Uso bajo (<30%): <strong>${team.low} (${team.pctLow}%)</strong></div>`;
      },
    },
    legend: {
      bottom: 0,
      left: 'center',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { fontSize: 10, color: '#6B7280' },
    },
    grid: { top: 6, right: 60, bottom: 30, left: 10, containLabel: true },
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
    series: [
      {
        name: 'Sin actividad',
        type: 'bar',
        stack: 'total',
        data: rows.map(r => r.pctInactive),
        barMaxWidth: 18,
        itemStyle: { color: '#EF4444', borderRadius: [0, 0, 0, 0] },
        label: {
          show: true,
          position: 'inside' as const,
          fontSize: 10,
          color: '#fff',
          formatter: (p: { value: number }) => p.value > 0 ? `${p.value}%` : '',
        },
      },
      {
        name: 'Uso bajo (<30%)',
        type: 'bar',
        stack: 'total',
        data: rows.map(r => r.pctLow),
        barMaxWidth: 18,
        itemStyle: { color: '#F59E0B', borderRadius: [0, 4, 4, 0] },
        label: {
          show: true,
          position: 'right' as const,
          fontSize: 10,
          color: '#6B7280',
          formatter: (p: { value: number; dataIndex: number }) => {
            const r = rows[p.dataIndex];
            const total = (r?.pctInactive ?? 0) + p.value;
            return total > 0 ? `${total}%` : '';
          },
        },
      },
    ],
  };

  return (
    <Wrap>
      <Title>% bajo uso por equipo</Title>
      {loading && <Empty>Cargando...</Empty>}
      {isEmpty && <Empty>Sin datos</Empty>}
      {!loading && !isEmpty && (
        <ReactECharts option={option} style={{ height: `${Math.max(180, rows.length * 32 + 50)}px` }} notMerge />
      )}
    </Wrap>
  );
};

LowUsageByTeamChart.displayName = 'LowUsageByTeamChart';
export default LowUsageByTeamChart;
