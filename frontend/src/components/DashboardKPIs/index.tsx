import React, { useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import { useData } from '../../context/DataContext';

const shimmer = keyframes`
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.25rem;
  @media (max-width: 1100px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 600px)  { grid-template-columns: 1fr; }
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.1rem 1.25rem;
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.07);
  border: 1px solid #F3F4F6;
`;

const IconBox = styled.div<{ $bg: string }>`
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: ${({ $bg }) => $bg};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
`;

const Label = styled.div`
  font-size: 0.69rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6B7280;
`;

const Value = styled.div`
  font-size: 1.65rem;
  font-weight: 700;
  color: #111827;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
`;

const Trend = styled.div<{ $positive: boolean; $neutral?: boolean }>`
  font-size: 0.71rem;
  font-weight: 500;
  color: ${({ $positive, $neutral }) =>
    $neutral ? '#6B7280' : $positive ? '#16A34A' : '#DC2626'};
  margin-top: 2px;
`;

const SkeletonLine = styled.div<{ $w?: string; $h?: string }>`
  height: ${({ $h }) => $h ?? '1rem'};
  width: ${({ $w }) => $w ?? '100%'};
  border-radius: 4px;
  background: linear-gradient(90deg, #ececec 25%, #f5f5f5 50%, #ececec 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.4s infinite;
`;

const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function prevMonthLabel(period: { year: number; month: number } | null): string {
  if (!period) return '';
  const pm = period.month === 1 ? 12 : period.month - 1;
  const py = period.month === 1 ? period.year - 1 : period.year;
  return `${MONTHS_ES[pm - 1]} ${py}`;
}

function pctChange(curr: number, prev: number): number {
  if (prev === 0) return 0;
  return ((curr - prev) / prev) * 100;
}

const DashboardKPIs = React.forwardRef<HTMLDivElement>((_, ref) => {
  const { summary, previousSummary, users, previousUsers, loading, filters } = useData();

  const safeUsers    = users ?? [];
  const safePrevUsers = previousUsers ?? [];

  const avgUsage = useMemo(() => {
    if (!safeUsers.length) return 0;
    return safeUsers.reduce((s, u) => s + (u.porcentajeUso ?? 0), 0) / safeUsers.length;
  }, [safeUsers]);

  const prevAvgUsage = useMemo(() => {
    if (!safePrevUsers.length) return null;
    return safePrevUsers.reduce((s, u) => s + (u.porcentajeUso ?? 0), 0) / safePrevUsers.length;
  }, [safePrevUsers]);

  const LICENSE_PRICE_USD = 19;

  const infrautilized = useMemo(() => safeUsers.filter(u => (u.porcentajeUso ?? 0) < 30).length, [safeUsers]);
  const prevInfra     = useMemo(() => safePrevUsers.filter(u => (u.porcentajeUso ?? 0) < 30).length, [safePrevUsers]);

  const hasPrev   = !!previousSummary;
  const prevLabel = prevMonthLabel(filters?.selectedPeriod ?? null);

  if (loading) {
    return (
      <Grid ref={ref}>
        {[0,1,2,3].map(i => (
          <Card key={i}>
            <SkeletonLine $w="42px" $h="42px" style={{ borderRadius: 10, flexShrink: 0 }} />
            <Body>
              <SkeletonLine $w="80px" $h="0.65rem" />
              <SkeletonLine $w="120px" $h="1.6rem" style={{ marginTop: 4 }} />
              <SkeletonLine $w="100px" $h="0.65rem" style={{ marginTop: 4 }} />
            </Body>
          </Card>
        ))}
      </Grid>
    );
  }

  if (!summary) return null;

  const reqDelta   = hasPrev && previousSummary ? pctChange(summary.totalRequests, previousSummary.totalRequests) : 0;
  const usrDelta   = hasPrev && previousSummary ? pctChange(summary.activeUsers, previousSummary.activeUsers) : 0;
  const usageDelta = (hasPrev && prevAvgUsage != null) ? (avgUsage - prevAvgUsage) : 0;
  const infraDelta = (hasPrev && prevInfra > 0) ? pctChange(infrautilized, prevInfra) : 0;

  return (
    <Grid ref={ref}>
      {/* Total Requests */}
      <Card>
        <IconBox $bg="#EBF5FF">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="2,14 7,9 11,12 18,5" />
            <polyline points="14,5 18,5 18,9" />
          </svg>
        </IconBox>
        <Body>
          <Label>Total Requests</Label>
          <Value>{summary.totalRequests.toLocaleString('es-MX')}</Value>
          <Trend $positive={reqDelta >= 0} $neutral={!hasPrev}>
            {hasPrev
              ? `${reqDelta >= 0 ? '↑' : '↓'} ${Math.abs(reqDelta).toFixed(1)}% vs ${prevLabel}`
              : 'solicitudes procesadas'}
          </Trend>
        </Body>
      </Card>

      {/* Usuarios Activos */}
      <Card>
        <IconBox $bg="#F0FDF4">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="6" r="3"/>
            <path d="M2 18c0-4 2.7-6 6-6s6 2 6 6"/>
            <circle cx="15" cy="6" r="2.5"/>
            <path d="M17 18c0-3-1.3-4.8-2-5.5"/>
          </svg>
        </IconBox>
        <Body>
          <Label>Usuarios Activos</Label>
          <Value>{summary.activeUsers}</Value>
          <Trend $positive={usrDelta >= 0} $neutral={!hasPrev}>
            {hasPrev
              ? `${usrDelta >= 0 ? '↑' : '↓'} ${Math.abs(usrDelta).toFixed(1)}% vs ${prevLabel}`
              : `${summary.totalUsers} usuarios registrados`}
          </Trend>
        </Body>
      </Card>

      {/* % Uso vs Capacidad */}
      <Card>
        <IconBox $bg="#FFF7ED">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#EA580C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="12" width="3" height="6" rx="1"/>
            <rect x="8.5" y="7" width="3" height="11" rx="1"/>
            <rect x="15" y="3" width="3" height="15" rx="1"/>
          </svg>
        </IconBox>
        <Body>
          <Label>% Uso vs Capacidad</Label>
          <Value>{avgUsage.toFixed(1)}%</Value>
          <Trend $positive={usageDelta >= 0} $neutral={!hasPrev}>
            {hasPrev
              ? `${usageDelta >= 0 ? '↑' : '↓'} ${Math.abs(usageDelta).toFixed(1)}% vs ${prevLabel}`
              : `${summary.activeUsers} usuarios activos`}
          </Trend>
        </Body>
      </Card>

      {/* Licencias Infrautilizadas */}
      <Card>
        <IconBox $bg="#FEF2F2">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="10" cy="10" r="8"/>
            <line x1="10" y1="6" x2="10" y2="11"/>
            <circle cx="10" cy="14" r="0.6" fill="#DC2626"/>
          </svg>
        </IconBox>
        <Body>
          <Label>Licencias Infrautilizadas</Label>
          <Value>{infrautilized}</Value>
          <Trend $positive={infraDelta <= 0} $neutral={!hasPrev}>
            {hasPrev
              ? `${infraDelta <= 0 ? '↓' : '↑'} ${Math.abs(infraDelta).toFixed(1)}% vs ${prevLabel}`
              : `~$${infrautilized * LICENSE_PRICE_USD} USD/mes desperdiciados`}
          </Trend>
        </Body>
      </Card>
    </Grid>
  );
});

DashboardKPIs.displayName = 'DashboardKPIs';
export default DashboardKPIs;
