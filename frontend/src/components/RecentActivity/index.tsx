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
  margin: 0 0 0.75rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
`;

const Th = styled.th`
  text-align: left;
  color: #6B7280;
  font-weight: 600;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0 0.5rem 0.5rem;
  border-bottom: 1px solid #F3F4F6;
`;

const Td = styled.td`
  padding: 0.55rem 0.5rem;
  color: #374151;
  border-bottom: 1px solid #F9FAFB;
  vertical-align: middle;
`;

const Avatar = styled.div<{ $color: string }>`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const UsernameCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  max-width: 150px;
`;

const UserText = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.78rem;
  color: #111827;
`;

const UsageBadge = styled.span<{ $color: string; $bg: string }>`
  background: ${({ $bg }) => $bg};
  color: ${({ $color }) => $color};
  font-size: 0.68rem;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 999px;
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

const COLORS = ['#1B3A5C','#2563EB','#7C3AED','#DB2777','#EA580C','#16A34A','#0891B2'];
const initials = (name: string) => name.slice(0, 2).toUpperCase();
const colorOf   = (name: string) => COLORS[name.charCodeAt(0) % COLORS.length];

function usageBadge(pct: number) {
  if (pct >= 70) return { bg: '#F0FDF4', color: '#16A34A' };
  if (pct >= 30) return { bg: '#FFF7ED', color: '#EA580C' };
  return { bg: '#FEF2F2', color: '#DC2626' };
}

interface Props {
  onViewAll?: () => void;
}

const RecentActivity = React.forwardRef<HTMLDivElement, Props>(({ onViewAll }, ref) => {
  const { users, loading, currentQuota, currentQuotaLabel } = useData();

  const top5 = useMemo(() =>
    [...(users ?? [])]
      .sort((a, b) => (b.totalRequests ?? 0) - (a.totalRequests ?? 0))
      .slice(0, 5),
    [users],
  );

  return (
    <Wrap ref={ref}>
      <Title>Actividad reciente de usuarios</Title>

      {loading ? (
        <div style={{ padding: '2rem 0', textAlign: 'center', color: '#9CA3AF', fontSize: '0.8rem' }}>Cargando...</div>
      ) : top5.length === 0 ? (
        <div style={{ padding: '2rem 0', textAlign: 'center', color: '#9CA3AF', fontSize: '0.8rem' }}>Sin datos de usuarios</div>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Usuario</Th>
              <Th>Equipo</Th>
              <Th style={{ textAlign: 'right' }} title="Total de requests en el período">Requests</Th>
              <Th style={{ textAlign: 'right' }} title="Días con al menos un request registrado">Días activos</Th>
              <Th style={{ textAlign: 'center' }} title={currentQuota ? `Porcentaje de la cuota mensual (${currentQuota} ${currentQuotaLabel ?? 'requests'})` : 'Porcentaje de la cuota mensual'}>% Uso</Th>
            </tr>
          </thead>
          <tbody>
            {top5.map(u => {
              const badge = usageBadge(u.porcentajeUso ?? 0);
              return (
                <tr key={u.username}>
                  <Td>
                    <UsernameCell>
                      <Avatar $color={colorOf(u.username)}>{initials(u.username)}</Avatar>
                      <UserText title={u.username}>{u.username}</UserText>
                    </UsernameCell>
                  </Td>
                  <Td style={{ color: '#6B7280', fontSize: '0.73rem' }}>{u.equipo || '—'}</Td>
                  <Td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {(u.totalRequests ?? 0).toLocaleString('es-MX')}
                  </Td>
                  <Td style={{ textAlign: 'right', color: '#6B7280' }}>{u.diasActivos ?? 0}</Td>
                  <Td style={{ textAlign: 'center' }}>
                    <UsageBadge $color={badge.color} $bg={badge.bg}>
                      {(u.porcentajeUso ?? 0).toFixed(0)}%
                    </UsageBadge>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}

      {onViewAll && (
        <Footer onClick={onViewAll}>
          Ver todos los usuarios &rarr;
        </Footer>
      )}
    </Wrap>
  );
});

RecentActivity.displayName = 'RecentActivity';
export default RecentActivity;
