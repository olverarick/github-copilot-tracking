import React, { useMemo } from 'react';
import styled from 'styled-components';
import { useData } from '../../context/DataContext';

const LICENSE_PRICE = 19;

// ── Styled components ──────────────────────────────────────────────────────────

const Wrap = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.1rem 1.25rem 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.07);
  border: 1px solid #F3F4F6;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const Title = styled.h3`
  font-size: 0.82rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
`;

const BarWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;

const BarTrack = styled.div`
  display: flex;
  height: 22px;
  border-radius: 6px;
  overflow: hidden;
  background: #F3F4F6;
`;

interface SegmentProps {
  $pct: number;
  $color: string;
}
const Segment = styled.div<SegmentProps>`
  width: ${({ $pct }) => $pct}%;
  background: ${({ $color }) => $color};
  transition: width 0.4s ease;
  min-width: ${({ $pct }) => $pct > 0 ? '4px' : '0'};
`;

const BarLegend = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  color: #6B7280;
`;

const Dot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  display: inline-block;
  flex-shrink: 0;
`;

const TiersGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
`;

const TierCard = styled.div<{ $border: string }>`
  border-left: 3px solid ${({ $border }) => $border};
  padding: 0.5rem 0.6rem;
  background: #FAFAFA;
  border-radius: 0 6px 6px 0;
`;

const TierLabel = styled.div`
  font-size: 0.7rem;
  font-weight: 700;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

const TierCount = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  color: #111827;
  line-height: 1.3;
`;

const TierSub = styled.div`
  font-size: 0.7rem;
  color: #6B7280;
  line-height: 1.4;
`;

const TotalRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.5rem;
  border-top: 1px solid #F3F4F6;
`;

const TotalLabel = styled.span`
  font-size: 0.75rem;
  color: #6B7280;
`;

const TotalValue = styled.span`
  font-size: 0.82rem;
  font-weight: 700;
  color: #0077C8;
`;

const Empty = styled.div`
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9CA3AF;
  font-size: 0.8rem;
`;

// ── Component ──────────────────────────────────────────────────────────────────

const LicenseOptimizationPanel = React.forwardRef<HTMLDivElement>((_, ref) => {
  const { users, loading } = useData();

  const stats = useMemo(() => {
    const u = users ?? [];
    // Sin uso: 0% de actividad
    const sinUso = u.filter(x => (x.porcentajeUso ?? 0) === 0);
    // Bajo: 0% < uso < 30%
    const bajo = u.filter(x => (x.porcentajeUso ?? 0) > 0 && (x.porcentajeUso ?? 0) < 30);
    // Medio: 30% <= uso < 70%
    const medio = u.filter(x => (x.porcentajeUso ?? 0) >= 30 && (x.porcentajeUso ?? 0) < 70);
    // Alto: >= 70%
    const alto = u.filter(x => (x.porcentajeUso ?? 0) >= 70);

    const total = u.length;

    const pct = (n: number) => total > 0 ? (n / total) * 100 : 0;

    return {
      total,
      sinUso: sinUso.length,
      bajo: bajo.length,
      medio: medio.length,
      alto: alto.length,
      pctAlto: pct(alto.length),
      pctMedio: pct(medio.length),
      pctBajo: pct(bajo.length),
      pctSinUso: pct(sinUso.length),
      costoSinUso: sinUso.length * LICENSE_PRICE,
      costoBajo: bajo.length * LICENSE_PRICE,
      totalCandidatos: sinUso.length + bajo.length,
      totalCostoCandidatos: (sinUso.length + bajo.length) * LICENSE_PRICE,
    };
  }, [users]);

  if (loading) return <Wrap ref={ref}><Title>Optimización de licencias</Title><Empty>Cargando...</Empty></Wrap>;
  if (stats.total === 0) return <Wrap ref={ref}><Title>Optimización de licencias</Title><Empty>Sin datos</Empty></Wrap>;

  return (
    <Wrap ref={ref}>
      <Title>Optimización de licencias</Title>

      <BarWrap>
        <BarTrack>
          <Segment $pct={stats.pctAlto}   $color="#22C55E" title={`Alto (≥70%): ${stats.alto} usuarios`} />
          <Segment $pct={stats.pctMedio}  $color="#F59E0B" title={`Medio (30-69%): ${stats.medio} usuarios`} />
          <Segment $pct={stats.pctBajo}   $color="#FB923C" title={`Bajo (<30%): ${stats.bajo} usuarios`} />
          <Segment $pct={stats.pctSinUso} $color="#EF4444" title={`Sin uso (0%): ${stats.sinUso} usuarios`} />
        </BarTrack>
        <BarLegend>
          <LegendItem><Dot $color="#22C55E" />Alto ≥70% ({stats.alto})</LegendItem>
          <LegendItem><Dot $color="#F59E0B" />Medio 30-69% ({stats.medio})</LegendItem>
          <LegendItem><Dot $color="#FB923C" />Bajo &lt;30% ({stats.bajo})</LegendItem>
          <LegendItem><Dot $color="#EF4444" />Sin uso 0% ({stats.sinUso})</LegendItem>
        </BarLegend>
      </BarWrap>

      <TiersGrid>
        <TierCard $border="#EF4444">
          <TierLabel>🔴 Prioritarios</TierLabel>
          <TierCount>{stats.sinUso}</TierCount>
          <TierSub>sin ningún request<br />${stats.costoSinUso}/mes · reasignar</TierSub>
        </TierCard>
        <TierCard $border="#FB923C">
          <TierLabel>🟠 En seguimiento</TierLabel>
          <TierCount>{stats.bajo}</TierCount>
          <TierSub>uso menor al 30%<br />${stats.costoBajo}/mes · contactar</TierSub>
        </TierCard>
      </TiersGrid>

      <TotalRow>
        <TotalLabel>Total candidatos a reasignación</TotalLabel>
        <TotalValue>{stats.totalCandidatos} licencias · ${stats.totalCostoCandidatos}/mes</TotalValue>
      </TotalRow>
    </Wrap>
  );
});

LicenseOptimizationPanel.displayName = 'LicenseOptimizationPanel';
export default LicenseOptimizationPanel;
