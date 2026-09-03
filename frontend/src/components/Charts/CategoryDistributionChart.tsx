import React from 'react';
import ReactECharts from 'echarts-for-react';
import styled, { useTheme } from 'styled-components';
import { Card } from '../../styles/components';
import { useData } from '../../context/DataContext';
import { getCategoryColor } from '../../utils/echartsTheme';

const ChartContainer = styled(Card)`padding: 1rem 1.25rem 1.25rem;`;
const ChartTitle = styled.h3`font-size: 0.82rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: ${({ theme }) => theme.colors?.textSecondary}; margin: 0 0 0.75rem 0;`;
const EmptyState = styled.div`padding: ${({ theme }) => theme.spacing?.xl}; text-align: center; color: ${({ theme }) => theme.colors?.textSecondary};`;

const CATEGORIES = ['SIN USO', 'USO BAJO (<40%)', 'USO MODERADO (40-70%)', 'USO ALTO (>70%)'];

const CategoryDistributionChart = React.forwardRef<HTMLDivElement>((_, ref) => {
  const { users, loading } = useData();
  const theme = useTheme();

  if (loading) return <ChartContainer ref={ref}><ChartTitle>Distribución por Categoría</ChartTitle><EmptyState>Cargando...</EmptyState></ChartContainer>;
  if (!users?.length) return <ChartContainer ref={ref}><ChartTitle>Distribución por Categoría</ChartTitle><EmptyState>No hay datos disponibles</EmptyState></ChartContainer>;

  const categoryCount = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.categoriaUso] = (acc[u.categoriaUso] || 0) + 1;
    return acc;
  }, {});

  const data = CATEGORIES.map(cat => ({
    value: categoryCount[cat] || 0,
    name: cat,
    itemStyle: { color: getCategoryColor(cat, theme) },
  }));

  const option = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} usuarios ({d}%)' },
    legend: { orient: 'vertical', left: 'left', textStyle: { color: theme.colors?.textPrimary, fontSize: 12 } },
    series: [{
      name: 'Categoría de Uso', type: 'pie', radius: ['40%', '70%'], center: ['60%', '50%'],
      avoidLabelOverlap: false,
      label: { show: true, formatter: '{b}\n{c} usuarios', color: theme.colors?.textPrimary, fontSize: 11 },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 600 } },
      labelLine: { show: true },
      data,
    }],
  };

  return (
    <ChartContainer ref={ref}>
      <ChartTitle>CATEGORÍA DE USO</ChartTitle>
      <ReactECharts option={option} style={{ height: '280px' }} />
    </ChartContainer>
  );
});

CategoryDistributionChart.displayName = 'CategoryDistributionChart';
export default CategoryDistributionChart;
