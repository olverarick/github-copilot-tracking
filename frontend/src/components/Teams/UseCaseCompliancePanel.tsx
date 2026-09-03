import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import api from '../../services/api';
import { useData } from '../../context/DataContext';
import type { UserLicenseYear } from '../../types';

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// ── Styled components ──────────────────────────────────────────────────────────

const Container = styled.div`
  background: ${({ theme }) => theme.colors?.surface};
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors?.border};
  overflow: hidden;
  margin-bottom: 1.5rem;
`;

const Toolbar = styled.div`
  display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors?.border};
  background: ${({ theme }) => theme.colors?.surface};
`;

const Title = styled.h3`
  font-size: 0.82rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.05em; color: ${({ theme }) => theme.colors?.textSecondary}; margin: 0;
  white-space: nowrap;
`;

const ToolSpacer = styled.div`flex: 1;`;

const Label = styled.label`
  font-size: 0.8rem; font-weight: 600;
  color: ${({ theme }) => theme.colors?.textSecondary}; white-space: nowrap;
`;

const Select = styled.select`
  padding: 0.3rem 0.65rem;
  border: 1px solid ${({ theme }) => theme.colors?.border};
  border-radius: 6px; font-size: 0.8rem; background: white; cursor: pointer;
`;

const TeamChips = styled.div`display: flex; gap: 0.4rem; flex-wrap: wrap;`;

const TeamChip = styled.button<{ $active?: boolean }>`
  padding: 0.22rem 0.75rem; border-radius: 20px; font-size: 0.75rem;
  font-weight: ${({ $active }) => ($active ? 700 : 500)}; cursor: pointer;
  border: 1px solid ${({ $active, theme }) => $active ? theme.colors?.primary : theme.colors?.border};
  background: ${({ $active, theme }) => $active ? theme.colors?.primary : 'white'};
  color: ${({ $active }) => ($active ? 'white' : '#374151')}; transition: all 0.15s;
  &:hover { border-color: ${({ theme }) => theme.colors?.primary}; }
`;

const DownloadBtn = styled.button`
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.3rem 0.85rem;
  border-radius: 6px; font-size: 0.78rem; font-weight: 600;
  border: 1px solid ${({ theme }) => theme.colors?.primary};
  background: white; color: ${({ theme }) => theme.colors?.primary};
  cursor: pointer; white-space: nowrap; transition: all 0.15s;
  &:hover { background: ${({ theme }) => theme.colors?.primary}; color: white; }
`;

// ── Team section ───────────────────────────────────────────────────────────────

const TeamSection = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.colors?.border};
  &:last-child { border-bottom: none; }
