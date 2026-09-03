import React, { useState, useEffect } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import { GlobalStyle } from './styles/GlobalStyle';
import { theme } from './styles/theme';
import { DataProvider, useData } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import DataUploader from './components/DataUploader';
import Dashboard from './components/Dashboard';
import UsersTable from './components/UsersTable';
import PeriodSelector from './components/PeriodSelector';
import LicenseManager from './components/LicenseManager';
import TeamView from './components/TeamView';
import UserDrawer from './components/UserDrawer';
import TeamsSummaryTable from './components/Teams/TeamsSummaryTable';
import UseCaseCompliancePanel from './components/Teams/UseCaseCompliancePanel';
import AIReportPanel from './components/AIReport';
import AIAuditPanel from './components/AIAudit';
import HelpCenter from './components/HelpCenter';
import type { UserMetrics } from './types';

// ── Constants ─────────────────────────────────────────────────────────────────

const HEADER_H  = 48;
const SIDEBAR_W = 200;
const INST_BLUE = '#003057'; // dark primary brand color

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'dashboard' | 'usuarios' | 'licenses' | 'teams' | 'reportes' | 'config' | 'help';

// ── Nav Icons (inline SVG) ────────────────────────────────────────────────────

const IC: Record<string, React.ReactElement> = {
  dashboard: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="1" width="5.5" height="5.5" rx="1.2"/>
      <rect x="8.5" y="1" width="5.5" height="5.5" rx="1.2"/>
      <rect x="1" y="8.5" width="5.5" height="5.5" rx="1.2"/>
      <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1.2"/>
    </svg>
  ),
  teams: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5.5" cy="4.5" r="2"/>
      <path d="M1 13c0-2.5 2-4.5 4.5-4.5S10 10.5 10 13"/>
      <circle cx="11.5" cy="4" r="1.7"/>
      <path d="M13.5 12c0-2-1.3-3.3-2-3.8"/>
    </svg>
  ),
  usuarios: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="4.5" r="2.5"/>
      <path d="M1.5 13.5c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/>
    </svg>
  ),
  licenses: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="2" width="12" height="11" rx="1.5"/>
      <path d="M4.5 5.5h6M4.5 8h6M4.5 10.5h3.5"/>
    </svg>
  ),
  reportes: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="1.5" width="12" height="12" rx="1.5"/>
      <path d="M3 10.5l2.5-3.5 2 2.5 2.5-4 2.5 3"/>
    </svg>
  ),
  config: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="7.5" r="2.2"/>
      <path d="M7.5 1v1.8M7.5 12.2V14M1 7.5h1.8M12.2 7.5H14"/>
      <path d="M3.1 3.1l1.3 1.3M10.6 10.6l1.3 1.3M3.1 11.9l1.3-1.3M10.6 4.4l1.3-1.3"/>
    </svg>
  ),
  help: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="2" width="13" height="11" rx="1.5"/>
      <line x1="4" y1="5.5" x2="11" y2="5.5"/>
      <line x1="4" y1="8" x2="8" y2="8"/>
      <circle cx="11" cy="10.5" r="1.5" fill="currentColor" stroke="none"/>
    </svg>
  ),
};

const NAV_ITEMS: { id: Tab; icon: string; label: string; group: 'main' | 'system' }[] = [
  { id: 'dashboard', icon: 'dashboard', label: 'Dashboard',     group: 'main' },
  { id: 'teams',     icon: 'teams',     label: 'Equipos',       group: 'main' },
  { id: 'usuarios',  icon: 'usuarios',  label: 'Usuarios',      group: 'main' },
  { id: 'licenses',  icon: 'licenses',  label: 'Licencias',     group: 'main' },
  { id: 'reportes',  icon: 'reportes',  label: 'Reportes',      group: 'main' },
  { id: 'config',    icon: 'config',    label: 'Configuración', group: 'system' },
  { id: 'help',      icon: 'help',      label: 'Ayuda',         group: 'system' },
];

