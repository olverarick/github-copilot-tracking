import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import api from '../../services/api';
import { useData } from '../../context/DataContext';
import type { AIBatchReport, AIUserReport } from '../../types';

// ── Styled components ─────────────────────────────────────────────────────────

const Wrap = styled.div`display: flex; flex-direction: column; gap: 1.25rem;`;

const ControlBar = styled.div`
  background: white; border-radius: 10px; border: 1px solid #E5E7EB;
  padding: 1rem 1.35rem; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
`;
const CtrlLabel = styled.span`
  font-size: 0.68rem; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.06em; color: #6B7280;
`;
const PeriodBadge = styled.span`
  font-size: 0.78rem; font-weight: 600; color: #003057;
  background: #EBF5FF; border: 1px solid #BFDBFE; border-radius: 6px;
  padding: 0.3rem 0.75rem;
`;
const Select = styled.select`
  border: 1px solid #D1D5DB; border-radius: 6px; padding: 0.35rem 0.75rem;
  font-size: 0.78rem; font-family: inherit; color: #374151; background: white;
  cursor: pointer; outline: none; &:focus { border-color: #0069B4; }
`;
const GenBtn = styled.button<{ $loading?: boolean }>`
  margin-left: auto;
  background: ${({ $loading }) => $loading ? '#9CA3AF' : '#003057'};
  color: white; border: none; border-radius: 7px; padding: 0.45rem 1.25rem;
  font-size: 0.78rem; font-weight: 600; font-family: inherit;
  cursor: ${({ $loading }) => $loading ? 'not-allowed' : 'pointer'};
  display: flex; align-items: center; gap: 0.45rem; transition: background 0.12s;
  &:hover:not(:disabled) { background: #0069B4; }
`;
const Spinner = styled.span`
  display: inline-block; width: 13px; height: 13px;
  border: 2px solid rgba(255,255,255,0.4); border-top-color: white;
  border-radius: 50%; animation: spin 0.7s linear infinite;
  @keyframes spin { to { transform: rotate(360deg); } }
`;
const MetaBar = styled.div`
  background: #EBF5FF; border: 1px solid #BFDBFE; border-radius: 8px;
  padding: 0.65rem 1.1rem; display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: center;
`;
const MetaItem = styled.span`font-size: 0.72rem; color: #1E40AF; font-weight: 500;`;
const MetaSep = styled.span`color: #93C5FD; font-size: 0.72rem;`;

const TeamCard = styled.div`
  background: white; border-radius: 10px; border: 1px solid #E5E7EB; overflow: hidden;
`;
const TeamHeader = styled.div`
  font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.07em; color: #6B7280;
  padding: 0.9rem 1.35rem 0.7rem;
  border-bottom: 1px solid #F3F4F6;
  display: flex; align-items: center; gap: 0.4rem;
`;

const UserRow = styled.div`border-bottom: 1px solid #F3F4F6; &:last-child { border-bottom: none; }`;
const UserHeader = styled.button`
  width: 100%; background: none; border: none; padding: 0.85rem 1.35rem;
  display: flex; align-items: center; gap: 0.85rem; cursor: pointer; text-align: left;
  &:hover { background: #F9FAFB; }
`;
const Avatar = styled.span`
  width: 30px; height: 30px; border-radius: 50%;
  background: linear-gradient(135deg, #0069B4 0%, #003057 100%);
  color: white; font-size: 0.75rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
`;
const UserInfo = styled.div`flex: 1; min-width: 0;`;
const UserName = styled.div`font-size: 0.78rem; font-weight: 600; color: #111827;`;
const UserMeta = styled.div`font-size: 0.68rem; color: #9CA3AF; margin-top: 0.1rem;`;
const Chevron = styled.span<{ $open: boolean }>`
  font-size: 0.75rem; color: #9CA3AF;
  transform: ${({ $open }) => $open ? 'rotate(180deg)' : 'rotate(0deg)'};
  transition: transform 0.15s;
`;
const FileBadge = styled.span`
  font-size: 0.65rem; background: #EBF5FF; color: #1E40AF; border-radius: 20px;
  padding: 0.15rem 0.6rem; font-weight: 600; margin-left: auto; margin-right: 0.5rem;
`;

const ReportBody = styled.div`
  padding: 1.1rem 1.35rem 1.35rem 4.2rem;
  border-top: 1px solid #F3F4F6;
  background: #FAFAFA;
`;

// ── Minimal markdown renderer ─────────────────────────────────────────────────

