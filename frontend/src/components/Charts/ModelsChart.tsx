import React from 'react';
import ReactECharts from 'echarts-for-react';
import styled, { useTheme } from 'styled-components';
import { Card } from '../../styles/components';
import { useData } from '../../context/DataContext';

const ChartContainer = styled(Card)`padding: 1rem 1.25rem 1.25rem;`;
const ChartTitle = styled.h3`font-size: 0.82rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: ${({ theme }) => theme.colors?.textSecondary}; margin: 0 0 0.75rem 0;`;
const EmptyState = styled.div`padding: ${({ theme }) => theme.spacing?.xl}; text-align: center; color: ${({ theme }) => theme.colors?.textSecondary};`;

const ModelsChart = React.forwardRef<HTMLDivElement>((_, ref) => {
  const { models, loading } = useData();
  const theme = useTheme();

  if (loading) return <ChartContainer ref={ref}><ChartTitle>Uso por Modelo de IA</ChartTitle><EmptyState>Cargando...</EmptyState></ChartContainer>;
  if (!models?.length) return <ChartContainer ref={ref}><ChartTitle>Uso por Modelo de IA</ChartTitle><EmptyState>No hay datos disponibles</EmptyState></ChartContainer>;

  const colors = [theme.colors?.primary, theme.colors?.secondary, theme.colors?.success, theme.colors?.warning, theme.colors?.info, theme.colors?.error];

  const data = models.map((m, i) => ({
    value: m.totalRequests,
    name: m.model,
    itemStyle: { color: colors[i % colors.length] },
  }));

  const option = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} requests ({d}%)' },
    legend: { orient: 'horizontal', bottom: 0, textStyle: { color: theme.colors?.textPrimary, fontSize: 11 } },
    series: [{
      name: 'Modelo', type: 'pie', radius: '60%', center: ['50%', '45%'], data,
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' } },
      label: { show: true, formatter: '{b}\n{d}%', color: theme.colors?.textPrimary, fontSize: 11 },
    }],
  };

  return (
    <ChartContainer ref={ref}>
      <ChartTitle>USO POR MODELO DE IA</ChartTitle>
      <ReactECharts option={option} style={{ height: '280px' }} />
    </ChartContainer>
  );
});

ModelsChart.displayName = 'ModelsChart';
export default ModelsChart;