const PAGE_META: Record<Tab, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard',     subtitle: 'Resumen de uso de GitHub Copilot Premium Requests' },
  usuarios:  { title: 'Usuarios',      subtitle: 'Detalle de consumo por usuario en el período seleccionado' },
  licenses:  { title: 'Licencias',     subtitle: 'Gestión de licencias activas por mes y equipo' },
  teams:     { title: 'Equipos',       subtitle: 'Comparación y análisis de consumo por equipo' },
  reportes:  { title: 'Reportes',      subtitle: 'Análisis inteligente y auditoría de calidad con Azure OpenAI' },
  config:    { title: 'Configuración', subtitle: 'Importar datos de uso y equipos al sistema' },
  help:      { title: 'Ayuda',         subtitle: 'Modelo de datos y referencia del sistema' },
};

const SHOW_PERIOD: Tab[] = ['dashboard', 'usuarios', 'teams', 'reportes'];

// ── App Shell ─────────────────────────────────────────────────────────────────

const AppShell = styled.div`
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #F0F2F5;
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
`;

// ── Institutional Header ──────────────────────────────────────────────────────

const AppHeader = styled.header`
  height: ${HEADER_H}px;
  background: ${INST_BLUE};
  display: flex;
  align-items: center;
  padding: 0 1.25rem;
  gap: 0.75rem;
  position: sticky;
  top: 0;
  z-index: 300;
  box-shadow: 0 2px 6px rgba(0,0,0,0.22);
  flex-shrink: 0;
`;

const LogoMark = styled.div`
  width: 32px;
  height: 32px;
  background: ${({ theme }) => theme.colors.primary};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.68rem;
  font-weight: 800;
  flex-shrink: 0;
  letter-spacing: -0.5px;
`;

const BrandBlock = styled.div`display: flex; flex-direction: column; gap: 1px;`;
const BrandName = styled.span`font-size: 0.84rem; font-weight: 700; color: white; letter-spacing: -0.015em; line-height: 1;`;
const BrandSub  = styled.span`font-size: 0.63rem; color: rgba(255,255,255,0.45); letter-spacing: 0.02em; line-height: 1;`;

const HVDivider = styled.div`width: 1px; height: 22px; background: rgba(255,255,255,0.15); margin: 0 0.1rem;`;
const HSpacer   = styled.div`flex: 1;`;
const HRight    = styled.div`display: flex; align-items: center; gap: 0.75rem;`;

const LastUpdatedTag = styled.div`font-size: 0.67rem; color: rgba(255,255,255,0.42);`;

const HImportBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.85rem;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  color: rgba(255,255,255,0.88);
  border-radius: 5px;
  font-size: 0.73rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  font-family: inherit;
  transition: background 0.15s;
  &:hover { background: rgba(255,255,255,0.18); }
`;

// ── App Body ──────────────────────────────────────────────────────────────────

const AppBody = styled.div`display: flex; flex: 1; min-height: 0;`;

// ── Sidebar ───────────────────────────────────────────────────────────────────

const Sidebar = styled.nav`
  width: ${SIDEBAR_W}px;
  flex-shrink: 0;
  background: #FFFFFF;
  border-right: 1px solid #E5E7EB;
  display: flex;
  flex-direction: column;
  position: sticky;
  top: ${HEADER_H}px;
  height: calc(100vh - ${HEADER_H}px);
  overflow-y: auto;
`;

const SidebarMain = styled.div`flex: 1; padding: 0.65rem 0;`;
const SidebarFoot = styled.div`border-top: 1px solid #F3F4F6; padding: 0.5rem 0 0.75rem;`;

const NavSectionLabel = styled.div`
  font-size: 0.61rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9CA3AF;
  padding: 0.5rem 1.1rem 0.3rem;
`;

