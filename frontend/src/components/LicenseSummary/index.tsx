import React, { useMemo } from 'react';
import styled from 'styled-components';
import { useData } from '../../context/DataContext';

const Wrap = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.1rem 1.25rem 0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.07);
  border: 1px solid #F3F4F6;
  display: flex;
  flex-direction: column;
`;

const Title = styled.h3`
  font-size: 0.82rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.875rem;
`;

const TypeRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #F3F4F6;
`;

const TypeLabel = styled.span`
  font-size: 0.78rem;
  color: #374151;
  font-weight: 500;
`;

const BusinessBadge = styled.span`
  background: #EFF6FF;
  color: #2563EB;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid #BFDBFE;
`;

const StatRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.55rem 0;
  border-bottom: 1px solid #F9FAFB;
  &:last-of-type { border-bottom: none; }
`;

const StatLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.78rem;
  color: #374151;
`;

const Dot = styled.div<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const StatValue = styled.div<{ $color: string }>`
  font-size: 1.1rem;
  font-weight: 700;
  color: ${({ $color }) => $color};
  font-variant-numeric: tabular-nums;
`;

const StatSub = styled.div`
  font-size: 0.65rem;
  color: #9CA3AF;
  text-align: right;
`;

const ValueGroup = styled.div`
  text-align: right;
`;

const Footer = styled.button`
  background: none;
  border: none;
  border-top: 1px solid #F3F4F6;
  width: 100%;
  padding: 0.65rem 0.5rem;
  text-align: left;
  font-size: 0.78rem;
  font-weight: 600;
  color: #1B3A5C;
  cursor: pointer;
  margin-top: auto;
  &:hover { color: #2563EB; }
`;

interface Props {
  onNavigate?: (tab: string) => void;
}

const LICENSE_PRICE_USD = 19;

const LicenseSummary = React.forwardRef<HTMLDivElement, Props>(({ onNavigate }, ref) => {
  const { summary, users, loading } = useData();

  const asignadas  = (users ?? []).length;
  const activas    = summary?.activeUsers ?? 0;
  const reasignar  = useMemo(() =>
    (users ?? []).filter(u => (u.porcentajeUso ?? 0) < 30).length,
    [users],
  );

  return (
    <Wrap ref={ref}>
      <Title>Resumen de licencias</Title>

      <TypeRow>
        <TypeLabel>Tipo de licencia</TypeLabel>
        <BusinessBadge>Business ✓</BusinessBadge>
      </TypeRow>

      {loading ? (
        <div style={{ padding: '2rem 0', textAlign: 'center', color: '#9CA3AF', fontSize: '0.8rem' }}>Cargando...</div>
      ) : (
        <>
          <StatRow>
            <StatLabel><Dot $color="#6B7280" />Licencias asignadas</StatLabel>
            <ValueGroup>
              <StatValue $color="#111827">{asignadas}</StatValue>
              <StatSub>total</StatSub>
            </ValueGroup>
          </StatRow>
          <StatRow>
            <StatLabel><Dot $color="#16A34A" />Licencias activas</StatLabel>
            <ValueGroup>
              <StatValue $color="#16A34A">{activas}</StatValue>
              <StatSub>en uso</StatSub>
            </ValueGroup>
          </StatRow>
          <StatRow>
            <StatLabel><Dot $color="#EA580C" />Sugeridas para reasignar</StatLabel>
            <ValueGroup>
              <StatValue $color="#EA580C">{reasignar}</StatValue>
              <StatSub>uso &lt; 30%</StatSub>
            </ValueGroup>
          </StatRow>
          <StatRow>
            <StatLabel><Dot $color="#0077C8" />Costo mensual estimado</StatLabel>
            <ValueGroup>
              <StatValue $color="#0077C8">${(asignadas * LICENSE_PRICE_USD).toLocaleString('en-US')}</StatValue>
              <StatSub>{asignadas} × ${LICENSE_PRICE_USD} USD</StatSub>
            </ValueGroup>
          </StatRow>
        </>
      )}

      {onNavigate && (
        <Footer onClick={() => onNavigate('licenses')}>
          Administrar licencias &rarr;
        </Footer>
      )}
    </Wrap>
  );
});

LicenseSummary.displayName = 'LicenseSummary';
export default LicenseSummary;