const MdH2 = styled.h2`
  font-size: 0.78rem; font-weight: 700; color: #003057;
  margin: 1rem 0 0.4rem; padding-bottom: 0.3rem;
  border-bottom: 1px solid #E5E7EB;
  &:first-child { margin-top: 0; }
`;
const MdH3 = styled.h3`font-size: 0.75rem; font-weight: 600; color: #374151; margin: 0.75rem 0 0.3rem;`;
const MdP  = styled.p`font-size: 0.78rem; color: #374151; line-height: 1.7; margin: 0.25rem 0;`;
const MdLi = styled.div`
  font-size: 0.78rem; color: #374151; line-height: 1.6; padding-left: 1rem;
  position: relative;
  &::before { content: '•'; position: absolute; left: 0.2rem; color: #0069B4; }
`;

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i}>{part.slice(2, -2)}</strong>
          : <React.Fragment key={i}>{part}</React.Fragment>
      )}
    </>
  );
}

function MarkdownView({ content }: { content: string }) {
  return (
    <div>
      {content.split('\n').map((line, i) => {
        if (line.startsWith('## '))  return <MdH2 key={i}>{renderInline(line.slice(3))}</MdH2>;
        if (line.startsWith('### ')) return <MdH3 key={i}>{renderInline(line.slice(4))}</MdH3>;
        if (line.startsWith('- ') || line.startsWith('* '))
          return <MdLi key={i}>{renderInline(line.slice(2))}</MdLi>;
        if (line.trim() === '' || line.trim() === '---') return <div key={i} style={{ height: '0.4rem' }} />;
        return <MdP key={i}>{renderInline(line)}</MdP>;
      })}
    </div>
  );
}

// ── Error / Empty ─────────────────────────────────────────────────────────────

const ErrorBox = styled.div`
  background: #FEE2E2; border: 1px solid #FECACA; border-radius: 8px;
  padding: 1rem 1.25rem; color: #991B1B; font-size: 0.78rem;
`;
const WarnBox = styled.div`
  background: #FEF9C3; border: 1px solid #FDE68A; border-radius: 8px;
  padding: 0.75rem 1.1rem; color: #854D0E; font-size: 0.75rem;
`;
const EmptyState = styled.div`
  background: white; border-radius: 10px; border: 1px solid #E5E7EB;
  padding: 3rem 2rem; display: flex; flex-direction: column;
  align-items: center; gap: 0.75rem; text-align: center;
`;

// ── Component ─────────────────────────────────────────────────────────────────

