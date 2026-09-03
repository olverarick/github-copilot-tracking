import React, { useEffect, useState, useCallback, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import styled, { useTheme, keyframes } from 'styled-components';
import api from '../../services/api';
import { useData } from '../../context/DataContext';
import type { TimelineResponse, UserModelMetrics, Period, UseCase, UserAuditScore } from '../../types';

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const MODEL_COLORS = ['#1B3A5C','#1976D2','#7C3AED','#DB2777','#D97706','#DC2626','#0891B2','#64748B'];

function intensityLevel(req: number): 0 | 1 | 2 | 3 {
  if (req >= 200) return 3;
  if (req >= 100) return 2;
  if (req >= 30)  return 1;
  return 0;
}

// ── Animations ───────────────────────────────────────────────────────────────
const slideIn = keyframes`
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
`;

// ── Styled components ─────────────────────────────────────────────────────────
const Overlay = styled.div`
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.45); z-index: 400; backdrop-filter: blur(2px);
`;
const Drawer = styled.aside`
  position: fixed; top: 0; right: 0; height: 100vh;
  width: min(600px, 95vw);
  background: ${({ theme }) => theme.colors?.surface};
  box-shadow: -8px 0 32px rgba(0,0,0,0.18);
  z-index: 401; display: flex; flex-direction: column;
  animation: ${slideIn} 0.22s ease; overflow: hidden;
`;
const DrawerHeader = styled.div`
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #1B3A5C 0%, #0f2540 100%);
  color: white; flex-shrink: 0;
`;
const DrawerTitle = styled.div`
  h2 { margin: 0 0 0.2rem 0; font-size: 1rem; font-weight: 700; word-break: break-all; font-family: monospace; color: white; }
  p  { margin: 0; font-size: 0.8rem; opacity: 0.85; color: white; }
`;
const CloseBtn = styled.button`
  background: rgba(255,255,255,0.2); border: none; color: white;
  width: 32px; height: 32px; border-radius: 50%; cursor: pointer;
  font-size: 1.1rem; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-left: 0.75rem;
  &:hover { background: rgba(255,255,255,0.35); }
`;
const ToggleBtn = styled.button`
  background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.4);
  color: white; border-radius: 20px; cursor: pointer;
  font-size: 0.7rem; font-weight: 600; padding: 3px 10px;
  margin-top: 0.45rem; display: inline-flex; align-items: center; gap: 4px;
  transition: background 0.15s;
  &:hover { background: rgba(255,255,255,0.32); }
`;
const DrawerBody = styled.div`
  flex: 1; overflow-y: auto; padding: 1rem 1.25rem;
  display: flex; flex-direction: column; gap: 1rem;
`;
const KpiRow = styled.div`
  display: grid; grid-template-columns: repeat(4,1fr); gap: 0.75rem;
  @media(max-width:480px){ grid-template-columns: repeat(2,1fr); }
`;
const KpiCard = styled.div`
  background: ${({ theme }) => theme.colors?.background};
  border-radius: 10px; padding: 0.85rem 1rem; text-align: center;
  border: 1px solid ${({ theme }) => theme.colors?.border};
`;
const KpiValue = styled.div`
  font-size: 1.25rem; font-weight: 700;
  color: #1B3A5C; line-height: 1; margin-bottom: 0.25rem;
`;
const KpiLabel = styled.div`
  font-size: 0.68rem; color: ${({ theme }) => theme.colors?.textSecondary};
  text-transform: uppercase; letter-spacing: 0.04em;
`;
const Section = styled.div`
  background: ${({ theme }) => theme.colors?.background};
  border-radius: 12px; border: 1px solid ${({ theme }) => theme.colors?.border}; overflow: hidden;
`;
const SectionTitle = styled.div`
  font-size: 0.78rem; font-weight: 600; color: ${({ theme }) => theme.colors?.textSecondary};
  text-transform: uppercase; letter-spacing: 0.05em;
  padding: 0.6rem 1rem; background: ${({ theme }) => theme.colors?.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors?.border};
`;
const ModelRow = styled.div`
  display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors?.border};
  &:last-child { border-bottom: none; }
`;
const BarTrack = styled.div`
  flex: 1; height: 7px; background: ${({ theme }) => theme.colors?.border};
  border-radius: 4px; overflow: hidden;
`;
const BarFill = styled.div<{ $pct: number; $color: string }>`
  height: 100%; border-radius: 4px;
  width: ${({ $pct }) => $pct}%;
  background: ${({ $color }) => $color};
  transition: width 0.4s ease;
`;
const DaysGrid = styled.div`display: flex; flex-wrap: wrap; gap: 4px; padding: 0.85rem 1rem;`;
const DayChip = styled.div<{ $level: 0 | 1 | 2 | 3 }>`
  padding: 3px 8px; border-radius: 4px; font-size: 0.68rem; font-family: monospace; cursor: default;
  background: ${({ $level }) => $level === 3 ? '#1B3A5C' : $level === 2 ? '#2563EB' : $level === 1 ? '#BFDBFE' : '#F1F5F9'};
  color: ${({ $level }) => ($level >= 2 ? 'white' : '#1B3A5C')};
  font-weight: ${({ $level }) => ($level >= 2 ? 600 : 400)};
`;
const Spinner = styled.p<{ $err?: boolean }>`
  text-align: center; padding: 2rem;
  color: ${({ $err, theme }) => ($err ? '#dc2626' : theme.colors?.textSecondary)};
  font-size: 0.875rem;
`;

// ── Use Cases styled components ───────────────────────────────────────────────
const UCHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.6rem 1rem;
  background: ${({ theme }) => theme.colors?.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors?.border};
`;
const UCBadge = styled.span<{ $ok: boolean }>`
  font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 20px;
  background: ${({ $ok }) => ($ok ? '#DCFCE7' : '#FEF9C3')};
  color: ${({ $ok }) => ($ok ? '#166534' : '#854D0E')};
`;
const AuditQBadge = styled.span<{ $badge: 'green' | 'yellow' | 'red' }>`
  font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 20px;
  background: ${({ $badge }) => $badge === 'green' ? '#DCFCE7' : $badge === 'yellow' ? '#FEF9C3' : '#FEE2E2'};
  color: ${({ $badge }) => $badge === 'green' ? '#166534' : $badge === 'yellow' ? '#854D0E' : '#991B1B'};
  border: 1px solid ${({ $badge }) => $badge === 'green' ? '#BBF7D0' : $badge === 'yellow' ? '#FDE68A' : '#FECACA'};
  cursor: default;
`;
const UCUploadBtn = styled.label`
  font-size: 0.72rem; font-weight: 600; padding: 3px 10px;
  border-radius: 6px; cursor: pointer;
  background: #1B3A5C; color: white; border: none;
  display: inline-flex; align-items: center; gap: 4px;
  &:hover { background: #2563EB; }
`;
const UCList = styled.div`padding: 0.5rem 1rem; display: flex; flex-direction: column; gap: 0.4rem;`;
const UCItem = styled.div`
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.5rem 0.6rem; border-radius: 6px;
  background: ${({ theme }) => theme.colors?.background};
  border: 1px solid ${({ theme }) => theme.colors?.border};
  cursor: pointer;
  &:hover { border-color: #1B3A5C; }
`;
const UCName = styled.span`
  flex: 1; font-size: 0.78rem; font-weight: 500;
  color: #1B3A5C; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
`;
const UCDate = styled.span`font-size: 0.68rem; color: #9CA3AF; flex-shrink: 0;`;
const UCDeleteBtn = styled.button`
  background: none; border: none; cursor: pointer; color: #9CA3AF; font-size: 0.85rem; flex-shrink: 0;
  &:hover { color: #EF4444; }
`;
const UCEmpty = styled.p`
  padding: 0.85rem 1rem; font-size: 0.78rem;
  color: ${({ theme }) => theme.colors?.textSecondary}; margin: 0;
`;
const UCModal = styled.div`
  position: fixed; inset: 0; z-index: 500;
  background: rgba(0,0,0,0.55); display: flex; align-items: flex-start; justify-content: center;
  padding-top: 60px;
`;
const UCModalBox = styled.div`
  background: white; border-radius: 12px; width: min(700px, 95vw);
  max-height: 80vh; display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
`;
const UCModalHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.9rem 1.25rem;
  background: linear-gradient(135deg,#1B3A5C,#0f2540); color: white;
`;
const UCModalTitle = styled.h3`margin: 0; font-size: 0.9rem; font-weight: 700; font-family: monospace; color: white;`;
const UCModalClose = styled.button`
  background: rgba(255,255,255,0.2); border: none; color: white;
  width: 28px; height: 28px; border-radius: 50%; cursor: pointer; font-size: 1rem;
  display: flex; align-items: center; justify-content: center;
  &:hover { background: rgba(255,255,255,0.35); }
`;
const UCModalBody = styled.div`
  flex: 1; overflow-y: auto; padding: 1.5rem 1.75rem; margin: 0;
  font-family: inherit; font-size: 0.85rem; line-height: 1.7; color: #1F2937;

  h1 { font-size: 1.25rem; font-weight: 700; margin: 0 0 0.6rem; color: #111827; border-bottom: 2px solid #E5E7EB; padding-bottom: 0.35rem; }
  h2 { font-size: 1rem; font-weight: 700; margin: 1.2rem 0 0.4rem; color: #1B3A5C; }
  h3 { font-size: 0.9rem; font-weight: 700; margin: 1rem 0 0.3rem; color: #374151; }
  strong { font-weight: 700; color: #111827; }
  em { font-style: italic; }
  p { margin: 0.4rem 0 0.7rem; }
  ul { margin: 0.3rem 0 0.7rem 1.4rem; padding: 0; }
  li { margin-bottom: 0.2rem; }
  li.task { list-style: none; margin-left: -1.4rem; display: flex; align-items: flex-start; gap: 0.35rem; }
  li.task input { margin-top: 0.22rem; accent-color: #1B3A5C; flex-shrink: 0; }
  hr { border: none; border-top: 1px solid #E5E7EB; margin: 1rem 0; }
  code { background: #F3F4F6; border-radius: 3px; padding: 0.1em 0.35em; font-family: monospace; font-size: 0.82em; color: #374151; }
  blockquote { border-left: 3px solid #D1D5DB; margin: 0.5rem 0; padding: 0.3rem 0.75rem; color: #6B7280; font-style: italic; }
`;

// ── Simple markdown → HTML renderer ─────────────────────────────────────────
function renderMarkdown(text: string): string {
  const escape = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const inline = (s: string) => escape(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');

  const lines = text.split(/\r?\n/);
  const out: string[] = [];
  let inUl = false;

  const closeUl = () => { if (inUl) { out.push('</ul>'); inUl = false; } };

  for (const raw of lines) {
    const line = raw;
    if (/^#{3} /.test(line)) { closeUl(); out.push(`<h3>${inline(line.slice(4))}</h3>`); }
    else if (/^## /.test(line)) { closeUl(); out.push(`<h2>${inline(line.slice(3))}</h2>`); }
    else if (/^# /.test(line))  { closeUl(); out.push(`<h1>${inline(line.slice(2))}</h1>`); }
    else if (/^---+$/.test(line.trim())) { closeUl(); out.push('<hr/>'); }
    else if (/^- \[[ xX]\] /.test(line)) {
      const checked = /^- \[[xX]\] /.test(line);
      const txt = inline(line.replace(/^- \[[ xX]\] /, ''));
      if (!inUl) { out.push('<ul>'); inUl = true; }
      out.push(`<li class="task"><input type="checkbox" disabled${checked ? ' checked' : ''}><span>${txt}</span></li>`);
    }
    else if (/^- /.test(line)) {
      if (!inUl) { out.push('<ul>'); inUl = true; }
      out.push(`<li>${inline(line.slice(2))}</li>`);
    }
    else if (/^> /.test(line)) { closeUl(); out.push(`<blockquote>${inline(line.slice(2))}</blockquote>`); }
    else if (line.trim() === '') { closeUl(); out.push('<p></p>'); }
    else { closeUl(); out.push(`<p>${inline(line)}</p>`); }
  }
  closeUl();
  return out.join('\n');
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  username: string;
  team: string;
  onClose: () => void;
}

export default function UserDrawer({ username, team, onClose }: Props) {
  const theme = useTheme();
  const { filters } = useData();
  const globalPeriod: Period | null = filters?.selectedPeriod ?? null;

  const [timeline, setTimeline] = useState<TimelineResponse | null>(null);
  const [models,   setModels]   = useState<UserModelMetrics[] | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  // Use cases state
  const [useCases,     setUseCases]     = useState<UseCase[]>([]);
  const [ucLoading,    setUcLoading]    = useState(false);
  const [ucUploading,  setUcUploading]  = useState(false);
  const [ucError,      setUcError]      = useState<string | null>(null);
  const [openUC,       setOpenUC]       = useState<{ filename: string; content: string } | null>(null);
  const [auditScore,   setAuditScore]   = useState<UserAuditScore | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activePeriod: Period | null = globalPeriod;
  const periodLabel = activePeriod
    ? `${MONTH_NAMES[(activePeriod.month || 1) - 1]} ${activePeriod.year}`
    : 'Todos los períodos';

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [tl, mdl] = await Promise.all([
        api.getUserTimeline(username, activePeriod),
        api.getUserModels(username, activePeriod),
      ]);
      setTimeline(tl);
      setModels(mdl);
    } catch (err) {
      setError((err as Error).message || 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  }, [username, activePeriod?.year, activePeriod?.month]); // eslint-disable-line

  useEffect(() => { load(); }, [load]);

  // Load use cases for the current period
  const loadUseCases = useCallback(async () => {
    if (!activePeriod) return;
    setUcLoading(true); setUcError(null);
    try {
      const list = await api.getUserUseCases(username, team, activePeriod.year, activePeriod.month);
      setUseCases(list);
      // Try to fetch cached audit score for quality badge (no-op if audit not run)
      const score = await api.getAuditScore(team, username, activePeriod.year, activePeriod.month);
      setAuditScore(score);
    } catch {
      setUcError('No se pudieron cargar los casos de uso.');
    } finally {
      setUcLoading(false);
    }
  }, [username, team, activePeriod?.year, activePeriod?.month]); // eslint-disable-line

  useEffect(() => { loadUseCases(); }, [loadUseCases]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  const handleUCUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activePeriod) return;
    e.target.value = '';
    const normalizedName = file.name.replace(/ /g, '_');
    if (useCases.some(uc => uc.filename === normalizedName)) {
      setUcError(`El archivo '${normalizedName}' ya existe para este periodo. Elimínalo primero si deseas reemplazarlo.`);
      return;
    }
    setUcUploading(true); setUcError(null);
    try {
      await api.uploadUseCase(username, team, activePeriod.year, activePeriod.month, file);
      await loadUseCases();
    } catch (err) {
      setUcError((err as Error).message);
    } finally {
      setUcUploading(false);
    }
  };

  const handleUCDelete = async (filename: string) => {
    if (!activePeriod) return;
    if (!window.confirm(`¿Eliminar "${filename}"?`)) return;
    try {
      await api.deleteUseCase(username, team, activePeriod.year, activePeriod.month, filename);
      setUseCases(prev => prev.filter(u => u.filename !== filename));
    } catch (err) {
      setUcError((err as Error).message);
    }
  };

  const handleUCOpen = async (filename: string) => {
    if (!activePeriod) return;
    try {
      const content = await api.getUseCaseContent(username, team, activePeriod.year, activePeriod.month, filename);
      setOpenUC({ filename, content });
    } catch {
      setUcError('No se pudo cargar el archivo.');
    }
  };
  const totalRequests = models?.reduce((s, m) => s + m.totalRequests, 0) ?? 0;
  const LICENSE_COST  = 19; // $19 USD per license per month
  const activeDays    = timeline ? Object.keys(timeline.timeline).length : 0;

  const chartDates    = timeline ? Object.keys(timeline.timeline).sort() : [];
  const chartRequests = chartDates.map(d =>
    (timeline!.timeline[d] ?? []).reduce((s, e) => s + e.requests, 0)
  );

  const trendOption = {
    tooltip: { trigger: 'axis', formatter: (p: { name: string; value: number }[]) => `${p[0].name}<br/><b>${p[0].value} requests</b>` },
    grid: { top: 10, bottom: 50, left: 50, right: 20 },
    xAxis: {
      type: 'category', data: chartDates,
      axisLabel: { rotate: 40, fontSize: 10, color: theme.colors?.textSecondary, formatter: (v: string) => v.slice(5) },
      axisLine: { lineStyle: { color: theme.colors?.border } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 10, color: theme.colors?.textSecondary },
      splitLine: { lineStyle: { color: theme.colors?.border } },
    },
    series: [{ type: 'bar', data: chartRequests, barMaxWidth: 28, itemStyle: { color: theme.colors?.primary, borderRadius: [3,3,0,0] } }],
  };

  const rawByDay: Record<string, number> = {};
  if (timeline) {
    timeline.raw.forEach(r => { rawByDay[r.date] = (rawByDay[r.date] ?? 0) + r.requests; });
  }

  return (
    <>
      <Overlay onClick={onClose} />
      <Drawer>
        <DrawerHeader>
          <DrawerTitle>
            <h2>{username}</h2>
            <p>{team || 'Sin equipo asignado'} · {periodLabel}</p>
          </DrawerTitle>
          <CloseBtn onClick={onClose} title="Cerrar (Esc)">✕</CloseBtn>
        </DrawerHeader>

        <DrawerBody>
          {loading && <Spinner>Cargando datos del usuario...</Spinner>}
          {error   && <Spinner $err>{error}</Spinner>}

          {!loading && !error && (
            <>
              <KpiRow>
                <KpiCard><KpiValue>{totalRequests.toLocaleString('es-MX')}</KpiValue><KpiLabel>Requests</KpiLabel></KpiCard>
                <KpiCard><KpiValue>{activeDays}</KpiValue><KpiLabel>Días activos</KpiLabel></KpiCard>
                <KpiCard><KpiValue>{models?.length ?? 0}</KpiValue><KpiLabel>Modelos</KpiLabel></KpiCard>
                <KpiCard><KpiValue>${LICENSE_COST}.00</KpiValue><KpiLabel>Costo mensual</KpiLabel></KpiCard>
              </KpiRow>

              {models && models.length > 0 && (
                <div style={{ fontSize: '0.78rem', color: theme.colors?.textSecondary, textAlign: 'center' }}>
                  Modelo favorito: <strong style={{ color: '#1B3A5C' }}>{models[0].model}</strong>
                  {' · '}{(models[0].percentage ?? 0).toFixed(1)}% del uso total
                </div>
              )}

              {chartDates.length > 0 && (
                <Section>
                  <SectionTitle>📈 Uso diario de requests</SectionTitle>
                  <ReactECharts option={trendOption} style={{ height: '200px' }} notMerge />
                </Section>
              )}

              {models && models.length > 0 && (
                <Section>
                  <SectionTitle>🤖 Uso por modelo de IA</SectionTitle>
                  {models.map((m, i) => (
                    <ModelRow key={m.model}>
                      <div style={{ width: 140, fontSize: '0.75rem', color: theme.colors?.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }} title={m.model}>
                        {m.model}
                      </div>
                      <BarTrack><BarFill $pct={m.percentage} $color={MODEL_COLORS[i % MODEL_COLORS.length]} /></BarTrack>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: theme.colors?.textPrimary, width: 60, textAlign: 'right', flexShrink: 0 }}>{m.totalRequests.toLocaleString('es-MX')}</div>
                      <div style={{ fontSize: '0.7rem', color: theme.colors?.textSecondary, width: 44, textAlign: 'right', flexShrink: 0 }}>{(m.percentage ?? 0).toFixed(1)}%</div>
                      <div style={{ fontSize: '0.68rem', color: theme.colors?.textSecondary, width: 54, textAlign: 'right', flexShrink: 0 }}>{m.diasUso}d usados</div>
                    </ModelRow>
                  ))}
                </Section>
              )}

              {Object.keys(rawByDay).length > 0 && (
                <Section>
                  <SectionTitle>📅 Días de actividad ({Object.keys(rawByDay).length} días)</SectionTitle>
                  <DaysGrid>
                    {Object.entries(rawByDay).sort(([a],[b]) => a.localeCompare(b)).map(([date, req]) => (
                      <DayChip key={date} $level={intensityLevel(req)} title={`${date}: ${req} req`}>{date.slice(5)}</DayChip>
                    ))}
                  </DaysGrid>
                  <div style={{ padding: '0.4rem 1rem 0.7rem', fontSize: '0.68rem', color: theme.colors?.textSecondary, display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    Intensidad:
                    {[['≥200','#1B3A5C','white'],['≥100','#2563EB','white'],['≥30','#BFDBFE','#1B3A5C'],['<30','#F1F5F9','#64748B']].map(([lbl,bg,fg]) => (
                      <span key={lbl} style={{ padding: '1px 6px', borderRadius: 3, background: bg, color: fg, fontFamily: 'monospace', fontSize: '0.68rem' }}>{lbl}</span>
                    ))}
                  </div>
                </Section>
              )}

              {activeDays === 0 && <Spinner>Este usuario no tiene actividad registrada en el período seleccionado.</Spinner>}

              {/* ── Casos de uso ─────────────────────────────────────────── */}
              {activePeriod && (() => {
                const caseFiles   = useCases.filter(uc => !uc.filename.startsWith('reporte-ia'));
                const reportFiles = useCases.filter(uc => uc.filename.startsWith('reporte-ia'));
                return (
                  <>
                    <Section>
                      <UCHeader>
                        <SectionTitle style={{ padding: 0, background: 'transparent', borderBottom: 'none' }}>
                          📋 Casos de uso · <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>{team || 'Sin equipo'}</span>
                        </SectionTitle>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <UCBadge $ok={caseFiles.length >= 3}>
                            {caseFiles.length}/3 {caseFiles.length >= 3 ? '✅' : '⚠️'}
                          </UCBadge>                      {auditScore && (
                            <AuditQBadge
                              $badge={auditScore.badge as 'green' | 'yellow' | 'red'}
                              title={`Calidad de documentación: ${auditScore.scorePromedio.toFixed(1)}/5`}
                            >
                              {auditScore.badge === 'green' ? '\ud83d\udfe2' : auditScore.badge === 'yellow' ? '\ud83d\udfe1' : '\ud83d\udd34'}{' '}
                              {auditScore.scorePromedio.toFixed(1)}/5
                            </AuditQBadge>
                          )}                      <UCUploadBtn title="Subir archivo .md" onClick={() => fileInputRef.current?.click()}>
                            {ucUploading ? 'Subiendo…' : '+ Subir .md'}
                          </UCUploadBtn>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".md"
                            style={{ display: 'none' }}
                            onChange={handleUCUpload}
                          />
                        </div>
                      </UCHeader>

                      {ucError && (
                        <div style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', color: '#DC2626' }}>{ucError}</div>
                      )}

                      {ucLoading && <UCEmpty>Cargando casos de uso...</UCEmpty>}

                      {!ucLoading && caseFiles.length === 0 && (
                        <UCEmpty>Sin casos de uso para {team} · {MONTH_NAMES[(activePeriod.month || 1) - 1]} {activePeriod.year}. Se requieren 3 por equipo al mes.</UCEmpty>
                      )}

                      {!ucLoading && caseFiles.length > 0 && (
                        <UCList>
                          {caseFiles.map(uc => (
                            <UCItem key={uc.filename} onClick={() => handleUCOpen(uc.filename)}>
                              <span style={{ fontSize: '0.85rem' }}>📄</span>
                              <UCName title={uc.filename}>{uc.filename.replace(/\.md$/i, '')}</UCName>
                              <UCDate>{new Date(uc.lastModified).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</UCDate>
                            </UCItem>
                          ))}
                        </UCList>
                      )}
                    </Section>

                    {/* ── Reportes IA ──────────────────────────────────────── */}
                    {reportFiles.length > 0 && (
                      <Section>
                        <SectionTitle>🤖 Reporte IA · <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>{team || 'Sin equipo'}</span></SectionTitle>
                        <UCList>
                          {reportFiles.map(uc => (
                            <UCItem key={uc.filename} onClick={() => handleUCOpen(uc.filename)}>
                              <span style={{ fontSize: '0.85rem' }}>📊</span>
                              <UCName title={uc.filename}>{uc.filename.replace(/\.md$/i, '')}</UCName>
                              <UCDate>{new Date(uc.lastModified).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</UCDate>
                            </UCItem>
                          ))}
                        </UCList>
                      </Section>
                    )}
                  </>
                );
              })()}
            </>
          )}
        </DrawerBody>
      </Drawer>

      {/* ── Modal visor de caso de uso ──────────────────────────────────── */}
      {openUC && (
        <UCModal onClick={() => setOpenUC(null)}>
          <UCModalBox onClick={e => e.stopPropagation()}>
            <UCModalHeader>
              <UCModalTitle>{openUC.filename}</UCModalTitle>
              <UCModalClose onClick={() => setOpenUC(null)}>✕</UCModalClose>
            </UCModalHeader>
            <UCModalBody dangerouslySetInnerHTML={{ __html: renderMarkdown(openUC.content) }} />
          </UCModalBox>
        </UCModal>
      )}
    </>
  );
}
