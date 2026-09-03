import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import api from '../../services/api';
import UserDrawer from '../UserDrawer';
import { useData } from '../../context/DataContext';
import type { UserLicenseYear } from '../../types';

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// ── Styled components ─────────────────────────────────────────────────────────

const ControlsBar = styled.div`
  display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;
  margin-bottom: 1.5rem;
  background: ${({ theme }) => theme.colors?.surface};
  padding: 0.875rem 1.25rem;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors?.border};
`;
const Label = styled.label`
  font-size: 0.8rem; font-weight: 600;
  color: ${({ theme }) => theme.colors?.textSecondary}; white-space: nowrap;
`;
const Select = styled.select`
  padding: 0.3rem 0.65rem;
  border: 1px solid ${({ theme }) => theme.colors?.border};
  border-radius: 6px; font-size: 0.8rem; background: white; cursor: pointer;
`;
const TeamChips = styled.div`display: flex; gap: 0.4rem; flex-wrap: wrap; flex: 1;`;
const TeamChip = styled.button<{ $active?: boolean }>`
  padding: 0.22rem 0.75rem; border-radius: 20px; font-size: 0.75rem;
  font-weight: ${({ $active }) => ($active ? 700 : 500)}; cursor: pointer;
  border: 1px solid ${({ $active, theme }) => $active ? theme.colors?.primary : theme.colors?.border};
  background: ${({ $active, theme }) => $active ? theme.colors?.primary : 'white'};
  color: ${({ $active }) => ($active ? 'white' : '#374151')}; transition: all 0.15s;
  &:hover { border-color: ${({ theme }) => theme.colors?.primary}; }
`;
const TeamSection = styled.div`
  margin-bottom: 1.5rem;
  background: ${({ theme }) => theme.colors?.surface};
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors?.border};
  overflow: hidden;
`;
const TeamHeader = styled.div`
  display: flex; align-items: center; gap: 0.65rem;
  padding: 0.7rem 1.25rem;
  background: linear-gradient(135deg, #1B3A5C 0%, #0f2540 100%);
  color: white;
`;
const TeamName = styled.h3`margin: 0; font-size: 0.95rem; font-weight: 700; color: #fff;`;
const TeamStat = styled.span`
  font-size: 0.72rem; opacity: 0.9; color: #fff;
  background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 10px;
`;
const TableWrapper = styled.div`overflow-x: auto;`;
const Table = styled.table`width: 100%; border-collapse: collapse; font-size: 0.78rem;`;
const Th = styled.th`
  padding: 0.45rem 0.3rem; text-align: center; font-weight: 600; font-size: 0.68rem;
  color: ${({ theme }) => theme.colors?.textSecondary};
  background: ${({ theme }) => theme.colors?.background};
  border-bottom: 1px solid ${({ theme }) => theme.colors?.border};
  white-space: nowrap;
  &:first-child { text-align: left; padding-left: 1.25rem; min-width: 170px; }
`;
const Tr = styled.tr<{ $summary?: boolean; $clickable?: boolean }>`
  &:not(:last-child) { border-bottom: 1px solid ${({ theme }) => theme.colors?.border}; }
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  transition: background 0.1s;
  &:hover { background: ${({ $summary, $clickable, theme }) => (!$summary && $clickable) ? (theme.colors?.background ?? '#F9FAFB') : 'transparent'}; }
`;
const Td = styled.td`
  padding: 0.35rem 0.3rem; text-align: center; vertical-align: middle;
  &:first-child { text-align: left; padding-left: 1.25rem; }
  &:last-child { font-weight: 700; color: ${({ theme }) => theme.colors?.primary}; font-size: 0.8rem; }
`;
const UserName = styled.span`
  font-family: monospace; font-size: 0.72rem;
  color: ${({ theme }) => theme.colors?.textPrimary};
  text-decoration: underline dotted;
  text-underline-offset: 2px;
  &:hover { color: ${({ theme }) => theme.colors?.primary}; }
`;
const LicenseDot = styled.div<{ $has?: boolean }>`
  width: 22px; height: 22px; border-radius: 5px; margin: 0 auto;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.65rem; font-weight: 700;
  background: ${({ $has }) => ($has ? '#1B3A5C' : '#f3f4f6')};
  color: ${({ $has }) => ($has ? 'white' : '#d1d5db')};
`;
const SummaryTd = styled.td<{ $count?: number; $total?: number }>`
  padding: 0.4rem 0.3rem; text-align: center;
  background: ${({ theme }) => theme.colors?.background};
  font-size: 0.72rem; font-weight: 700;
  color: ${({ $count, $total }) => $count === 0 ? '#d1d5db' : $count === $total ? '#1B3A5C' : '#374151'};
  border-top: 2px solid ${({ theme }) => theme.colors?.border};
  &:first-child { text-align: left; padding-left: 1.25rem; color: ${({ theme }) => theme.colors?.textSecondary}; font-weight: 600; font-size: 0.68rem; }
`;
const Empty = styled.p`
  text-align: center; padding: 3rem;
  color: ${({ theme }) => theme.colors?.textSecondary}; font-size: 0.875rem;
`;
const DownloadBtn = styled.button`
  margin-left: auto;
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.3rem 0.85rem;
  border-radius: 6px; font-size: 0.78rem; font-weight: 600;
  border: 1px solid ${({ theme }) => theme.colors?.primary};
  background: white; color: ${({ theme }) => theme.colors?.primary};
  cursor: pointer; white-space: nowrap; transition: all 0.15s;
  &:hover { background: ${({ theme }) => theme.colors?.primary}; color: white; }
`;