const NavBtn = styled.button<{ $active?: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.46rem 1.1rem 0.46rem 0.93rem;
  border: none;
  border-left: 3px solid ${({ $active }) => $active ? '#0069B4' : 'transparent'};
  background: ${({ $active }) => $active ? '#EBF5FF' : 'transparent'};
  color: ${({ $active }) => $active ? '#0069B4' : '#4B5563'};
  font-size: 0.8rem;
  font-weight: ${({ $active }) => $active ? 600 : 400};
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: background 0.1s, color 0.1s, border-color 0.1s;
  &:hover {
    background: ${({ $active }) => $active ? '#EBF5FF' : '#F9FAFB'};
    color: ${({ $active }) => $active ? '#0069B4' : '#111827'};
  }
`;

const NavIconWrap = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 15px;
  flex-shrink: 0;
  opacity: 0.75;
`;

// ── Sidebar Admin Block ───────────────────────────────────────────────────────

const SidebarAdminBlock = styled.button`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.65rem 1.1rem;
  margin: 0.25rem 0.5rem 0;
  border-radius: 8px;
  background: #F8FAFF;
  border: 1px solid #E5E7EB;
  width: calc(100% - 1rem);
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: background 0.15s, border-color 0.15s;
  &:hover { background: #EBF5FF; border-color: #BFDBFE; }
`;

const AdminAvatar = styled.div<{ $authenticated?: boolean }>`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: ${({ $authenticated }) => $authenticated ? '#059669' : INST_BLUE};
  color: white;
  font-size: 0.62rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const AdminInfo = styled.div`display: flex; flex-direction: column; gap: 1px; min-width: 0; flex: 1;`;
const AdminName = styled.span`font-size: 0.73rem; font-weight: 600; color: #111827; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`;
const AdminRole = styled.span`font-size: 0.62rem; color: #6B7280;`;

const AdminLockIcon = styled.span`font-size: 0.85rem; flex-shrink: 0; color: #9CA3AF;`;

// ── Main Content ──────────────────────────────────────────────────────────────

const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow-x: hidden;
`;

const PageHeader = styled.div`
  background: #FFFFFF;
  border-bottom: 1px solid #E5E7EB;
  padding: 0.65rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  flex-shrink: 0;
`;

const PgTitleBlock = styled.div``;
const PgTitle    = styled.h1`font-size: 1.05rem; font-weight: 700; color: #111827; margin: 0 0 2px; letter-spacing: -0.015em;`;
const PgSubtitle = styled.p`font-size: 0.7rem; color: #6B7280; margin: 0;`;
const PgActions  = styled.div`display: flex; align-items: center; gap: 0.65rem;`;

const PageBody = styled.div`flex: 1; padding: 1.25rem 1.5rem; overflow-y: auto; min-height: 0;`;

// ── Dashboard grid ────────────────────────────────────────────────────────────

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
  @media (max-width: 820px) { grid-template-columns: 1fr; }
`;

const SubHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 1.25rem 0 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #E5E7EB;
`;

const SubLabel = styled.h2`
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6B7280;
  margin: 0;
`;

const BackBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.6rem;
  border: 1px solid #D1D5DB;
  border-radius: 4px;
  background: white;
  font-size: 0.72rem;
  font-weight: 500;
  cursor: pointer;
  color: #6B7280;
  font-family: inherit;
  transition: border-color 0.12s, color 0.12s;
  &:hover { border-color: #0069B4; color: #0069B4; }
`;

// ── Sub-tab bar (used inside Equipos) ────────────────────────────────────────

const SubTabBar = styled.div`
  display: flex;
  gap: 0;
  border-bottom: 2px solid #E5E7EB;
  margin-bottom: 1.25rem;
  background: white;
  border-radius: 10px 10px 0 0;
  overflow: hidden;
  border: 1px solid #E5E7EB;
`;

const SubTab = styled.button<{ $active?: boolean }>`
  padding: 0.6rem 1.25rem;
  border: none;
  border-bottom: 3px solid ${({ $active }) => $active ? '#0069B4' : 'transparent'};
  background: ${({ $active }) => $active ? '#EBF5FF' : 'white'};
  color: ${({ $active }) => $active ? '#0069B4' : '#6B7280'};
  font-size: 0.78rem;
  font-weight: ${({ $active }) => $active ? 700 : 500};
  cursor: pointer;
  white-space: nowrap;
  font-family: inherit;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
  display: flex; align-items: center; gap: 0.4rem;
  &:hover { background: ${({ $active }) => $active ? '#EBF5FF' : '#F9FAFB'}; color: ${({ $active }) => $active ? '#0069B4' : '#374151'}; }
`;

const SubTabIcon = styled.span`font-size: 0.9rem; line-height: 1;`;

// ── Configuración card ────────────────────────────────────────────────────────

const ConfigCard = styled.div`
  background: white;
  border-radius: 10px;
  border: 1px solid #E5E7EB;
  padding: 1.35rem;
`;

const ConfigCardTitle = styled.h3`
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6B7280;
  margin: 0 0 1rem;
  padding-bottom: 0.65rem;
  border-bottom: 1px solid #F3F4F6;
`;

// ── Reportes placeholder ──────────────────────────────────────────────────────

const ReportesPlaceholder = styled.div`
  background: white;
  border-radius: 10px;
  border: 1px solid #E5E7EB;
  padding: 3.5rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.85rem;
  text-align: center;
`;
const ReportesIcon  = styled.div`font-size: 2.75rem; line-height: 1;`;
const ReportesTitle = styled.h3`font-size: 1rem; font-weight: 600; color: #374151; margin: 0;`;
const ReportesDesc  = styled.p`font-size: 0.8rem; color: #9CA3AF; margin: 0; max-width: 380px; line-height: 1.7;`;

// ── Modal (shared base) ───────────────────────────────────────────────────────

const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.38);
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  backdrop-filter: blur(2px);
`;

const ModalBox = styled.div`
  background: white;
  border-radius: 10px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.9rem 1.35rem;
  border-bottom: 1px solid #E5E7EB;
  position: sticky;
  top: 0;
  background: white;
  border-radius: 10px 10px 0 0;
  z-index: 1;
`;

const ModalTitle = styled.h2`margin: 0; font-size: 0.9rem; font-weight: 700; color: #111827;`;

const ModalClose = styled.button`
  width: 26px;
  height: 26px;
  border: none;
  background: #F3F4F6;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6B7280;
  font-size: 0.85rem;
  font-family: inherit;
  &:hover { background: #E5E7EB; }
`;

const ModalBody = styled.div`padding: 1.25rem 1.35rem;`;

// ── Import Modal ──────────────────────────────────────────────────────────────

function ImportModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);
  return (
    <ModalBackdrop onClick={onClose}>
      <ModalBox onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Importar datos</ModalTitle>
          <ModalClose onClick={onClose} title="Cerrar (Esc)">✕</ModalClose>
        </ModalHeader>
        <ModalBody><DataUploader /></ModalBody>
      </ModalBox>
    </ModalBackdrop>
  );
}

