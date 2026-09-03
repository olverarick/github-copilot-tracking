import React from 'react';
import styled from 'styled-components';
import DashboardKPIs from '../DashboardKPIs';
import DailyTrendChart from '../Charts/DailyTrendChart';
import TopTeamsChart from '../Charts/TopTeamsChart';
import InsightsPanel from '../InsightsPanel';
import LowUsageTable from '../LowUsageTable';
import UsageLevelDonut from '../Charts/UsageLevelDonut';
import LicenseSummary from '../LicenseSummary';
import RecentActivity from '../RecentActivity';
import QuickActions from '../QuickActions';
import UsageQuartileChart from '../Charts/UsageQuartileChart';
import LicenseOptimizationPanel from '../Charts/LicenseOptimizationPanel';
import LowUsageByTeamChart from '../Charts/LowUsageByTeamChart';
import UseCaseComplianceChart from '../Charts/UseCaseComplianceChart';

const Col3 = styled.div<{ $cols?: string }>`
  display: grid;
  grid-template-columns: ${({ $cols }) => $cols ?? '2.2fr 1.5fr 1.2fr'};
  gap: 1rem;
  margin-bottom: 1rem;
`;

const Col2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1rem;
  margin-bottom: 1rem;
`;

interface Props {
  onNavigate: (tab: string) => void;
}

const Dashboard: React.FC<Props> = ({ onNavigate }) => (
  <div>
    {/* Row 1 — KPIs: estado general del programa */}
    <DashboardKPIs />

    {/* Row 2 — Tendencia · Alertas · Costo de licencias
        ¿Qué está pasando? ¿Qué requiere atención ahora? ¿Cuánto cuesta? */}
    <Col3>
      <DailyTrendChart />
      <InsightsPanel />
      <LicenseSummary onNavigate={onNavigate} />
    </Col3>

    {/* Row 3 — Equipos con bajo uso · Cumplimiento casos de uso · Optimización · Distribución
        ¿Dónde están los problemas? ¿Quién no registra casos? ¿Qué licencias liberar? ¿Cómo está el grupo? */}
    <Col3 $cols="1.5fr 1.5fr 1.5fr 1.2fr">
      <LowUsageByTeamChart />
      <UseCaseComplianceChart />
      <LicenseOptimizationPanel />
      <UsageLevelDonut />
    </Col3>

    {/* Row 4 — Usuarios específicos · Actividad reciente · Acciones inmediatas
        ¿A quién contactar? ¿Qué cambió? ¿Qué puedo hacer ahora? */}
    <Col3 $cols="2fr 1.5fr 1fr">
      <LowUsageTable onViewAll={() => onNavigate('usuarios')} />
      <RecentActivity onViewAll={() => onNavigate('usuarios')} />
      <QuickActions onNavigate={onNavigate} />
    </Col3>

    {/* Row 5 — Eficiencia por equipo · Distribución cuartil
        Análisis profundo y comparativo para reportes */}
    <Col2>
      <TopTeamsChart />
      <UsageQuartileChart />
    </Col2>
  </div>
);

export default Dashboard;
