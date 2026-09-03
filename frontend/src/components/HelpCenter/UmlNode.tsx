import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import styled from 'styled-components';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Field {
  name: string;
  type: string;
  pk: boolean;
  unique: boolean;
  required: boolean;
  description: string;
}

export interface Entity {
  id: string;
  label: string;
  color: string;
  description: string;
  fields: Field[];
}

export type UmlEntityNodeType = Node<{ entity: Entity }, 'umlEntity'>;

// ── Styled components ─────────────────────────────────────────────────────────

const Wrapper = styled.div<{ $color: string; $selected: boolean }>`
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
  min-width: 230px;
  max-width: 230px;
  border: 2px solid ${p => p.$selected ? '#0077C8' : '#bbb'};
  box-shadow: ${p => p.$selected
    ? '0 0 0 3px rgba(0,119,200,0.18), 0 4px 16px rgba(0,0,0,0.14)'
    : '0 2px 8px rgba(0,0,0,0.10)'};
  cursor: pointer;
  font-family: 'Montserrat', -apple-system, sans-serif;
  transition: border-color 0.15s, box-shadow 0.15s;
`;

const Header = styled.div<{ $color: string }>`
  background: ${p => p.$color};
  padding: 7px 10px 6px;
  font-weight: 700;
  font-size: 11.5px;
  color: #1a1a2e;
  border-bottom: 1.5px solid rgba(0,0,0,0.12);
  letter-spacing: 0.01em;
`;

const Body = styled.div`
  background: #fff;
  padding: 3px 0 4px;
`;

const FieldRow = styled.div`
  display: flex;
  align-items: center;
  padding: 2px 10px;
  gap: 5px;
  font-size: 10px;
  min-height: 20px;
  &:hover { background: #f4f8fc; }
`;

const FieldName = styled.span<{ $pk: boolean }>`
  font-family: 'Courier New', monospace;
  font-weight: ${p => p.$pk ? 700 : 400};
  color: ${p => p.$pk ? '#1a3a5c' : '#333'};
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const FieldType = styled.span`
  font-family: 'Courier New', monospace;
  color: #888;
  font-size: 9px;
  white-space: nowrap;
  flex-shrink: 0;
`;

const Badge = styled.span<{ $v: 'pk' | 'uk' }>`
  font-size: 8px;
  font-weight: 800;
  padding: 1px 4px;
  border-radius: 3px;
  letter-spacing: 0.03em;
  flex-shrink: 0;
  background: ${p => p.$v === 'pk' ? '#e67e22' : '#8e44ad'};
  color: #fff;
`;

const Divider = styled.div`
  height: 1px;
  background: #f0f0f0;
  margin: 2px 0;
`;

// ── Component ─────────────────────────────────────────────────────────────────

function UmlNode({ data, selected }: NodeProps<UmlEntityNodeType>) {
  const { entity } = data;
  const pkFields  = entity.fields.filter(f => f.pk);
  const restFields = entity.fields.filter(f => !f.pk);

  return (
    <>
      {/* Target handles — invisible, for incoming edges */}
      <Handle type="target" position={Position.Left}   style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Top}    style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Right}  style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Bottom} style={{ opacity: 0 }} />

      <Wrapper $color={entity.color} $selected={!!selected}>
        <Header $color={entity.color}>{entity.label}</Header>
        <Body>
          {pkFields.map(f => (
            <FieldRow key={f.name}>
              <Badge $v="pk">PK</Badge>
              <FieldName $pk>{f.name}</FieldName>
              <FieldType>{f.type}</FieldType>
            </FieldRow>
          ))}

          {pkFields.length > 0 && restFields.length > 0 && <Divider />}

          {restFields.map(f => (
            <FieldRow key={f.name}>
              {f.unique && <Badge $v="uk">UK</Badge>}
              {!f.unique && <span style={{ width: 20, flexShrink: 0 }} />}
              <FieldName $pk={false}>{f.name}</FieldName>
              <FieldType>{f.type}</FieldType>
            </FieldRow>
          ))}
        </Body>
      </Wrapper>

      {/* Source handles — invisible, for outgoing edges */}
      <Handle type="source" position={Position.Left}   style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Top}    style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right}  style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </>
  );
}

export default UmlNode;