// ── Component ─────────────────────────────────────────────────────────────────

export default function TeamView() {
  const { filters } = useData();
  // Sync with global period — default to current year if not set
  const globalYear = filters?.selectedPeriod?.year ?? new Date().getFullYear();
  const [year, setYear]         = useState(globalYear);
  const [years, setYears]       = useState<number[]>([globalYear]);
  const [data, setData]         = useState<UserLicenseYear[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [drawerUser, setDrawerUser]     = useState<{ username: string; team: string } | null>(null);

  // Keep year in sync when global period changes
  useEffect(() => {
    if (filters?.selectedPeriod?.year) setYear(filters.selectedPeriod.year);
  }, [filters?.selectedPeriod?.year]);

  useEffect(() => {
    api.getLicenseYears().then((ys: number[]) => { if (ys?.length) setYears(ys); }).catch(() => {});
  }, []); 

  useEffect(() => {
    setLoading(true);
    api.getLicenseYearView(year)
      .then((d: unknown) => { setData(d as UserLicenseYear[]); setSelectedTeam('all'); })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [year]);

  const teams = useMemo(() => {
    const groups: Record<string, UserLicenseYear[]> = {};
    data.forEach(u => {
      const t = u.equipo || 'Sin equipo';
      if (!groups[t]) groups[t] = [];
      groups[t].push(u);
    });
    return groups;
  }, [data]);

  const teamNames = useMemo(() => Object.keys(teams).sort(), [teams]);
  const visibleTeams = selectedTeam === 'all' ? teamNames : [selectedTeam].filter(t => teams[t]);

  const downloadCSV = () => {
    const rows: string[][] = [];
    const header = ['Equipo', 'Usuario', ...MONTHS, 'Total meses'];
    rows.push(header);

    visibleTeams.forEach(teamName => {
      const members = [...teams[teamName]].sort((a, b) => a.usuario.localeCompare(b.usuario));
      members.forEach(user => {
        const monthCols = MONTHS.map((_, i) => (user.licenses?.[i + 1] === true ? '1' : '0'));
        const total = monthCols.filter(v => v === '1').length;
        rows.push([teamName, user.usuario, ...monthCols, String(total)]);
      });
      // summary row per team
      const counts = MONTHS.map((_, i) => String(members.filter(u => u.licenses?.[i + 1] === true).length));
      rows.push([teamName, 'TOTAL ACTIVOS', ...counts, '']);
      rows.push([]);
    });

    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const teamLabel = selectedTeam === 'all' ? 'todos' : selectedTeam.replace(/\s+/g, '_');
    a.href = url;
    a.download = `licencias_${year}_${teamLabel}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <Empty>Cargando datos de equipos...</Empty>;
  if (!data.length) return <Empty>No hay datos de licencias para {year}. Sube los CSVs de equipos primero.</Empty>;

  return (
    <>
      <ControlsBar>
        <Label>Año:</Label>
        <Select value={year} onChange={e => setYear(Number(e.target.value))}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </Select>
        <TeamChips>
          <TeamChip $active={selectedTeam === 'all'} onClick={() => setSelectedTeam('all')}>
            Todos ({data.length})
          </TeamChip>
          {teamNames.map(t => (
            <TeamChip key={t} $active={selectedTeam === t} onClick={() => setSelectedTeam(t)}>
              {t} ({teams[t].length})
            </TeamChip>
          ))}
        </TeamChips>
        <DownloadBtn onClick={downloadCSV} title="Descargar vista como CSV">
          ⬇ Descargar CSV
        </DownloadBtn>
      </ControlsBar>

      {visibleTeams.map(teamName => {
        const members = [...teams[teamName]].sort((a, b) => a.usuario.localeCompare(b.usuario));
        const monthlyCounts = MONTHS.map((_, i) => members.filter(u => u.licenses?.[i + 1] === true).length);
        const totalActive = members.filter(u => MONTHS.some((_, i) => u.licenses?.[i + 1] === true)).length;
        const totalMonths = members.reduce((s, u) => s + MONTHS.filter((_, i) => u.licenses?.[i + 1] === true).length, 0);

        return (
          <TeamSection key={teamName}>
            <TeamHeader>
              <TeamName>🏢 {teamName}</TeamName>
              <TeamStat>{members.length} integrantes</TeamStat>
              <TeamStat>{totalActive} activos en {year}</TeamStat>
              <TeamStat>{totalMonths} licencias·mes</TeamStat>
            </TeamHeader>
            <TableWrapper>
              <Table>
                <thead>
                  <tr>
                    <Th title="Clic para ver detalle del usuario">Usuario</Th>
                    {MONTHS.map(m => <Th key={m} title={`Licencia en ${m}`}>{m}</Th>)}
                    <Th title="Total de meses con licencia asignada en el año">Meses con licencia</Th>
                  </tr>
                </thead>
                <tbody>
                  {members.map(user => {
                    const count = MONTHS.filter((_, i) => user.licenses?.[i + 1] === true).length;
                    return (
                      <Tr key={user.usuario} $clickable onClick={() => setDrawerUser({ username: user.usuario, team: teamName })}>
                        <Td><UserName>{user.usuario}</UserName></Td>
                        {MONTHS.map((_, i) => (
                          <Td key={i}><LicenseDot $has={user.licenses?.[i + 1] === true}>{user.licenses?.[i + 1] ? '✓' : ''}</LicenseDot></Td>
                        ))}
                        <Td>{count}</Td>
                      </Tr>
                    );
                  })}
                  <Tr $summary>
                    <SummaryTd>Total activos</SummaryTd>
                    {monthlyCounts.map((count, i) => <SummaryTd key={i} $count={count} $total={members.length}>{count}</SummaryTd>)}
                    <SummaryTd />
                  </Tr>
                </tbody>
              </Table>
            </TableWrapper>
          </TeamSection>
        );
      })}

      {drawerUser && (
        <UserDrawer
          username={drawerUser.username}
          team={drawerUser.team}
          onClose={() => setDrawerUser(null)}
        />
      )}
    </>
  );
}