`;

const TeamHeader = styled.div`
  display: flex; align-items: center; gap: 0.65rem;
  padding: 0.6rem 1.25rem;
  background: linear-gradient(135deg, #1B3A5C 0%, #0f2540 100%);
  color: white;
`;

const TeamName = styled.span`font-size: 0.9rem; font-weight: 700; color: white;`;

const TeamStats = styled.span`
  font-size: 0.72rem; opacity: 0.9; color: white;
  background: rgba(255,255,255,0.18); padding: 2px 10px; border-radius: 10px;
  white-space: nowrap;
`;

const ProgressTrack = styled.div`
  flex: 1; max-width: 180px; height: 6px; background: rgba(255,255,255,0.25);
  border-radius: 3px; overflow: hidden;
`;

const ProgressFill = styled.div<{ $pct: number; $ok: boolean }>`
  height: 100%; border-radius: 3px;
  width: ${({ $pct }) => Math.min($pct, 100)}%;
  background: ${({ $ok }) => $ok ? '#4ADE80' : '#FCD34D'};
  transition: width 0.45s ease;
`;

// ── Table ──────────────────────────────────────────────────────────────────────

const TableWrapper = styled.div`overflow-x: auto;`;

const Table = styled.table`width: 100%; border-collapse: collapse; font-size: 0.78rem;`;

const Th = styled.th`
  padding: 0.45rem 0.6rem; text-align: center; font-weight: 600; font-size: 0.68rem;
  color: ${({ theme }) => theme.colors?.textSecondary};
  background: ${({ theme }) => theme.colors?.background};
  border-bottom: 1px solid ${({ theme }) => theme.colors?.border};
  white-space: nowrap;
  &:first-child { text-align: left; padding-left: 1.25rem; min-width: 180px; }
`;

const Tr = styled.tr`
  &:not(:last-child) { border-bottom: 1px solid ${({ theme }) => theme.colors?.border}; }
`;

const SummaryTr = styled.tr`
  background: ${({ theme }) => theme.colors?.background};
  border-top: 2px solid ${({ theme }) => theme.colors?.border};
`;

const Td = styled.td`
  padding: 0.4rem 0.6rem; text-align: center; vertical-align: middle;
  &:first-child { text-align: left; padding-left: 1.25rem; }
`;

const SummaryTd = styled.td<{ $pct?: number }>`
  padding: 0.4rem 0.6rem; text-align: center; font-size: 0.72rem; font-weight: 700;
  color: ${({ $pct }) =>
    $pct === undefined ? '#6B7280' :
    $pct >= 100 ? '#166534' :
    $pct >= 50  ? '#854D0E' : '#991B1B'};
  &:first-child { text-align: left; padding-left: 1.25rem; font-size: 0.68rem; font-weight: 600; color: #6B7280; }
`;

const UserName = styled.span`
  font-family: monospace; font-size: 0.72rem;
  color: ${({ theme }) => theme.colors?.textPrimary};
`;

const UCBadge = styled.span<{ $level: 0 | 1 | 2 }>`
  display: inline-block; min-width: 36px;
  font-size: 0.7rem; font-weight: 700; padding: 2px 7px; border-radius: 10px;
  background: ${({ $level }) => $level === 2 ? '#DCFCE7' : $level === 1 ? '#FEF9C3' : '#FEE2E2'};
  color:      ${({ $level }) => $level === 2 ? '#166534' : $level === 1 ? '#854D0E' : '#991B1B'};
  border: 1px solid ${({ $level }) => $level === 2 ? '#BBF7D0' : $level === 1 ? '#FDE68A' : '#FECACA'};
`;

const NoLicenseCell = styled.span`
  display: inline-block; min-width: 36px;
  font-size: 0.7rem; color: #D1D5DB; letter-spacing: 0.05em;
`;

const Empty = styled.p`
  text-align: center; padding: 3rem 2rem;
  color: ${({ theme }) => theme.colors?.textSecondary}; font-size: 0.875rem;
`;

// ── Component ──────────────────────────────────────────────────────────────────

type UCRow = { team: string; username: string; month: number; count: number };

export default function UseCaseCompliancePanel() {
  const { filters } = useData();
  const globalYear = filters?.selectedPeriod?.year ?? new Date().getFullYear();

  const [year, setYear]             = useState(globalYear);
  const [selectedTeam, setSelected] = useState('all');
  const [rows, setRows]             = useState<UCRow[]>([]);
  const [licenseData, setLicenseData] = useState<UserLicenseYear[]>([]);
  const [loading, setLoading]       = useState(true);

  // Sync year with global period
  useEffect(() => {
    if (filters?.selectedPeriod?.year) setYear(filters.selectedPeriod.year);
  }, [filters?.selectedPeriod?.year]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getUseCaseCountsByYear(year),
      api.getLicenseYearView(year),
    ])
      .then(([ucRows, licRows]) => {
        setRows(ucRows);
        setLicenseData(licRows as UserLicenseYear[]);
      })
      .catch(() => { setRows([]); setLicenseData([]); })
      .finally(() => setLoading(false));
  }, [year]);

  // License lookup: username → { month → true/false }
  const licenseLookup = useMemo(() => {
    const m = new Map<string, Record<number, boolean>>();
    licenseData.forEach(u => m.set(u.usuario, u.licenses ?? {}));
    return m;
  }, [licenseData]);

  const hasLicense = (username: string, month: number) =>
    licenseLookup.get(username)?.[month] === true;

  // Available years from use-case data + the current global year
  const years = useMemo(() => {
    const ys = new Set<number>(rows.map(r => r.month ? year : year));
    ys.add(globalYear);
    ys.add(new Date().getFullYear());
    return Array.from(ys).sort((a, b) => b - a);
  }, [rows, globalYear, year]);

  // Always scope to the globally selected month so stats match the period header.
  // Fallback to all months with data only when browsing a different year.
  const months = useMemo(() => {
    if (filters?.selectedPeriod?.year === year && filters?.selectedPeriod?.month) {
      return [filters.selectedPeriod.month];
    }
    const ms = new Set<number>(rows.map(r => r.month));
    return Array.from(ms).sort((a, b) => a - b);
  }, [rows, filters?.selectedPeriod, year]);

  // Members grouped by team — built from year-wide licenseData so the list
  // stays consistent regardless of which month is currently selected globally.
  // A user is included if they have a license in at least one of the visible months.
  const membersByTeam = useMemo(() => {
    const map: Record<string, string[]> = {};
    licenseData.forEach(u => {
      const relevant = months.length === 0 || months.some(m => u.licenses?.[m] === true);
      if (!relevant) return;
      const t = u.equipo || 'Sin equipo';
      if (!map[t]) map[t] = [];
      if (!map[t].includes(u.usuario)) map[t].push(u.usuario);
    });
    return map;
  }, [licenseData, months]);

  const teamNames = useMemo(() => Object.keys(membersByTeam).sort(), [membersByTeam]);

  // Build lookup: team+username+month → count
  // Backend dir names use underscores for spaces; normalize to match membersByTeam keys (spaces)
  const lookup = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach(r => m.set(`${r.team.replace(/_/g, ' ')}/${r.username}/${r.month}`, r.count));
    return m;
  }, [rows]);

  const visibleTeams = selectedTeam === 'all' ? teamNames : [selectedTeam].filter(t => membersByTeam[t]);

  // ── CSV export ──────────────────────────────────────────────────────────────
  const downloadCSV = () => {
    const header = ['Equipo', 'Usuario', ...months.map(m => MONTH_NAMES[m - 1]), 'Cumplimiento'];
    const csvRows: string[][] = [header];

    visibleTeams.forEach(teamName => {
      const members = (membersByTeam[teamName] ?? []).sort();
      members.forEach(u => {
        const cols = months.map(m => {
          if (!hasLicense(u, m)) return 'N/A';
          return String(lookup.get(`${teamName}/${u}/${m}`) ?? 0);
        });
        const applicable = months.filter(m => hasLicense(u, m)).length;
        const complete   = months.filter(m => hasLicense(u, m) && (lookup.get(`${teamName}/${u}/${m}`) ?? 0) >= 3).length;
        csvRows.push([teamName, u, ...cols, applicable > 0 ? `${complete}/${applicable}` : 'Sin licencia']);
      });
      csvRows.push([]);
    });

    const csv = csvRows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `casos_uso_${year}_${selectedTeam === 'all' ? 'todos' : selectedTeam}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const level = (n: number): 0 | 1 | 2 => n >= 3 ? 2 : n > 0 ? 1 : 0;

  if (!licenseData.length && !loading) return null;

  return (
    <Container>
      <Toolbar>
        <Title>Casos de uso documentados</Title>
        <Label>Año:</Label>
        <Select value={year} onChange={e => setYear(Number(e.target.value))}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </Select>
        <TeamChips>
          <TeamChip $active={selectedTeam === 'all'} onClick={() => setSelected('all')}>
            Todos
          </TeamChip>
          {teamNames.map(t => (
            <TeamChip key={t} $active={selectedTeam === t} onClick={() => setSelected(t)}>
              {t}
            </TeamChip>
          ))}
        </TeamChips>
        <ToolSpacer />
        <DownloadBtn onClick={downloadCSV}>⬇ Descargar CSV</DownloadBtn>
      </Toolbar>

      {loading ? (
        <Empty>Cargando datos de casos de uso...</Empty>
      ) : months.length === 0 ? (
        <Empty>No hay casos de uso registrados para {year}. Súbelos desde el perfil de cada usuario.</Empty>
      ) : (
        visibleTeams.map(teamName => {
          const members = (membersByTeam[teamName] ?? []).sort();
          if (!members.length) return null;

          // Compliance stats — only count months where user had a license
          const applicablePairs = members.flatMap(u =>
            months.filter(m => hasLicense(u, m)).map(m => ({ u, m }))
          );
          const complete = applicablePairs.filter(({ u, m }) =>
            (lookup.get(`${teamName}/${u}/${m}`) ?? 0) >= 3
          ).length;
          const total = applicablePairs.length;
          const pct = total > 0 ? Math.round((complete / total) * 100) : 0;

          // Footer: per-month — only licensed users count
          const monthTotals = months.map(m => ({
            complete: members.filter(u => hasLicense(u, m) && (lookup.get(`${teamName}/${u}/${m}`) ?? 0) >= 3).length,
            licensed: members.filter(u => hasLicense(u, m)).length,
          }));

          return (
            <TeamSection key={teamName}>
              <TeamHeader>
                <TeamName>🏢 {teamName}</TeamName>
                <ProgressTrack>
                  <ProgressFill $pct={pct} $ok={pct >= 80} />
                </ProgressTrack>
                <TeamStats>{complete}/{total} completos · {pct}%</TeamStats>
                <TeamStats style={{ background: 'rgba(255,255,255,0.12)' }}>
                  {members.length} integrantes
                </TeamStats>
              </TeamHeader>

              <TableWrapper>
                <Table>
                  <thead>
                    <tr>
                      <Th>Usuario</Th>
                      {months.map(m => (
                        <Th key={m}>{MONTH_NAMES[m - 1]}</Th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(u => (
                      <Tr key={u}>
                        <Td><UserName>{u}</UserName></Td>
                        {months.map(m => {
                          if (!hasLicense(u, m)) {
                            return <Td key={m}><NoLicenseCell>—</NoLicenseCell></Td>;
                          }
                          const n = lookup.get(`${teamName}/${u}/${m}`) ?? 0;
                          return (
                            <Td key={m}>
                              <UCBadge $level={level(n)}>{n}/3</UCBadge>
                            </Td>
                          );
                        })}
                      </Tr>
                    ))}
                    <SummaryTr>
                      <SummaryTd>Completos ≥3</SummaryTd>
                      {monthTotals.map(({ complete: c, licensed }, i) => {
                        const p = licensed > 0 ? Math.round((c / licensed) * 100) : -1;
                        return (
                          <SummaryTd key={months[i]} $pct={p >= 0 ? p : undefined}>
                            {licensed > 0 ? `${c}/${licensed}` : '—'}
                          </SummaryTd>
                        );
                      })}
                    </SummaryTr>
                  </tbody>
                </Table>
              </TableWrapper>
            </TeamSection>
          );
        })
      )}
    </Container>
  );
}