// ── Login Modal ───────────────────────────────────────────────────────────────

const LoginForm = styled.form`display: flex; flex-direction: column; gap: 1rem;`;

const FormGroup = styled.div`display: flex; flex-direction: column; gap: 0.35rem;`;

const FormLabel = styled.label`font-size: 0.78rem; font-weight: 600; color: #374151;`;

const FormInput = styled.input`
  padding: 0.5rem 0.75rem;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  font-size: 0.85rem;
  font-family: inherit;
  color: #111827;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  &:focus { border-color: #0069B4; box-shadow: 0 0 0 3px rgba(0,105,180,0.12); }
`;

const FormError = styled.p`
  font-size: 0.75rem;
  color: #DC2626;
  margin: 0;
  padding: 0.5rem 0.75rem;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 6px;
`;

const SubmitBtn = styled.button<{ $loading?: boolean }>`
  padding: 0.55rem 1rem;
  background: ${INST_BLUE};
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: inherit;
  cursor: ${({ $loading }) => $loading ? 'not-allowed' : 'pointer'};
  opacity: ${({ $loading }) => $loading ? 0.7 : 1};
  transition: opacity 0.15s, background 0.15s;
  &:hover:not(:disabled) { background: #004080; }
`;

const LoginHint = styled.p`
  font-size: 0.72rem;
  color: #9CA3AF;
  margin: 0;
  text-align: center;
`;

function LoginModal({ onClose }: { onClose: () => void }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setError(null);
    setLoading(true);
    try {
      await login(username.trim(), password);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalBackdrop onClick={onClose}>
      <ModalBox style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Iniciar sesión</ModalTitle>
          <ModalClose onClick={onClose} title="Cerrar (Esc)">✕</ModalClose>
        </ModalHeader>
        <ModalBody>
          <LoginForm onSubmit={handleSubmit} autoComplete="on">
            <FormGroup>
              <FormLabel htmlFor="login-username">Usuario</FormLabel>
              <FormInput
                id="login-username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                placeholder="admin"
                required
              />
            </FormGroup>
            <FormGroup>
              <FormLabel htmlFor="login-password">Contraseña</FormLabel>
              <FormInput
                id="login-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                required
              />
            </FormGroup>
            {error && <FormError>{error}</FormError>}
            <SubmitBtn type="submit" $loading={loading} disabled={loading}>
              {loading ? 'Verificando…' : 'Entrar'}
            </SubmitBtn>
            <LoginHint>
              Las operaciones de escritura (importar datos, editar licencias, generar reportes IA) requieren autenticación.
            </LoginHint>
          </LoginForm>
        </ModalBody>
      </ModalBox>
    </ModalBackdrop>
  );
}

