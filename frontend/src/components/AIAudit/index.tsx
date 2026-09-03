import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import api from '../../services/api';
import { useData } from '../../context/DataContext';
import type { AuditReport, AuditUserEntry, AuditFileEntry } from '../../types';

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

const Select = styled.select`
  border: 1px solid #D1D5DB; border-radius: 6px; padding: 0.35rem 0.75rem;
  font-size: 0.78rem; font-family: inherit; color: #374151; background: white;
  cursor: pointer; outline: none;
  &:focus { border-color: #0069B4; }
`;

const PeriodBadge = styled.span`
  font-size: 0.78rem; font-weight: 600; color: #003057;
  background: #EBF5FF; border: 1px solid #BFDBFE; border-radius: 6px;
  padding: 0.3rem 0.75rem;
`;

const RunBtn = styled.button<{ $loading?: boolean }>`
  margin-left: auto;
  background: ${({ $loading }) => $loading ? '#9CA3AF' : '#7C3AED'};
  color: white; border: none; border-radius: 7px; padding: 0.45rem 1.25rem;
  font-size: 0.78rem; font-weight: 600; font-family: inherit;
  cursor: ${({ $loading }) => $loading ? 'not-allowed' : 'pointer'};
  display: flex; align-items: center; gap: 0.45rem; transition: background 0.12s;
  &:hover:not(:disabled) { background: #6D28D9; }
`;

const Spinner = styled.span`
  display: inline-block; width: 13px; height: 13px;
  border: 2px solid rgba(255,255,255,0.4); border-top-color: white;
  border-radius: 50%; animation: spin 0.7s linear infinite;
  @keyframes spin { to { transform: rotate(360deg); } }
`;

const Card = styled.div`
  background: white; border-radius: 10px; border: 1px solid #E5E7EB; padding: 1.35rem;
`;

const CardTitle = styled.h3`
  font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.07em; color: #6B7280; margin: 0 0 0.85rem;
  padding-bottom: 0.65rem; border-bottom: 1px solid #F3F4F6;
  display: flex; align-items: center; gap: 0.4rem;
`;

const TeamGrid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;
`;

const TeamCard = styled.div`
  background: white; border-radius: 10px; border: 1px solid #E5E7EB;
  padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: 0.5rem;
`;

const TeamName = styled.div`
  font-size: 0.82rem; font-weight: 700; color: #111827;
