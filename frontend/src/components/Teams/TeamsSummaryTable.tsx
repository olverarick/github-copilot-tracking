import React, { useMemo } from 'react';
import styled from 'styled-components';
import { useData } from '../../context/DataContext';
import { Card } from '../../styles/components';

interface Props {
  onTeamClick?: (teamName: string) => void;
}

// ─── Team colors ──────────────────────────────────────────────────────────────
const TEAM_COLORS = ['#1B3A5C', '#00897B', '#1976D2', '#7B3FA0', '#E65100', '#2E7D32'];

const LICENSE_PRICE_USD = 19;

// ─── Styled components ────────────────────────────────────────────────────────

const Container = styled(Card)`
  padding: 0;
  overflow: hidden;
  margin-bottom: 1.25rem;
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.9rem 1.25rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors?.border};
  background: ${({ theme }) => theme.colors?.surface};
`;

const Title = styled.h3`
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors?.textSecondary};
  margin: 0;
`;

const Hint = styled.span`
  font-size: 0.7rem;
  color: ${({ theme }) => theme.colors?.textSecondary};
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
`;

const Th = styled.th`
  padding: 0.5rem 1rem;
  text-align: left;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${({ theme }) => theme.colors?.textSecondary};
  background: ${({ theme }) => theme.colors?.background};
  border-bottom: 1px solid ${({ theme }) => theme.colors?.border};
  white-space: nowrap;
  &:not(:first-child) { text-align: right; }
`;

const ThSub = styled.div`
  font-size: 0.6rem;
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
  color: ${({ theme }) => theme.colors?.textSecondary};
  opacity: 0.7;
  margin-top: 1px;
`;

const Tr = styled.tr<{ $clickable?: boolean }>`
  border-bottom: 1px solid ${({ theme }) => theme.colors?.divider ?? theme.colors?.border};
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  transition: background 0.12s;
  &:last-child { border-bottom: none; }
  &:hover { background: ${({ $clickable, theme }) => ($clickable ? (theme.colors?.surfaceHover ?? '#F9FAFB') : 'transparent')}; }
`;

const Td = styled.td`
  padding: 0.65rem 1rem;
  vertical-align: middle;
  white-space: nowrap;
  &:not(:first-child) { text-align: right; }
`;

const TeamCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.65rem;
`;

const TeamDot = styled.div<{ $color: string }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const TeamLabel = styled.div``;

const TeamName = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.colors?.textPrimary};
  font-size: 0.83rem;
`;

const DrillHint = styled.div`
  font-size: 0.68rem;
  color: ${({ theme }) => theme.colors?.textSecondary};
  opacity: 0.75;
  margin-top: 1px;
`;

const NumVal = styled.span`
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: ${({ theme }) => theme.colors?.textPrimary};
`;

const SubVal = styled.span`
  font-size: 0.7rem;
  color: ${({ theme }) => theme.colors?.textSecondary};
  display: block;
  text-align: right;
  font-variant-numeric: tabular-nums;
`;

// Visual bar for requests share
const BarWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: flex-end;
`;

const BarTrack = styled.div`
  width: 90px;
  height: 6px;
  background: #E5E7EB;
  border-radius: 3px;
  overflow: hidden;
`;

const BarFill = styled.div<{ $pct: number; $color: string }>`
  height: 100%;
  width: ${({ $pct }) => Math.min($pct, 100)}%;
  background: ${({ $color }) => $color};
  border-radius: 3px;
  transition: width 0.45s ease;
`;

const PctLabel = styled.span`
  font-size: 0.72rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors?.textPrimary};
  width: 36px;
  text-align: right;
  font-variant-numeric: tabular-nums;
`;

const EmptyState = styled.div`
  padding: 2.5rem;
  text-align: center;
  color: ${({ theme }) => theme.colors?.textSecondary};
  font-size: 0.875rem;
`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function TeamsSummaryTable({ onTeamClick }: Props) {
  const { teams, users, loading } = useData();

  const sorted = useMemo(
    () => [...(teams ?? [])].sort((a, b) => b.totalRequests - a.totalRequests),
    [teams],
  );

  const totalReq = useMemo(
    () => sorted.reduce((s, t) => s + t.totalRequests, 0),
    [sorted],
  );

  // Total de usuarios registrados por equipo (de los datos de uso)
  const totalByTeam = useMemo(() => {
    const map: Record<string, number> = {};
    (users ?? []).forEach(u => {
      const t = u.equipo || '';
      map[t] = (map[t] ?? 0) + 1;
    });
    return map;
  }, [users]);

  if (loading) return (
    <Container>
      <Toolbar><Title>Resumen por equipo</Title></Toolbar>
      <EmptyState>Cargando equipos...</EmptyState>
    </Container>
  );

  if (!sorted.length) return (
    <Container>
      <Toolbar><Title>Resumen por equipo</Title></Toolbar>
      <EmptyState>No hay datos de equipos para este período. Sube los CSVs de equipos primero.</EmptyState>
    </Container>
  );

  return (
    <Container>
      <Toolbar>
        <Title>Resumen por equipo</Title>
        {onTeamClick && <Hint>Haz clic en un equipo para ver sus usuarios →</Hint>}
      </Toolbar>
      <Table>
        <thead>
          <tr>
            <Th>Equipo</Th>
            <Th>Requests<ThSub>total del período</ThSub></Th>
            <Th>Integrantes<ThSub>usuarios registrados</ThSub></Th>
            <Th>Con actividad<ThSub>usaron Copilot</ThSub></Th>
            <Th>Prom. / activo<ThSub>requests por usuario</ThSub></Th>
            <Th>Costo mensual<ThSub>licencias × $19 USD</ThSub></Th>
            <Th>Participación<ThSub>% del total de requests</ThSub></Th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((team, idx) => {
            const color = TEAM_COLORS[idx % TEAM_COLORS.length];
            const pct = totalReq > 0 ? (team.totalRequests / totalReq) * 100 : 0;
            const totalUsers = totalByTeam[team.team] ?? team.userCount;
            const avgPerUser = team.userCount > 0
              ? (team.totalRequests / team.userCount).toFixed(1)
              : '—';

            return (
              <Tr
                key={team.team}
                $clickable={!!onTeamClick}
                onClick={() => onTeamClick?.(team.team)}
              >
                <Td>
                  <TeamCell>
                    <TeamDot $color={color} />
                    <TeamLabel>
                      <TeamName>{team.team || '—'}</TeamName>
                      {onTeamClick && <DrillHint>→ ver usuarios</DrillHint>}
                    </TeamLabel>
                  </TeamCell>
                </Td>
                <Td><NumVal>{team.totalRequests.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</NumVal></Td>
                <Td><NumVal>{totalUsers}</NumVal></Td>
                <Td><NumVal>{team.userCount}</NumVal></Td>
                <Td><NumVal>{avgPerUser}</NumVal></Td>
                <Td>
                  <NumVal>${(totalUsers * LICENSE_PRICE_USD).toLocaleString('en-US', { minimumFractionDigits: 0 })}</NumVal>
                  <SubVal>{totalUsers} × ${LICENSE_PRICE_USD}/mes</SubVal>
                </Td>
                <Td>
                  <BarWrap>
                    <BarTrack>
                      <BarFill $pct={pct} $color={color} />
                    </BarTrack>
                    <PctLabel>{(pct ?? 0).toFixed(1)}%</PctLabel>
                  </BarWrap>
                </Td>
              </Tr>
            );
          })}
        </tbody>
      </Table>
    </Container>
  );
}
