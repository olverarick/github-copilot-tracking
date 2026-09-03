import React from 'react';
import styled from 'styled-components';

const Wrap = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.1rem 1.25rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.07);
  border: 1px solid #F3F4F6;
  display: flex;
  flex-direction: column;
`;

const Title = styled.h3`
  font-size: 0.82rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.875rem;
`;

const ActionItem = styled.button<{ $bg: string }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: none;
  border: 1px solid #F3F4F6;
  border-radius: 10px;
  padding: 0.75rem 0.875rem;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: border-color 0.15s, box-shadow 0.15s;
  margin-bottom: 0.5rem;
  &:last-child { margin-bottom: 0; }
  &:hover {
    border-color: #BFDBFE;
    box-shadow: 0 2px 6px rgba(0,0,0,0.06);
  }
`;

const IconCircle = styled.div<{ $bg: string }>`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: ${({ $bg }) => $bg};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
`;

const TextGroup = styled.div`
  flex: 1;
  min-width: 0;
`;

const ActionTitle = styled.div`
  font-size: 0.8rem;
  font-weight: 600;
  color: #111827;
`;

const ActionDesc = styled.div`
  font-size: 0.71rem;
  color: #6B7280;
  margin-top: 1px;
`;

const Arrow = styled.span`
  color: #9CA3AF;
  font-size: 1.1rem;
  flex-shrink: 0;
`;

const ACTIONS = [
  {
    icon: '📄',
    bg: '#EBF5FF',
    title: 'Generar reporte mensual',
    desc: 'Descargar reporte completo del mes',
    tab: 'reportes',
  },
  {
    icon: '👥',
    bg: '#F0FDF4',
    title: 'Asignar licencias',
    desc: 'Gestionar asignación de licencias',
    tab: 'licenses',
  },
  {
    icon: '✨',
    bg: '#FFF7ED',
    title: 'Ver recomendaciones',
    desc: 'Sugerencias para optimizar uso',
    tab: 'usuarios',
  },
] as const;

interface Props {
  onNavigate: (tab: string) => void;
}

const QuickActions = React.forwardRef<HTMLDivElement, Props>(({ onNavigate }, ref) => (
  <Wrap ref={ref}>
    <Title>Acciones rápidas</Title>
    {ACTIONS.map(a => (
      <ActionItem key={a.tab} $bg={a.bg} onClick={() => onNavigate(a.tab)}>
        <IconCircle $bg={a.bg}>{a.icon}</IconCircle>
        <TextGroup>
          <ActionTitle>{a.title}</ActionTitle>
          <ActionDesc>{a.desc}</ActionDesc>
        </TextGroup>
        <Arrow>›</Arrow>
      </ActionItem>
    ))}
  </Wrap>
));

QuickActions.displayName = 'QuickActions';
export default QuickActions;
