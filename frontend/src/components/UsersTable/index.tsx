import React, { useState, useMemo, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { Badge, Card, Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../styles/components';
import { useData } from '../../context/DataContext';
import type { UserMetrics } from '../../types';
import api from '../../services/api';
import { buildCsv, downloadCsv, slugForFilename } from '../../utils/csv';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const shimmer = keyframes`
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
`;

const SkeletonCell = styled.td<{ $w?: string }>`
  padding: 0.65rem 1rem;
`;

const SkeletonLine = styled.div<{ $w?: string }>`
  height: 0.75rem;
  width: ${({ $w }) => $w ?? '80%'};
  border-radius: 4px;
  background: linear-gradient(90deg, #ececec 25%, #f5f5f5 50%, #ececec 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.4s infinite;
`;

// ─── Usage bar ────────────────────────────────────────────────────────────────

const UsageCellWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: flex-end;
`;

const BarTrack = styled.div`
  width: 56px;
  height: 5px;
  background: #E5E7EB;
  border-radius: 3px;
  overflow: hidden;
  flex-shrink: 0;
`;

const BarFill = styled.div<{ $pct: number; $color: string }>`
  height: 100%;
  width: ${({ $pct }) => Math.min($pct, 100)}%;
  background: ${({ $color }) => $color};
  border-radius: 3px;
  transition: width 0.35s ease;
`;

const PctText = styled.span`
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
  min-width: 36px;
  text-align: right;
`;

function usageColor(pct: number): string {
  if (pct >= 70) return '#22C55E';
  if (pct >= 30) return '#F59E0B';
  return '#EF4444';
}

// ─── Filter select ────────────────────────────────────────────────────────────

const TeamSelect = styled.select`
  padding: 0.28rem 0.6rem;
  border: 1px solid ${({ theme }) => theme.colors?.border};
  border-radius: 20px;
  font-size: 0.78rem;
  background: ${({ theme }) => theme.colors?.background};
  color: ${({ theme }) => theme.colors?.textPrimary};
  cursor: pointer;
  outline: none;
  transition: border-color 0.15s;
  &:focus { border-color: ${({ theme }) => theme.colors?.primary}; }
`;

// ─── Table layout ─────────────────────────────────────────────────────────────

const TableContainer = styled(Card)`padding: 0; overflow-x: auto;`;

const TableToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1.25rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors?.border};
  gap: 1rem;
  flex-wrap: wrap;
`;

const TableTitle = styled.h3`
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors?.textSecondary};
  margin: 0;
`;

const SearchInput = styled.input`
  padding: 0.3rem 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors?.border};
  border-radius: 20px;
  font-size: 0.8rem;
  min-width: 200px;
  background: ${({ theme }) => theme.colors?.background};
  color: ${({ theme }) => theme.colors?.textPrimary};
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  &::placeholder { color: ${({ theme }) => theme.colors?.textSecondary}; }
  &:focus {
    border-color: ${({ theme }) => theme.colors?.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors?.primary}22;
  }
`;

const CountBadge = styled.span`
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors?.textSecondary};
  white-space: nowrap;
`;

const DownloadButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.8rem;
  border: 1px solid ${({ theme }) => theme.colors?.border};
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 600;
  background: ${({ theme }) => theme.colors?.primary};
  color: #fff;
  cursor: pointer;
  white-space: nowrap;
  outline: none;
  transition: opacity 0.15s;
  &:hover:not(:disabled) { opacity: 0.88; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
`;

const Thead = styled(TableHead)`background-color: ${({ theme }) => theme.colors?.background};`;
const Th = styled(TableHeader)<{ $sorted?: boolean }>`
  padding: 0.55rem 1rem;
  cursor: pointer; user-select: none; white-space: nowrap; vertical-align: top;
  font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
  color: ${({ $sorted, theme }) => $sorted ? theme.colors?.primary : theme.colors?.textSecondary};
  &:hover { color: ${({ theme }) => theme.colors?.primary}; background: ${({ theme }) => theme.colors?.surfaceHover}; }
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
const Tr = styled(TableRow)<{ $clickable?: boolean }>`
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  &:hover { background: ${({ $clickable, theme }) => ($clickable ? theme.colors?.surfaceHover : 'transparent')}; }
`;
const Td = styled(TableCell)`white-space: nowrap; padding: 0.5rem 1rem; font-size: 0.82rem;`;
const UsernameCell = styled(Td)`font-family: monospace; font-weight: 600; color: ${({ theme }) => theme.colors?.primary};`;
const NumberCell = styled(Td)`text-align: right; font-variant-numeric: tabular-nums;`;
const EmptyState = styled.div`padding: 3rem; text-align: center; color: ${({ theme }) => theme.colors?.textSecondary};`;

const UCCountBadge = styled.span<{ $ok: boolean }>`
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 10px;
  background: ${({ $ok }) => $ok ? '#DCFCE7' : '#FEF9C3'};
  color: ${({ $ok }) => $ok ? '#166534' : '#854D0E'};
  border: 1px solid ${({ $ok }) => $ok ? '#BBF7D0' : '#FDE68A'};
`;

type SortField = keyof Pick<UserMetrics, 'username' | 'totalRequests' | 'diasActivos' | 'porcentajeUso' | 'categoriaUso' | 'totalCost'>;

const getCategoryVariant = (cat: string): 'default' | 'warning' | 'info' | 'success' => {
  const map: Record<string, 'default' | 'warning' | 'info' | 'success'> = {
    'SIN USO': 'default',
    'USO BAJO (<40%)': 'warning',
    'USO MODERADO (40-70%)': 'info',
    'USO ALTO (>70%)': 'success',
  };
  return map[cat] ?? 'default';
};

interface UsersTableProps {
  onUserSelect?: (user: UserMetrics) => void;
  /** Pre-filter to this team (e.g. drill-down from Teams tab). */
  teamFilter?: string;
}

const UsersTable = React.forwardRef<HTMLDivElement, UsersTableProps>(({ onUserSelect, teamFilter: externalTeamFilter }, ref) => {
  const { users, loading, filters, currentQuota, currentQuotaLabel } = useData();
  const [sortField, setSortField] = useState<SortField>('totalRequests');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');
  const [localTeamFilter, setLocalTeamFilter] = useState('');
  const [ucCounts, setUcCounts] = useState<Map<string, number>>(new Map());

  const period = filters?.selectedPeriod ?? null;
  useEffect(() => {
    if (!period?.year || !period?.month) { setUcCounts(new Map()); return; }
    api.getUseCaseCounts(period.year, period.month)
      .then(rows => {
        const m = new Map<string, number>();
        // Backend normalizes spaces→underscores in dir names; reverse to match user.equipo
        rows.forEach(r => m.set(`${r.team.replace(/_/g, ' ')}/${r.username}`, r.count));
        setUcCounts(m);
      })
      .catch(() => setUcCounts(new Map()));
  }, [period?.year, period?.month]); // eslint-disable-line

  const activeTeamFilter = externalTeamFilter ?? localTeamFilter;

  // Unique team names for the dropdown
  const teamNames = useMemo(() => {
    const names = Array.from(new Set(users.map(u => u.equipo).filter(Boolean))).sort();
    return names as string[];
  }, [users]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const sortIndicator = (f: SortField) => sortField === f ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  const filtered = useMemo(() => users.filter(u => {
    if (activeTeamFilter && u.equipo !== activeTeamFilter) return false;
    if (!search) return true;
    return (
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.equipo || '').toLowerCase().includes(search.toLowerCase())
    );
  }), [users, activeTeamFilter, search]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const av = a[sortField] as string | number;
    const bv = b[sortField] as string | number;
    if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
    return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
  }), [filtered, sortField, sortDir]);

  // Exporta exactamente lo que está en pantalla: mismo filtro de equipo,
  // misma búsqueda y mismo orden que la tabla visible.
  const handleExportCsv = () => {
    const headers = [
      'Usuario', 'Nombre', 'Correo', 'Equipo', 'Requests', 'Días activos',
      '% Uso', 'Categoría', 'Casos de uso', 'Costo mensual (USD)',
    ];
    const rows = sorted.map(u => [
      u.username,
      u.nombre ?? '',
      u.correo ?? '',
      u.equipo ?? '',
      u.totalRequests,
      u.diasActivos,
      u.porcentajeUso,
      u.categoriaUso,
      ucCounts.get(`${u.equipo}/${u.username}`) ?? 0,
      19,
    ]);
    const periodTag = period?.year && period?.month
      ? `${period.year}-${String(period.month).padStart(2, '0')}`
      : 'todos';
    const teamTag = slugForFilename(activeTeamFilter) || 'todos_los_equipos';
    downloadCsv(`usuarios_${teamTag}_${periodTag}.csv`, buildCsv(headers, rows));
  };

  if (loading) return (
    <TableContainer ref={ref}>
      <TableToolbar>
        <TableTitle>Usuarios</TableTitle>
      </TableToolbar>
      <Table>
        <Thead><tr>
          <Th>Usuario</Th><Th>Requests</Th><Th>Días activos</Th><Th>% Uso</Th><Th>Categoría</Th><Th>Casos de uso</Th><Th>Costo mensual</Th>
        </tr></Thead>
        <TableBody>
          {Array.from({ length: 8 }).map((_, i) => (
            <TableRow key={i}>
              <SkeletonCell><SkeletonLine $w="60%" /></SkeletonCell>
              <SkeletonCell><SkeletonLine $w="40%" /></SkeletonCell>
              <SkeletonCell><SkeletonLine $w="30%" /></SkeletonCell>
              <SkeletonCell><SkeletonLine $w="50%" /></SkeletonCell>
              <SkeletonCell><SkeletonLine $w="70%" /></SkeletonCell>
              <SkeletonCell><SkeletonLine $w="30%" /></SkeletonCell>
              <SkeletonCell><SkeletonLine $w="40%" /></SkeletonCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  if (!users.length) return (
    <TableContainer ref={ref}>
      <TableToolbar>
        <TableTitle>Usuarios</TableTitle>
      </TableToolbar>
      <EmptyState>No hay datos disponibles. Usa "⬆ Importar" para subir un CSV.</EmptyState>
    </TableContainer>
  );

  return (
    <TableContainer ref={ref}>
      <TableToolbar>
        <TableTitle>
          Usuarios <CountBadge>({sorted.length} de {users.length})</CountBadge>
        </TableTitle>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {!externalTeamFilter && teamNames.length > 0 && (
            <TeamSelect
              value={localTeamFilter}
              onChange={e => setLocalTeamFilter(e.target.value)}
              aria-label="Filtrar por equipo"
            >
              <option value="">Todos los equipos</option>
              {teamNames.map(t => <option key={t} value={t}>{t}</option>)}
            </TeamSelect>
          )}
          {externalTeamFilter && (
            <CountBadge style={{ fontWeight: 600 }}>🏢 {externalTeamFilter}</CountBadge>
          )}
          <SearchInput
            placeholder="Buscar usuario…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Buscar usuario"
          />
          <DownloadButton
            onClick={handleExportCsv}
            disabled={sorted.length === 0}
            title="Descargar en CSV los usuarios visibles"
          >
            ⬇ CSV
          </DownloadButton>
        </div>
      </TableToolbar>
      <Table>
        <Thead>
          <tr>
            <Th $sorted={sortField === 'username'} onClick={() => handleSort('username')}>Usuario{sortIndicator('username')}<ThSub>nombre de cuenta</ThSub></Th>
            <Th $sorted={sortField === 'totalRequests'} onClick={() => handleSort('totalRequests')}>Requests{sortIndicator('totalRequests')}<ThSub>total del período</ThSub></Th>
            <Th $sorted={sortField === 'diasActivos'} onClick={() => handleSort('diasActivos')}>Días activos{sortIndicator('diasActivos')}<ThSub>con al menos 1 request</ThSub></Th>
            <Th $sorted={sortField === 'porcentajeUso'} onClick={() => handleSort('porcentajeUso')}>% Uso{sortIndicator('porcentajeUso')}<ThSub>{currentQuota ? `vs cuota mensual (${currentQuota} ${currentQuotaLabel ?? 'requests'})` : 'vs cuota mensual'}</ThSub></Th>
            <Th $sorted={sortField === 'categoriaUso'} onClick={() => handleSort('categoriaUso')}>Categoría{sortIndicator('categoriaUso')}<ThSub>nivel de adopción</ThSub></Th>
            <Th>Casos de uso<ThSub>por equipo · mes</ThSub></Th>
            <Th $sorted={sortField === 'totalCost'} onClick={() => handleSort('totalCost')}>Costo mensual{sortIndicator('totalCost')}<ThSub>$19 USD / licencia</ThSub></Th>
          </tr>
        </Thead>
        <TableBody>
          {sorted.length === 0 ? (
            <tr><td colSpan={6}><EmptyState>Sin resultados para "{search}"</EmptyState></td></tr>
          ) : sorted.map(user => {
            const color = usageColor(user.porcentajeUso);
            const ucKey = `${user.equipo}/${user.username}`;
            const ucCount = ucCounts.get(ucKey) ?? 0;
            return (
              <Tr key={user.username} $clickable={!!onUserSelect} onClick={() => onUserSelect?.(user)}>
                <UsernameCell title="Ver detalle">{user.username}</UsernameCell>
                <NumberCell>{user.totalRequests.toLocaleString('es-MX')}</NumberCell>
                <NumberCell>{user.diasActivos}</NumberCell>
                <Td style={{ textAlign: 'right' }}>
                  <UsageCellWrap>
                    <BarTrack>
                      <BarFill $pct={user.porcentajeUso} $color={color} />
                    </BarTrack>
                    <PctText style={{ color }}>{user.porcentajeUso}%</PctText>
                  </UsageCellWrap>
                </Td>
                <Td><Badge variant={getCategoryVariant(user.categoriaUso)}>{user.categoriaUso}</Badge></Td>
                <Td style={{ textAlign: 'center' }}>
                  <UCCountBadge $ok={ucCount >= 3}>{ucCount}/3</UCCountBadge>
                </Td>
                <NumberCell>$19.00</NumberCell>
              </Tr>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
});

UsersTable.displayName = 'UsersTable';
export default UsersTable;
