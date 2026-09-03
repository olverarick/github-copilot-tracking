import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import api from '../../services/api';
import type { UserLicenseYear } from '../../types';
import { buildCsv, downloadCsv } from '../../utils/csv';

const Container = styled.div`padding: ${({ theme }) => theme.spacing?.xl || '2rem'};`;
const Title = styled.h2`font-size: ${({ theme }) => theme.typography?.fontSize?.['2xl'] || '1.5rem'}; font-weight: 700; color: ${({ theme }) => theme.colors?.textPrimary}; margin: 0 0 ${({ theme }) => theme.spacing?.lg} 0;`;
const ControlsBar = styled.div`display: flex; gap: ${({ theme }) => theme.spacing?.md}; align-items: center; flex-wrap: wrap; margin-bottom: ${({ theme }) => theme.spacing?.lg}; background: ${({ theme }) => theme.colors?.surface}; padding: ${({ theme }) => theme.spacing?.md}; border-radius: ${({ theme }) => theme.borderRadius?.lg}; box-shadow: ${({ theme }) => theme.shadows?.sm};`;
const Label = styled.label`font-size: ${({ theme }) => theme.typography?.fontSize?.sm}; font-weight: ${({ theme }) => theme.typography?.fontWeight?.medium}; color: ${({ theme }) => theme.colors?.textSecondary};`;
const Select = styled.select`padding: 0.375rem 0.75rem; border: 1px solid ${({ theme }) => theme.colors?.border}; border-radius: ${({ theme }) => theme.borderRadius?.md}; font-size: ${({ theme }) => theme.typography?.fontSize?.sm}; background: white; cursor: pointer;`;
const SearchInput = styled.input`padding: 0.375rem 0.75rem; border: 1px solid ${({ theme }) => theme.colors?.border}; border-radius: ${({ theme }) => theme.borderRadius?.md}; font-size: ${({ theme }) => theme.typography?.fontSize?.sm}; min-width: 220px;`;
const EquipoBadge = styled.span`display: inline-block; padding: 0.1rem 0.45rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 600; background: #EFF6FF; color: #1B3A5C; border: 1px solid #BFDBFE;`;
const TableWrapper = styled.div`overflow-x: auto; background: ${({ theme }) => theme.colors?.surface}; border-radius: ${({ theme }) => theme.borderRadius?.lg}; box-shadow: ${({ theme }) => theme.shadows?.sm};`;
const Table = styled.table`width: 100%; border-collapse: collapse; font-size: 0.8rem;`;
const Th = styled.th<{ $center?: boolean }>`padding: 0.55rem 0.75rem; text-align: ${({ $center }) => ($center ? 'center' : 'left')}; font-weight: 600; font-size: 0.75rem; color: ${({ theme }) => theme.colors?.textSecondary}; text-transform: uppercase; letter-spacing: 0.04em; background: ${({ theme }) => theme.colors?.background}; border-bottom: 1px solid ${({ theme }) => theme.colors?.border}; white-space: nowrap;`;
const Tr = styled.tr`&:hover { background: ${({ theme }) => theme.colors?.background}; }`;
const Td = styled.td<{ $center?: boolean }>`padding: 0.45rem 0.75rem; border-bottom: 1px solid ${({ theme }) => theme.colors?.border}; white-space: nowrap; color: ${({ theme }) => theme.colors?.textPrimary}; text-align: ${({ $center }) => ($center ? 'center' : 'left')};`;
const LicenseDot = styled.div<{ $has: boolean }>`
  width: 22px; height: 22px; border-radius: 5px; margin: 0 auto;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.65rem; font-weight: 700;
  background: ${({ $has }) => ($has ? '#1B3A5C' : '#F3F4F6')};
  color: ${({ $has }) => ($has ? 'white' : '#D1D5DB')};
`;
const StatusMsg = styled.p<{ $error?: boolean }>`text-align: center; color: ${({ $error, theme }) => $error ? '#dc2626' : theme.colors?.textSecondary}; padding: 2rem;`;
const DownloadButton = styled.button`
  display: flex; align-items: center; gap: 0.35rem;
  padding: 0.375rem 0.85rem;
  border: 1px solid ${({ theme }) => theme.colors?.border};
  border-radius: ${({ theme }) => theme.borderRadius?.md};
  font-size: ${({ theme }) => theme.typography?.fontSize?.sm};
  font-weight: 600;
  background: #1B3A5C; color: white;
  cursor: pointer; white-space: nowrap;
  transition: background 0.15s;
  &:hover:not(:disabled) { background: #14304d; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
`;

