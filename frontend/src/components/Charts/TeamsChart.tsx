import React from 'react';
import ReactECharts from 'echarts-for-react';
import styled, { useTheme } from 'styled-components';
import { Card } from '../../styles/components';
import { useData } from '../../context/DataContext';

const ChartContainer = styled(Card)`padding: 1rem 1.25rem 1.25rem;`;
const ChartTitle = styled.h3`font-size: 0.82rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: ${({ theme }) => theme.colors?.textSecondary}; margin: 0 0 0.75rem 0;`;
const EmptyState = styled.div`padding: ${({ theme }) => theme.spacing?.xl}; text-align: center; color: ${({ theme }) => theme.colors?.textSecondary};`;

const TeamsChart = React.forwardRef<HTMLDivElement>((_, ref) => {
  const { teams, loading } = useData();
  const theme = useTheme();

  if (loading) return <ChartContainer ref={ref}><ChartTitle>Comparación de Equipos</ChartTitle><EmptyState>Cargando...</EmptyState></ChartContainer>;
  if (!teams?.length) return <ChartContainer ref={ref}><ChartTitle>Comparación de Equipos</ChartTitle><EmptyState>No hay datos de equipos disponibles</EmptyState></ChartContainer>;

  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['Requests', 'Costo ($)'], textStyle: { color: theme.colors?.textPrimary, fontSize: 12 } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: teams.map(t => t.team),
      axisLabel: { color: theme.colors?.textSecondary, fontSize: 12 },
      axisLine: { lineStyle: { color: theme.colors?.border } },
    },
    yAxis: { type: 'value', axisLabel: { color: theme.colors?.textSecondary, fontSize: 11 }, splitLine: { lineStyle: { color: theme.colors?.divider } } },
    series: [
      { name: 'Requests', type: 'bar', data: teams.map(t => t.totalRequests), itemStyle: { color: theme.colors?.primary } },
      { name: 'Costo ($)', type: 'bar', data: teams.map(t => Math.round(t.totalCost)), itemStyle: { color: theme.colors?.success } },
    ],
  };

  return (
    <ChartContainer ref={ref}>
      <ChartTitle>COMPARACIÓN DE EQUIPOS</ChartTitle>
      <ReactECharts option={option} style={{ height: '280px' }} />
    </ChartContainer>
  );
});

TeamsChart.displayName = 'TeamsChart';
export default TeamsChart;
