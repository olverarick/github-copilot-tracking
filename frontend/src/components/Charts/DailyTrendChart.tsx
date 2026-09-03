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

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const Title = styled.h3`
  font-size: 0.82rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
`;

const Empty = styled.div`
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9CA3AF;
  font-size: 0.8rem;
`;

const DailyTrendChart = React.forwardRef<HTMLDivElement>((_, ref) => {
  const { dailyTrend, loading } = useData();

  const isEmpty = !loading && (!dailyTrend || dailyTrend.length === 0);

  const fmtLabel = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v);

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line', lineStyle: { color: '#1B3A5C', width: 1, type: 'dashed' } },
      formatter: (params: { name: string; value: number }[]) => {
        const d = params[0];
        return `<div style="font-size:12px"><strong>${d.name}</strong><br/>Requests: <strong>${d.value.toLocaleString('es-MX')}</strong></div>`;
      },
    },
    grid: { top: 10, right: 16, bottom: 40, left: 48 },
    xAxis: {
      type: 'category' as const,
      boundaryGap: false,
      data: (dailyTrend ?? []).map(d => {
        const parts = d.date.split('-');
        return parts.length === 3 ? `${Number(parts[2])} ${['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][Number(parts[1]) - 1]}` : d.date;
      }),
      axisLabel: { color: '#9CA3AF', fontSize: 11, interval: Math.floor((dailyTrend?.length ?? 1) / 6) },
      axisLine: { lineStyle: { color: '#F3F4F6' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: { color: '#9CA3AF', fontSize: 11, formatter: fmtLabel },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#F3F4F6' } },
    },
    series: [{
      name: 'Requests',
      type: 'line',
      smooth: true,
      symbol: 'none',
      data: (dailyTrend ?? []).map(d => d.totalRequests),
      lineStyle: { color: '#1B3A5C', width: 2.5 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(27,58,92,0.18)' },
            { offset: 1, color: 'rgba(27,58,92,0.01)' },
          ],
        },
      },
    }],
  };

  return (
    <Wrap ref={ref}>
      <Header>
        <Title>Tendencia diaria de requests</Title>
      </Header>
      {loading && <Empty>Cargando...</Empty>}
      {isEmpty && <Empty>Sin datos para el período</Empty>}
      {!loading && !isEmpty && (
        <ReactECharts option={option} style={{ height: '220px' }} notMerge />
      )}
    </Wrap>
  );
});

DailyTrendChart.displayName = 'DailyTrendChart';
export default DailyTrendChart;