const MONTHS = [
  { num: 1, label: 'Ene' }, { num: 2, label: 'Feb' }, { num: 3, label: 'Mar' },
  { num: 4, label: 'Abr' }, { num: 5, label: 'May' }, { num: 6, label: 'Jun' },
  { num: 7, label: 'Jul' }, { num: 8, label: 'Ago' }, { num: 9, label: 'Sep' },
  { num: 10, label: 'Oct' }, { num: 11, label: 'Nov' }, { num: 12, label: 'Dic' },
];

function downloadCSV(rows: UserLicenseYear[], year: number | null) {
  const headers = ['Usuario', 'Equipo', ...MONTHS.map(m => m.label), 'Meses Activos'];
  const csvRows = rows.map(row => [
    row.usuario,
    row.equipo || '',
    ...MONTHS.map(m => (row.licenses?.[m.num] ? 'SI' : 'NO')),
    MONTHS.filter(m => row.licenses?.[m.num]).length,
  ]);
  downloadCsv(`licencias_${year ?? 'export'}.csv`, buildCsv(headers, csvRows));
}

function useLicenses(year: number | null) {
  const [rows, setRows] = useState<UserLicenseYear[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!year) return;
    setLoading(true); setError(null);
    try {
      const result = await api.getLicenseYearView(year);
      setRows(result as UserLicenseYear[]);
    } catch {
      setError('Error cargando licencias');
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { load(); }, [load]);
  return { rows, loading, error };
}

export default function LicenseManager() {
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const { rows, loading, error } = useLicenses(selectedYear);

  useEffect(() => {
    api.getLicenseYears().then((data: number[]) => {
      setYears(data);
      // data comes newest-first from backend
      if (data.length > 0) setSelectedYear(data[0]);
    }).catch(() => {});
  }, []);

  const filteredRows = rows.filter(r =>
    !search || r.usuario.toLowerCase().includes(search.toLowerCase()) || (r.equipo || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Container>
      <Title>🔑 Licencias por equipo y mes</Title>
      <ControlsBar>
        <Label>Año:</Label>
        <Select value={selectedYear ?? ''} onChange={e => setSelectedYear(parseInt(e.target.value, 10))}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </Select>
        <SearchInput placeholder="Buscar usuario o equipo..." value={search} onChange={e => setSearch(e.target.value)} />
        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#6b7280' }}>
          {filteredRows.length} usuario(s)
        </span>
        <DownloadButton
          onClick={() => downloadCSV(filteredRows, selectedYear)}
          disabled={loading || filteredRows.length === 0}
          title="Descargar lista visible como CSV"
        >
          ⬇ Descargar CSV
        </DownloadButton>
      </ControlsBar>

      {loading && <StatusMsg>Cargando licencias...</StatusMsg>}
      {error && <StatusMsg $error>{error}</StatusMsg>}

      {!loading && !error && (
        <TableWrapper>
          <Table>
            <thead>
              <tr>
                <Th title="Nombre de cuenta del usuario">Usuario</Th>
                <Th title="Equipo al que pertenece">Equipo</Th>
                {MONTHS.map(m => <Th key={m.num} $center title={`Licencia activa en ${m.label}`}>{m.label}</Th>)}
                <Th $center title="Cantidad de meses con licencia asignada en el año">Meses activos</Th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr><td colSpan={15} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>No hay usuarios registrados para {selectedYear}</td></tr>
              ) : filteredRows.map(row => {
                const total = MONTHS.filter(m => row.licenses?.[m.num]).length;
                return (
                  <Tr key={row.usuario}>
                    <Td><span style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{row.usuario}</span></Td>
                    <Td><EquipoBadge>{row.equipo || '—'}</EquipoBadge></Td>
                    {MONTHS.map(m => {
                      const val = row.licenses?.[m.num] ?? false;
                      return (
                        <Td key={m.num} $center>
                          <LicenseDot $has={val}>{val ? '✓' : ''}</LicenseDot>
                        </Td>
                      );
                    })}
                    <Td $center><strong>{total}</strong><span style={{ color: '#9ca3af', fontSize: '0.7rem' }}>/12</span></Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        </TableWrapper>
      )}
    </Container>
  );
}