`;

const TeamStat = styled.div`
  font-size: 0.72rem; color: #6B7280;
  span { font-weight: 600; color: #374151; }
`;

// ── Badge ────────────────────────────────────────────────────────────────────

type BadgeColor = 'green' | 'yellow' | 'red';

const BADGE_STYLES: Record<BadgeColor, { bg: string; color: string; border: string; icon: string }> = {
  green:  { bg: '#DCFCE7', color: '#166534', border: '#BBF7D0', icon: '✅' },
  yellow: { bg: '#FEF9C3', color: '#854D0E', border: '#FDE68A', icon: '⚠️' },
  red:    { bg: '#FEE2E2', color: '#991B1B', border: '#FECACA', icon: '❌' },
};

const Badge = styled.span<{ $badge: BadgeColor }>`
  display: inline-flex; align-items: center; gap: 0.25rem;
  padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.68rem; font-weight: 700;
  background: ${({ $badge }) => BADGE_STYLES[$badge].bg};
  color: ${({ $badge }) => BADGE_STYLES[$badge].color};
  border: 1px solid ${({ $badge }) => BADGE_STYLES[$badge].border};
`;

const ScoreBig = styled.span<{ $badge: BadgeColor }>`
  font-size: 1.35rem; font-weight: 800;
  color: ${({ $badge }) => BADGE_STYLES[$badge].color};
`;

// ── Accordion ────────────────────────────────────────────────────────────────

const UserRow = styled.div`
  background: white; border-radius: 10px; border: 1px solid #E5E7EB; overflow: hidden;
`;

const UserHeader = styled.button`
  width: 100%; display: flex; align-items: center; gap: 0.85rem; padding: 0.85rem 1.1rem;
  background: white; border: none; cursor: pointer; font-family: inherit; text-align: left;
  transition: background 0.1s;
  &:hover { background: #F9FAFB; }
`;

const UserAvatar = styled.div`
  width: 30px; height: 30px; border-radius: 50%;
  background: linear-gradient(135deg, #1B3A5C 0%, #0f2540 100%);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.6rem; font-weight: 700; color: white; flex-shrink: 0;
`;

const UserName = styled.span`font-size: 0.8rem; font-weight: 600; color: #111827;`;
const UserTeam = styled.span`font-size: 0.68rem; color: #6B7280; margin-left: auto;`;
const ExpandIcon = styled.span<{ $open: boolean }>`
  font-size: 0.7rem; color: #9CA3AF;
  transform: ${({ $open }) => $open ? 'rotate(180deg)' : 'none'};
  transition: transform 0.15s;
`;

const UserBody = styled.div`
  padding: 0 1.1rem 1.1rem; display: flex; flex-direction: column; gap: 0.75rem;
  border-top: 1px solid #F3F4F6;
`;

// ── File entry ────────────────────────────────────────────────────────────────

const FileCard = styled.div`
  border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden;
`;

const FileHeader = styled.div`
  background: #F9FAFB; padding: 0.55rem 0.9rem;
  display: flex; align-items: center; gap: 0.75rem;
`;

const FileNameSpan = styled.span`font-size: 0.75rem; font-weight: 600; color: #374151; flex: 1;`;

const FileBody = styled.div`padding: 0.75rem 0.9rem; display: flex; flex-direction: column; gap: 0.65rem;`;

const CriteriaGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 0.35rem;
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;

const CriteriaItem = styled.div<{ $pass: boolean }>`
  display: flex; align-items: center; gap: 0.4rem;
  font-size: 0.72rem; color: ${({ $pass }) => $pass ? '#166534' : '#991B1B'};
`;

const CritIcon = styled.span<{ $pass: boolean }>`
  font-size: 0.75rem;
`;

const SectionLabel = styled.div`
  font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.06em; color: #9CA3AF; margin-bottom: 0.35rem;
`;

const CommentBox = styled.div`
  background: #F9FAFB; border-radius: 6px; padding: 0.6rem 0.85rem;
  font-size: 0.75rem; color: #374151; line-height: 1.65; font-style: italic;
  border-left: 3px solid #7C3AED;
`;

const TagRow = styled.div`display: flex; flex-wrap: wrap; gap: 0.35rem;`;
const Tag = styled.span<{ $type: 'good' | 'bad' }>`
  font-size: 0.65rem; font-weight: 600; padding: 0.15rem 0.55rem; border-radius: 20px;
  background: ${({ $type }) => $type === 'good' ? '#DCFCE7' : '#FEE2E2'};
  color: ${({ $type }) => $type === 'good' ? '#166534' : '#991B1B'};
`;

const ErrorBox = styled.div`
  background: #FEE2E2; border: 1px solid #FECACA; border-radius: 8px;
  padding: 1rem 1.25rem; color: #991B1B; font-size: 0.78rem;
`;

const EmptyState = styled.div`
  background: white; border-radius: 10px; border: 1px solid #E5E7EB;
  padding: 3rem 2rem; display: flex; flex-direction: column;
  align-items: center; gap: 0.75rem; text-align: center;
`;

// ── Constants ─────────────────────────────────────────────────────────────────

const CRITERIA_LABELS: Record<string, string> = {
  tienePromptReal: 'Prompt real incluido',
  tieneEvidenciaTecnica: 'Evidencia técnica verificable',
  problemaEspecifico: 'Problema específico y técnico',
  leccionesAccionables: 'Lecciones accionables',
  evaluacionCompleta: 'Evaluación completada',
};

function badgeOf(score: number): BadgeColor {
  if (score >= 4) return 'green';
  if (score >= 2) return 'yellow';
  return 'red';
}

function initials(name: string) {
  return name.split(/[-_]/).slice(0, 2).map(s => s[0]?.toUpperCase() ?? '').join('');
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FileEntry({ file }: { file: AuditFileEntry }) {
  const badge = badgeOf(file.score);
  return (
    <FileCard>
      <FileHeader>
        <FileNameSpan>📄 {file.nombre}</FileNameSpan>
        <Badge $badge={badge}>{BADGE_STYLES[badge].icon} {file.score}/5</Badge>
      </FileHeader>
      <FileBody>
        {/* Criteria checklist */}
        <div>
          <SectionLabel>Criterios de calidad</SectionLabel>
          <CriteriaGrid>
            {(Object.entries(file.criterios) as [string, boolean][]).map(([key, val]) => (
              <CriteriaItem key={key} $pass={val}>
                <CritIcon $pass={val}>{val ? '✓' : '✗'}</CritIcon>
                {CRITERIA_LABELS[key] ?? key}
              </CriteriaItem>
            ))}
          </CriteriaGrid>
        </div>

        {/* Code review (only if code present) */}
        {file.codeReview.tieneCodigo && (
          <div>
            <SectionLabel>Revisión de código</SectionLabel>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem' }}>
              <Badge $badge={file.codeReview.esBuenasPractica ? 'green' : 'red'}>
                {file.codeReview.esBuenasPractica ? '✅ Buenas prácticas' : '❌ Mejoras necesarias'}
              </Badge>
            </div>
            <TagRow>
              {file.codeReview.problemas.map((p, i) => <Tag key={i} $type="bad">⚠ {p}</Tag>)}
              {file.codeReview.destacados.map((d, i) => <Tag key={i} $type="good">✓ {d}</Tag>)}
            </TagRow>
          </div>
        )}

        {/* AI comment */}
        {file.comentarioIA && (
          <div>
            <SectionLabel>Comentario IA</SectionLabel>
            <CommentBox>{file.comentarioIA}</CommentBox>
          </div>
        )}
      </FileBody>
    </FileCard>
  );
}

function UserAccordion({ user }: { user: AuditUserEntry }) {
  const [open, setOpen] = useState(false);
  const badge = user.badge as BadgeColor;

  return (
    <UserRow>
      <UserHeader onClick={() => setOpen(o => !o)}>
        <UserAvatar>{initials(user.username)}</UserAvatar>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <UserName>{user.username}</UserName>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <ScoreBig $badge={badge}>{user.scorePromedio.toFixed(1)}</ScoreBig>
          <span style={{ fontSize: '0.65rem', color: '#9CA3AF' }}>/5</span>
          <Badge $badge={badge}>{BADGE_STYLES[badge].icon} {badge === 'green' ? 'Buena' : badge === 'yellow' ? 'Regular' : 'Baja'}</Badge>
          <UserTeam>{user.equipo} · {user.archivos.length} archivo{user.archivos.length !== 1 ? 's' : ''}</UserTeam>
          <ExpandIcon $open={open}>▼</ExpandIcon>
        </div>
      </UserHeader>

      {open && (
        <UserBody>
          {user.archivos.map((f, i) => <FileEntry key={i} file={f} />)}
        </UserBody>
      )}
    </UserRow>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AIAuditPanel() {
  const { filters, teams } = useData();
  const selectedPeriod = filters.selectedPeriod;
  const year  = selectedPeriod?.year  ?? new Date().getFullYear();
  const month = selectedPeriod?.month ?? new Date().getMonth() + 1;
  const [teamFilter, setTeamFilter] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-load saved audit when period or team changes
  useEffect(() => {
    let cancelled = false;
    setReport(null);
    api.getSavedAIAudit(year, month, teamFilter || undefined).then(data => {
      if (cancelled) return;
      if (data) { setReport(data); setError(null); }
    });
    return () => { cancelled = true; };
  }, [year, month, teamFilter]);

  const handleRun = async () => {
    const key = window.prompt('Ingresa la clave de autorización:');
    if (key !== '.x25,zax') {
      if (key !== null) window.alert('Clave incorrecta.');
      return;
    }
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const result = await api.generateAIAudit(year, month, teamFilter || undefined);
      setReport(result);
    } catch (err) {
      setError((err as Error).message ?? 'Error al ejecutar la auditoría');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrap>
      {/* ── Control bar ── */}
      <ControlBar>
        <CtrlLabel>Período:</CtrlLabel>
        <PeriodBadge>
          {new Date(year, month - 1).toLocaleString('es-MX', { month: 'long', year: 'numeric' })}
        </PeriodBadge>
        <CtrlLabel style={{ marginLeft: '0.5rem' }}>Equipo:</CtrlLabel>
        <Select value={teamFilter} onChange={e => setTeamFilter(e.target.value)}>
          <option value="">Todos los equipos</option>
          {teams.map(t => <option key={t.team} value={t.team}>{t.team}</option>)}
        </Select>
        <RunBtn $loading={loading} onClick={handleRun} disabled={loading}>
          {loading ? <><Spinner />Auditando...</> : <>🔍 Ejecutar Auditoría</>}
        </RunBtn>
      </ControlBar>

      {error && <ErrorBox>⚠️ {error}</ErrorBox>}

      {!report && !loading && !error && (
        <EmptyState>
          <span style={{ fontSize: '2.5rem' }}>🔍</span>
          <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#374151', margin: 0 }}>Auditoría de Calidad de Documentación</p>
          <p style={{ fontSize: '0.78rem', color: '#9CA3AF', margin: 0, maxWidth: 440, lineHeight: 1.7 }}>
            Evalúa la calidad de los casos de uso contra 5 criterios: prompt real, evidencia técnica,
            problema específico, lecciones accionables y evaluación completa. Incluye revisión de código.
          </p>
        </EmptyState>
      )}

      {report && (
        <>
          {/* ── Team summary cards ── */}
          {report.resumenEquipos.length > 0 && (
            <Card>
              <CardTitle>🏢 Resumen por Equipo</CardTitle>
              <TeamGrid>
                {report.resumenEquipos.map(t => {
                  const b = badgeOf(t.scorePromedio);
                  return (
                    <TeamCard key={t.equipo}>
                      <TeamName>{t.equipo}</TeamName>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <ScoreBig $badge={b}>{t.scorePromedio.toFixed(1)}</ScoreBig>
                        <span style={{ fontSize: '0.65rem', color: '#9CA3AF' }}>/5</span>
                        <Badge $badge={b}>{BADGE_STYLES[b].icon}</Badge>
                      </div>
                      <TeamStat>Usuarios evaluados: <span>{t.usuariosEvaluados}</span></TeamStat>
                      <TeamStat>Casos auditados: <span>{t.casosEvaluados}</span></TeamStat>
                    </TeamCard>
                  );
                })}
              </TeamGrid>
            </Card>
          )}

          {/* ── Per-user accordions ── */}
          <Card>
            <CardTitle>👤 Detalle por Desarrollador</CardTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {[...report.auditoriasUsuario]
                .sort((a, b) => b.scorePromedio - a.scorePromedio)
                .map(user => <UserAccordion key={`${user.equipo}-${user.username}`} user={user} />)}
            </div>
          </Card>
        </>
      )}
    </Wrap>
  );
}