export default function AIReportPanel() {
  const { filters, teams } = useData();
  const selectedPeriod = filters.selectedPeriod;
  const year  = selectedPeriod?.year  ?? new Date().getFullYear();
  const month = selectedPeriod?.month ?? new Date().getMonth() + 1;
  const [annual, setAnnual] = useState(false);
  const [teamFilter, setTeamFilter] = useState<string>('');
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<AIBatchReport | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Auto-load saved reports when period or team changes (non-annual mode)
  useEffect(() => {
    if (annual) return;
    let cancelled = false;
    setResult(null);
    api.getSavedAIReport(year, month, teamFilter || undefined).then(data => {
      if (cancelled) return;
      if (data) {
        setResult(data);
        setError(null);
        if (data.users.length > 0)
          setExpanded(new Set([`${data.users[0].team}/${data.users[0].username}`]));
      }
      // if null → keeps result as null, showing EmptyState
    });
    return () => { cancelled = true; };
  }, [year, month, teamFilter, annual]);

  const handleGenerate = async () => {
    const key = window.prompt('Ingresa la clave de autorización:');
    if (key !== '.x25,zax') {
      if (key !== null) window.alert('Clave incorrecta.');
      return;
    }
    setLoading(true); setError(null); setResult(null); setExpanded(new Set());
    try {
      const data = await api.generateAIReport(year, annual ? undefined : month, teamFilter || undefined);
      setResult(data);
      // auto-expand first user
      if (data.users.length > 0) {
        setExpanded(new Set([`${data.users[0].team}/${data.users[0].username}`]));
      }
    } catch (err) {
      setError((err as Error).message ?? 'Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (key: string) =>
    setExpanded(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });

  // Group users by team
  const byTeam = result
    ? result.users.reduce((acc, u) => {
        (acc[u.team] ??= []).push(u);
        return acc;
      }, {} as Record<string, AIUserReport[]>)
    : {};

  return (
    <Wrap>
      {/* ── Control bar ── */}
      <ControlBar>
        <CtrlLabel>Período:</CtrlLabel>
        <PeriodBadge>
          {annual
            ? `Anual ${year}`
            : `${new Date(year, month - 1).toLocaleString('es-MX', { month: 'long', year: 'numeric' })}`}
        </PeriodBadge>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#6B7280', cursor: 'pointer', marginLeft: '0.25rem' }}>
          <input type="checkbox" checked={annual} onChange={e => setAnnual(e.target.checked)} style={{ accentColor: '#0069B4' }} />
          Reporte anual
        </label>
        <CtrlLabel style={{ marginLeft: '0.5rem' }}>Equipo:</CtrlLabel>
        <Select value={teamFilter} onChange={e => setTeamFilter(e.target.value)}>
          <option value="">Todos los equipos</option>
          {teams.map(t => <option key={t.team} value={t.team}>{t.team}</option>)}
        </Select>
        <GenBtn $loading={loading} onClick={handleGenerate} disabled={loading}>
          {loading ? <><Spinner />Generando reportes...</> : <>🤖 Generar Reportes</>}
        </GenBtn>
      </ControlBar>

      {error && <ErrorBox>⚠️ {error}</ErrorBox>}

      {!result && !loading && !error && (
        <EmptyState>
          <span style={{ fontSize: '2.5rem' }}>🤖</span>
          <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#374151', margin: 0 }}>Análisis de Uso por Usuario</p>
          <p style={{ fontSize: '0.78rem', color: '#9CA3AF', margin: 0, maxWidth: 420, lineHeight: 1.7 }}>
            Selecciona un período y presiona "Generar Reportes". Se enviará un prompt individual
            por cada usuario y los resultados se guardarán como archivos <code>reporte-ia-{'{año}-{mes}'}.md</code> en su directorio.
          </p>
        </EmptyState>
      )}

      {result && (
        <>
          {/* ── Meta bar ── */}
          <MetaBar>
            <MetaItem>📅 {result.period.label}</MetaItem>
            <MetaSep>·</MetaSep>
            <MetaItem>👥 {result.usersProcessed} usuario{result.usersProcessed !== 1 ? 's' : ''} analizados</MetaItem>
            <MetaSep>·</MetaSep>
            <MetaItem>🏢 {Object.keys(byTeam).join(', ')}</MetaItem>
            <MetaSep>·</MetaSep>
            <MetaItem style={{ color: '#166534' }}>💾 Reportes guardados como <code style={{ fontFamily: 'monospace' }}>reporte-ia-*.md</code></MetaItem>
            <MetaSep>·</MetaSep>
            <MetaItem style={{ color: '#9CA3AF' }}>
              {new Date(result.generatedAt).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </MetaItem>
          </MetaBar>

          {/* ── Errors ── */}
          {result.errors.length > 0 && (
            <WarnBox>
              ⚠️ {result.errors.length} usuario(s) con error: {result.errors.join(' · ')}
            </WarnBox>
          )}

          {/* ── Per-team accordion cards ── */}
          {Object.entries(byTeam).sort(([a], [b]) => a.localeCompare(b)).map(([team, users]) => (
            <TeamCard key={team}>
              <TeamHeader>
                🏢 {team}
                <span style={{ color: '#9CA3AF', fontWeight: 400, marginLeft: '0.5rem' }}>
                  {users.length} usuario{users.length !== 1 ? 's' : ''}
                </span>
              </TeamHeader>
              {users.map(u => {
                const key = `${u.team}/${u.username}`;
                const open = expanded.has(key);
                return (
                  <UserRow key={key}>
                    <UserHeader onClick={() => toggleUser(key)}>
                      <Avatar>{u.username.charAt(0).toUpperCase()}</Avatar>
                      <UserInfo>
                        <UserName>{u.username}</UserName>
                        <UserMeta>{u.filesAnalyzed} caso{u.filesAnalyzed !== 1 ? 's' : ''} de uso analizado{u.filesAnalyzed !== 1 ? 's' : ''}</UserMeta>
                      </UserInfo>
                      <FileBadge>📄 {u.savedPath}</FileBadge>
                      <Chevron $open={open}>▾</Chevron>
                    </UserHeader>
                    {open && (
                      <ReportBody>
                        <MarkdownView content={u.reportContent} />
                      </ReportBody>
                    )}
                  </UserRow>
                );
              })}
            </TeamCard>
          ))}
        </>
      )}
    </Wrap>
  );
}
