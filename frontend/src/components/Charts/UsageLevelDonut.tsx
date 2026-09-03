import React, { useMemo } from 'react';
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
  margin: 0 0 0.25rem;
`;

const Empty = styled.div`
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9CA3AF;
  font-size: 0.8rem;
`;

const UsageLevelDonut = React.forwardRef<HTMLDivElement>((_, ref) => {
  const { users, loading } = useData();

  const { alto, medio, bajo, sinUso, total } = useMemo(() => {
    const u = users ?? [];
    const a = u.filter(x => (x.porcentajeUso ?? 0) >= 70).length;
    const m = u.filter(x => (x.porcentajeUso ?? 0) >= 30 && (x.porcentajeUso ?? 0) < 70).length;
    const b = u.filter(x => (x.porcentajeUso ?? 0) > 0 && (x.porcentajeUso ?? 0) < 30).length;
    const s = u.filter(x => (x.porcentajeUso ?? 0) === 0 && (x.totalRequests ?? 0) === 0).length;
    return { alto: a, medio: m, bajo: b, sinUso: s, total: u.length };
  }, [users]);

  const isEmpty = !loading && total === 0;

  const pct = (n: number) => total > 0 ? ((n / total) * 100).toFixed(1) : '0';

  const option = {
    tooltip: {
      trigger: 'item' as const,
      formatter: '{b}: {c} usuarios ({d}%)',
    },
    legend: {
      orient: 'vertical' as const,
      right: 8,
      top: 'middle',
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 14,
      textStyle: { fontSize: 11, color: '#374151' },
      formatter: (name: string) => {
        if (name === 'Alto (≥70%)') return `Alto (≥70%)\n${alto} usuarios (${pct(alto)}%)`;
        if (name === 'Medio (30-69%)') return `Medio (30-69%)\n${medio} usuarios (${pct(medio)}%)`;
        if (name === 'Bajo (<30%)') return `Bajo (<30%)\n${bajo} usuarios (${pct(bajo)}%)`;
        return `Sin uso (0%)\n${sinUso} usuarios (${pct(sinUso)}%)`;
      },
    },
    series: [{
      type: 'pie',
      radius: ['42%', '70%'],
      center: ['38%', '55%'],
      avoidLabelOverlap: false,
      label: {
        show: true,
        position: 'center' as const,
        formatter: () => `{total|${total}}\n{sub|Usuarios}`,
        rich: {
          total: { fontSize: 22, fontWeight: 700, color: '#111827', lineHeight: 28 },
          sub:   { fontSize: 11, color: '#6B7280', lineHeight: 18 },
        },
      },
      emphasis: { label: { show: true } },
      labelLine: { show: false },
      data: [
        { value: alto,   name: 'Alto (≥70%)',    itemStyle: { color: '#22C55E' } },
        { value: medio,  name: 'Medio (30-69%)', itemStyle: { color: '#F59E0B' } },
        { value: bajo,   name: 'Bajo (<30%)',    itemStyle: { color: '#FB923C' } },
        { value: sinUso, name: 'Sin uso (0%)',   itemStyle: { color: '#EF4444' } },
      ],
    }],
  };

  return (
    <Wrap ref={ref}>
      <Title>Uso por nivel de utilización</Title>
      {loading && <Empty>Cargando...</Empty>}
      {isEmpty && <Empty>Sin datos de usuarios</Empty>}
      {!loading && !isEmpty && (
        <ReactECharts option={option} style={{ height: '220px' }} notMerge />
      )}
    </Wrap>
  );
});

UsageLevelDonut.displayName = 'UsageLevelDonut';
export default UsageLevelDonut;
