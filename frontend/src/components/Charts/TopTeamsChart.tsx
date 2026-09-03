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

const TopTeamsChart = React.forwardRef<HTMLDivElement>((_, ref) => {
  const { teams, loading } = useData();

  // Usuarios activos por equipo (usaron Copilot) — misma fuente que PROM./ACTIVO en la tabla
  const top5 = [...(teams ?? [])]
    .map(t => {
      const activeUsers = t.userCount ?? 1;
      return { ...t, activeUsers, perUser: activeUsers > 0 ? t.totalRequests / activeUsers : 0 };
    })
    .sort((a, b) => b.perUser - a.perUser)
    .slice(0, 5)
    .reverse();

  const isEmpty = !loading && top5.length === 0;

  const option = {
    tooltip: {
      trigger: 'axis' as const,
      axisPointer: { type: 'none' as const },
      formatter: (params: { name: string; value: number }[]) => {
        const d = params[0];
        const team = top5.find(t => t.team === d.name);
        return `<div style="font-size:12px"><strong>${d.name}</strong><br/>` +
          `Req/activo: <strong>${d.value.toLocaleString('es-MX', { maximumFractionDigits: 1 })}</strong><br/>` +
          `Total requests: <strong>${(team?.totalRequests ?? 0).toLocaleString('es-MX')}</strong><br/>` +
          `Activos: <strong>${team?.activeUsers ?? 0}</strong></div>`;
      },
    },
    grid: { top: 6, right: 140, bottom: 8, left: 10, containLabel: true },
    xAxis: {
      type: 'value' as const,
      axisLabel: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'category' as const,
      data: top5.map(t => t.team),
      axisLabel: {
        color: '#374151',
        fontSize: 11,
        formatter: (name: string) => {
          const team = top5.find(t => t.team === name);
          return team ? `${name}  (${team.activeUsers})` : name;
        },
      },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: top5.map(t => Math.round(t.perUser * 10) / 10),
      barMaxWidth: 22,
      itemStyle: {
        color: '#1B3A5C',
        borderRadius: [0, 4, 4, 0],
      },
      label: {
        show: true,
        position: 'right' as const,
        fontSize: 11,
        color: '#6B7280',
        formatter: (p: { value: number }) =>
          `${p.value.toLocaleString('es-MX', { maximumFractionDigits: 1 })} req/activo`,
      },
    }],
  };

  return (
    <Wrap ref={ref}>
      <Title>Top 5 equipos por consumo · req/usuario activo</Title>
      {loading && <Empty>Cargando...</Empty>}
      {isEmpty && <Empty>Sin datos de equipos</Empty>}
      {!loading && !isEmpty && (
        <ReactECharts option={option} style={{ height: '220px' }} notMerge />
      )}
    </Wrap>
  );
});

TopTeamsChart.displayName = 'TopTeamsChart';
export default TopTeamsChart;
