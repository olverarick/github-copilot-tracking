import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  MarkerType,
  type Node,
  type Edge,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import styled from 'styled-components';
import UmlNode, { type Entity, type Field, type UmlEntityNodeType } from './UmlNode';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Relation {
  from: string;
  fromField: string;
  to: string;
  toField: string;
  cardinality: string;
  label: string;
}

// ── Styled components ─────────────────────────────────────────────────────────

const Container = styled.div`
  display: flex;
  gap: 0;
  height: calc(100vh - 170px);
  min-height: 500px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #E5E7EB;
  background: #fff;
`;

const CanvasWrapper = styled.div`
  flex: 1;
  min-width: 0;
`;

const Panel = styled.aside`
  width: 320px;
  flex-shrink: 0;
  border-left: 1px solid #E5E7EB;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 10px;
  border-bottom: 1px solid #F3F4F6;
  flex-shrink: 0;
`;

const PanelTitle = styled.h2`
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: #111827;
  font-family: 'Montserrat', sans-serif;
`;

const TableBadge = styled.span<{ $color: string }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  background: ${p => p.$color};
  color: #1a1a2e;
  font-family: 'Courier New', monospace;
`;

const CloseBtn = styled.button`
  width: 22px;
  height: 22px;
  border: none;
  background: #F3F4F6;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6B7280;
  font-size: 12px;
  padding: 0;
  line-height: 1;
  flex-shrink: 0;
  &:hover { background: #E5E7EB; }
`;

const PanelBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px;
`;

const Description = styled.p`
  font-size: 11.5px;
  color: #4B5563;
  line-height: 1.6;
  margin: 0 0 14px;
`;

const SectionLabel = styled.div`
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #9CA3AF;
  margin-bottom: 6px;
`;

const FieldTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 10.5px;
`;

const Th = styled.th`
  text-align: left;
  padding: 4px 6px;
  background: #F9FAFB;
  color: #374151;
  font-weight: 600;
  border-bottom: 1px solid #E5E7EB;
  font-size: 10px;
  font-family: 'Montserrat', sans-serif;
`;

const Td = styled.td<{ $muted?: boolean }>`
  padding: 4px 6px;
  border-bottom: 1px solid #F3F4F6;
  vertical-align: top;
  color: ${p => p.$muted ? '#9CA3AF' : '#111827'};
  font-family: ${p => p.$muted ? 'inherit' : "'Courier New', monospace"};
  line-height: 1.4;
`;

const FBadge = styled.span<{ $v: 'pk' | 'uk' | 'req' }>`
  font-size: 8px;
  font-weight: 800;
  padding: 1px 4px;
  border-radius: 3px;
  letter-spacing: 0.03em;
  display: inline-block;
  background: ${p => p.$v === 'pk' ? '#e67e22' : p.$v === 'uk' ? '#8e44ad' : '#27ae60'};
  color: #fff;
  margin-left: 3px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 10px;
  color: #9CA3AF;
  text-align: center;
  padding: 2rem;
`;

const EmptyIcon = styled.div`font-size: 2.5rem; line-height: 1;`;
const EmptyText = styled.p`font-size: 12px; margin: 0; line-height: 1.6;`;

// Memoize nodeTypes outside component to avoid re-renders
const NODE_TYPES: NodeTypes = { umlEntity: UmlNode };

// ── Main component ─────────────────────────────────────────────────────────────

export default function HelpCenter() {
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Use extended model that includes positions
  const [extModel, setExtModel] = useState<{ entities: (Entity & { x: number; y: number })[]; relations: Relation[] } | null>(null);

  useEffect(() => {
    fetch('/data-model.xml')
      .then(r => r.text())
      .then(text => {
        const doc = new DOMParser().parseFromString(text, 'text/xml');
        const entities = Array.from(doc.querySelectorAll('entity')).map(el => ({
          id:          el.getAttribute('id')    ?? '',
          label:       el.getAttribute('label') ?? '',
          color:       el.getAttribute('color') ?? '#eee',
          description: el.querySelector('description')?.textContent?.trim() ?? '',
          x:           parseFloat(el.getAttribute('x') ?? '0'),
          y:           parseFloat(el.getAttribute('y') ?? '0'),
          fields: Array.from(el.querySelectorAll('field')).map(f => ({
            name:        f.getAttribute('name')        ?? '',
            type:        f.getAttribute('type')        ?? '',
            pk:          f.getAttribute('pk')          === 'true',
            unique:      f.getAttribute('unique')      === 'true',
            required:    f.getAttribute('required')    === 'true',
            description: f.getAttribute('description') ?? '',
          } as Field)),
        }));
        const relations = Array.from(doc.querySelectorAll('relation')).map(el => ({
          from:        el.getAttribute('from')        ?? '',
          fromField:   el.getAttribute('fromField')   ?? '',
          to:          el.getAttribute('to')          ?? '',
          toField:     el.getAttribute('toField')     ?? '',
          cardinality: el.getAttribute('cardinality') ?? '',
          label:       el.getAttribute('label')       ?? '',
        }));
        setExtModel({ entities, relations });
      })
      .catch(e => setError(String(e)));
  }, []);

  const flowNodes: Node[] = useMemo(() => {
    if (!extModel) return [];
    return extModel.entities.map(e => ({
      id:       e.id,
      type:     'umlEntity',
      position: { x: e.x, y: e.y },
      data:     { entity: e as Entity },
    } as UmlEntityNodeType));
  }, [extModel]);

  const flowEdges: Edge[] = useMemo(() => {
    if (!extModel) return [];
    return extModel.relations.map((rel, i) => ({
      id:     `edge-${i}`,
      source: rel.from,
      target: rel.to,
      type:   'smoothstep',
      label:  `${rel.cardinality}  ${rel.label}`,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#666', width: 14, height: 14 },
      style:       { stroke: '#777', strokeWidth: 1.5 },
      labelStyle:  { fontSize: 10, fill: '#444', fontFamily: 'Montserrat, sans-serif', fontWeight: 500 },
      labelBgStyle:     { fill: '#fff', fillOpacity: 0.88 },
      labelBgPadding:   [5, 3] as [number, number],
      labelBgBorderRadius: 3,
    }));
  }, [extModel]);

  const [rfNodes, setRfNodes] = useState<Node[]>([]);
  const [rfEdges, setRfEdges] = useState<Edge[]>([]);

  useEffect(() => { setRfNodes(flowNodes); }, [flowNodes]);
  useEffect(() => { setRfEdges(flowEdges); }, [flowEdges]);

  const onNodeClick = useCallback((_evt: React.MouseEvent, node: Node) => {
    const entity = extModel?.entities.find(e => e.id === node.id) ?? null;
    setSelectedEntity(entity as Entity | null);
  }, [extModel]);

  const onPaneClick = useCallback(() => {
    setSelectedEntity(null);
  }, []);

  if (error) {
    return (
      <Container style={{ alignItems: 'center', justifyContent: 'center' }}>
        <EmptyState>
          <EmptyIcon>⚠️</EmptyIcon>
          <EmptyText>No se pudo cargar <code>data-model.xml</code>:<br/>{error}</EmptyText>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <CanvasWrapper>
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={NODE_TYPES}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.3}
          maxZoom={2.5}
          proOptions={{ hideAttribution: true }}
        >
          <Controls showInteractive={false} />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e0e0e0" />
        </ReactFlow>
      </CanvasWrapper>

      <Panel>
        {selectedEntity ? (
          <>
            <PanelHeader>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                <PanelTitle>Propiedades</PanelTitle>
                <TableBadge $color={selectedEntity.color}>{selectedEntity.label}</TableBadge>
              </div>
              <CloseBtn onClick={() => setSelectedEntity(null)} title="Cerrar">✕</CloseBtn>
            </PanelHeader>
            <PanelBody>
              {selectedEntity.description && (
                <Description>{selectedEntity.description}</Description>
              )}

              <SectionLabel>Campos ({selectedEntity.fields.length})</SectionLabel>
              <FieldTable>
                <thead>
                  <tr>
                    <Th>Campo</Th>
                    <Th>Tipo</Th>
                    <Th>Descripción</Th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEntity.fields.map(f => (
                    <tr key={f.name}>
                      <Td>
                        {f.name}
                        {f.pk       && <FBadge $v="pk">PK</FBadge>}
                        {f.unique   && !f.pk && <FBadge $v="uk">UK</FBadge>}
                        {f.required && !f.pk && !f.unique && <FBadge $v="req">NN</FBadge>}
                      </Td>
                      <Td>{f.type}</Td>
                      <Td $muted>{f.description || '—'}</Td>
                    </tr>
                  ))}
                </tbody>
              </FieldTable>
            </PanelBody>
          </>
        ) : (
          <EmptyState>
            <EmptyIcon>🗂️</EmptyIcon>
            <EmptyText>
              Haz clic en una entidad del diagrama para ver sus campos y propiedades.
            </EmptyText>
          </EmptyState>
        )}
      </Panel>
    </Container>
  );
}