// ── Sidebar Admin Widget ──────────────────────────────────────────────────────

function SidebarAuthWidget({ onLoginClick }: { onLoginClick: () => void }) {
  const { isAuthenticated, user, logout } = useAuth();

  if (isAuthenticated && user) {
    const initials = user.displayName
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <SidebarAdminBlock
        onClick={logout}
        title="Cerrar sesión"
        aria-label={`Sesión activa: ${user.displayName}. Haz clic para cerrar sesión.`}
      >
        <AdminAvatar $authenticated>{initials || user.username.slice(0, 2).toUpperCase()}</AdminAvatar>
        <AdminInfo>
          <AdminName>{user.displayName}</AdminName>
          <AdminRole>{user.role}</AdminRole>
        </AdminInfo>
        <AdminLockIcon title="Cerrar sesión">↩</AdminLockIcon>
      </SidebarAdminBlock>
    );
  }

  return (
    <SidebarAdminBlock
      onClick={onLoginClick}
      title="Iniciar sesión para operaciones de escritura"
      aria-label="Iniciar sesión"
    >
      <AdminAvatar>AD</AdminAvatar>
      <AdminInfo>
        <AdminName>Iniciar sesión</AdminName>
        <AdminRole>Solo lectura</AdminRole>
      </AdminInfo>
      <AdminLockIcon>🔒</AdminLockIcon>
    </SidebarAdminBlock>
  );
}

// ── AppContent ────────────────────────────────────────────────────────────────

