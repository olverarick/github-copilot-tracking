import React, { useMemo } from 'react';
import styled from 'styled-components';
import { useData } from '../../context/DataContext';
import { deriveInsights, type Insight } from '../../hooks/useInsights';

type InsightType = Insight['type'];

const COLOR_MAP: Record<InsightType, { bg: string; border: string; text: string }> = {
  danger:  { bg: '#FEF2F2', border: '#EF4444', text: '#991B1B' },
  warning: { bg: '#FFFBEB', border: '#F59E0B', text: '#92400E' },
  info:    { bg: '#EFF6FF', border: '#3B82F6', text: '#1E40AF' },
  success: { bg: '#F0FDF4', border: '#22C55E', text: '#166534' },
};

const Panel = styled.section`margin-bottom: 1.25rem;`;

const PanelHeader = styled.div`
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${({ theme }) => theme.colors?.textSecondary};
  margin-bottom: 0.5rem;
`;

const Cards = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const Card = styled.div<{ $type: InsightType }>`
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.7rem 0.9rem;
  background: ${({ $type }) => COLOR_MAP[$type].bg};
  border: 1px solid ${({ $type }) => COLOR_MAP[$type].border}55;
  border-left: 3px solid ${({ $type }) => COLOR_MAP[$type].border};
  border-radius: 8px;
  flex: 1;
  min-width: 220px;
  max-width: 400px;
`;

const CardIcon = styled.span`
  font-size: 1.05rem;
  flex-shrink: 0;
  line-height: 1.3;
`;

const CardTitle = styled.div<{ $type: InsightType }>`
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ $type }) => COLOR_MAP[$type].text};
  line-height: 1.35;
`;

const CardDesc = styled.div`
  font-size: 0.71rem;
  color: ${({ theme }) => theme.colors?.textSecondary};
  margin-top: 2px;
  line-height: 1.45;
`;

export default function InsightsPanel() {
  const { users, teams, summary, loading } = useData();

  const insights = useMemo(
    () => deriveInsights(users, teams, summary),
    [users, teams, summary],
  );

  if (loading || insights.length === 0) return null;

  return (
    <Panel aria-label="Insights automáticos">
      <PanelHeader>💡 Insights automáticos</PanelHeader>
      <Cards>
        {insights.map((ins, i) => (
          <Card key={i} $type={ins.type}>
            <CardIcon>{ins.icon}</CardIcon>
            <div>
              <CardTitle $type={ins.type}>{ins.title}</CardTitle>
              <CardDesc>{ins.description}</CardDesc>
            </div>
          </Card>
        ))}
      </Cards>
    </Panel>
  );
}