function AppContent() {
  const { lastUpload } = useData();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedUser, setSelectedUser] = useState<UserMetrics | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showLogin,  setShowLogin]  = useState(false);
  const [drillTeam, setDrillTeam] = useState<string | undefined>(undefined);
  const [teamsSubTab, setTeamsSubTab] = useState<'resumen' | 'licencias' | 'casos'>('resumen');
  const [reportesSubTab, setReportesSubTab] = useState<'report' | 'audit'>('report');

  const goToTab = (tab: Tab) => {
    if (tab !== 'usuarios') setDrillTeam(undefined);
    setActiveTab(tab);
  };

  const handleTeamDrillDown = (teamName: string) => {
    setDrillTeam(teamName);
    setActiveTab('usuarios');
  };

  const meta = PAGE_META[activeTab];
  const showPeriod = SHOW_PERIOD.includes(activeTab);
  const mainItems = NAV_ITEMS.filter(n => n.group === 'main');
  const sysItems  = NAV_ITEMS.filter(n => n.group === 'system');

  return (
    <AppShell>
      {/* ── Institutional Header ──────────────────────────────────────────── */}
      <AppHeader>
        <LogoMark>GC</LogoMark>
        <BrandBlock>
          <BrandName>GitHub Copilot Analytics</BrandName>
          <BrandSub>Monitoreo de Premium Requests · SSPTIC</BrandSub>
        </BrandBlock>
        <HVDivider />
        <HSpacer />
        <HRight>
          <LastUpdatedTag>
            {lastUpload?.uploadedAt
              ? `↑ Últ. importación: ${new Date(lastUpload.uploadedAt).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
              : '🔄 Datos en tiempo real'}
          </LastUpdatedTag>
          <HImportBtn onClick={() => setShowImport(true)}>↑ Importar datos</HImportBtn>
        </HRight>
      </AppHeader>

      <AppBody>
        {/* ── Sidebar ───────────────────────────────────────────────────── */}
        <Sidebar aria-label="Navegación principal">
          <SidebarMain>
            <NavSectionLabel>Menú principal</NavSectionLabel>
            {mainItems.map(item => (
              <NavBtn
                key={item.id}
                $active={activeTab === item.id}
                onClick={() => goToTab(item.id)}
                aria-current={activeTab === item.id ? 'page' : undefined}
              >
                <NavIconWrap>{IC[item.icon]}</NavIconWrap>
                {item.label}
              </NavBtn>
            ))}
          </SidebarMain>
          <SidebarFoot>
            <NavSectionLabel>Sistema</NavSectionLabel>
            {sysItems.map(item => (
              <NavBtn
                key={item.id}
                $active={activeTab === item.id}
                onClick={() => goToTab(item.id)}
                aria-current={activeTab === item.id ? 'page' : undefined}
              >
                <NavIconWrap>{IC[item.icon]}</NavIconWrap>
                {item.label}
              </NavBtn>
            ))}
            <SidebarAuthWidget onLoginClick={() => setShowLogin(true)} />
          </SidebarFoot>
        </Sidebar>

        {/* ── Main ──────────────────────────────────────────────────────── */}
        <Main>
          <PageHeader>
            <PgTitleBlock>
              <PgTitle>{meta.title}</PgTitle>
              <PgSubtitle>{meta.subtitle}</PgSubtitle>
            </PgTitleBlock>
            <PgActions>
              {showPeriod && <PeriodSelector />}
            </PgActions>
          </PageHeader>

          <PageBody>
            {/* Dashboard */}
            {activeTab === 'dashboard' && (
              <Dashboard onNavigate={(tab) => goToTab(tab as Tab)} />
            )}

            {/* Usuarios */}
            {activeTab === 'usuarios' && (
              <>
                {drillTeam && (
                  <SubHeader>
                    <BackBtn onClick={() => { setDrillTeam(undefined); setActiveTab('teams'); }}>
                      ← Equipos
                    </BackBtn>
                    <SubLabel>{drillTeam}</SubLabel>
                  </SubHeader>
                )}
                <UsersTable onUserSelect={setSelectedUser} teamFilter={drillTeam} />
              </>
            )}

            {/* Licencias */}
            {activeTab === 'licenses' && <LicenseManager />}

            {/* Equipos */}
            {activeTab === 'teams' && (
              <>
                <SubTabBar>
                  <SubTab $active={teamsSubTab === 'resumen'} onClick={() => setTeamsSubTab('resumen')}>
                    <SubTabIcon>📊</SubTabIcon> Resumen
                  </SubTab>
                  <SubTab $active={teamsSubTab === 'licencias'} onClick={() => setTeamsSubTab('licencias')}>
                    <SubTabIcon>📅</SubTabIcon> Licencias
                  </SubTab>
                  <SubTab $active={teamsSubTab === 'casos'} onClick={() => setTeamsSubTab('casos')}>
                    <SubTabIcon>📝</SubTabIcon> Casos de uso
                  </SubTab>
                </SubTabBar>

                {teamsSubTab === 'resumen'   && <TeamsSummaryTable onTeamClick={handleTeamDrillDown} />}
                {teamsSubTab === 'licencias' && <TeamView />}
                {teamsSubTab === 'casos'     && <UseCaseCompliancePanel />}
              </>
            )}

            {/* Reportes */}
            {activeTab === 'reportes' && (
              <>
                <SubTabBar>
                  <SubTab $active={reportesSubTab === 'report'} onClick={() => setReportesSubTab('report')}>
                    <SubTabIcon>🤖</SubTabIcon> Análisis de Uso
                  </SubTab>
                  <SubTab $active={reportesSubTab === 'audit'} onClick={() => setReportesSubTab('audit')}>
                    <SubTabIcon>🔍</SubTabIcon> Auditoría de Calidad
                  </SubTab>
                </SubTabBar>
                {reportesSubTab === 'report' && <AIReportPanel />}
                {reportesSubTab === 'audit'  && <AIAuditPanel />}
              </>
            )}

            {/* Ayuda */}
            {activeTab === 'help' && <HelpCenter />}

            {/* Configuración */}
            {activeTab === 'config' && (
              <ConfigCard>
                <ConfigCardTitle>Importar datos de uso y equipos</ConfigCardTitle>
                <DataUploader />
              </ConfigCard>
            )}
          </PageBody>
        </Main>
      </AppBody>

      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
      {showLogin  && <LoginModal  onClose={() => setShowLogin(false)} />}

      {selectedUser && (
        <UserDrawer
          username={selectedUser.username}
          team={selectedUser.equipo || ''}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </AppShell>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <AuthProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
