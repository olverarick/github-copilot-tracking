import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { Button, Card, Input } from '../../styles/components';
import { useData } from '../../context/DataContext';
import api from '../../services/api';

type MsgType = 'success' | 'error' | 'warning' | 'info';
interface Msg { type: MsgType; text: string; }

const UploaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`;
const UploadSection = styled.div`
  display: flex; flex-direction: column; gap: ${({ theme }) => theme.spacing?.md};
  margin-bottom: ${({ theme }) => theme.spacing?.lg};
  &:last-child { margin-bottom: 0; }
`;
const Title = styled.h3`
  font-size: ${({ theme }) => theme.typography?.fontSize?.lg};
  font-weight: ${({ theme }) => theme.typography?.fontWeight?.semibold};
  color: ${({ theme }) => theme.colors?.textPrimary};
  margin: 0 0 ${({ theme }) => theme.spacing?.sm} 0;
`;
const Description = styled.p`
  font-size: ${({ theme }) => theme.typography?.fontSize?.sm};
  color: ${({ theme }) => theme.colors?.textSecondary};
  margin: 0 0 ${({ theme }) => theme.spacing?.md} 0;
`;
const FileInputWrapper = styled.div`
  display: flex; gap: ${({ theme }) => theme.spacing?.sm};
  align-items: center; flex-wrap: wrap;
`;
const FileInputLabel = styled.label<{ 'aria-disabled'?: boolean }>`
  display: inline-block; padding: 0.5rem 1rem;
  background-color: ${({ theme }) => theme.colors?.primary};
  color: white; border-radius: ${({ theme }) => theme.borderRadius?.md};
  cursor: pointer; font-size: ${({ theme }) => theme.typography?.fontSize?.sm};
  font-weight: ${({ theme }) => theme.typography?.fontWeight?.medium};
  transition: background-color 0.2s;
  &:hover { background-color: ${({ theme }) => theme.colors?.primaryDark}; }
  &[aria-disabled='true'] { background-color: #e0e0e0; cursor: not-allowed; }
`;
const HiddenInput = styled.input`
  position: absolute; width: 1px; height: 1px; padding: 0;
  margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
`;
const FileName = styled.span`
  font-size: ${({ theme }) => theme.typography?.fontSize?.sm};
  color: ${({ theme }) => theme.colors?.textSecondary}; font-style: italic;
`;
const Message = styled.div<{ $type: MsgType }>`
  padding: ${({ theme }) => theme.spacing?.md};
  border-radius: ${({ theme }) => theme.borderRadius?.md};
  font-size: ${({ theme }) => theme.typography?.fontSize?.sm};
  ${({ $type }) => {
    if ($type === 'success') return 'background:#e8f5e9;color:#4caf50;border-left:4px solid #4caf50;';
    if ($type === 'error')   return 'background:#ffebee;color:#f44336;border-left:4px solid #f44336;';
    if ($type === 'warning') return 'background:#fffbeb;color:#92400e;border-left:4px solid #f59e0b;';
    return 'background:#e3f2fd;color:#2196f3;border-left:4px solid #2196f3;';
  }}
`;
const Divider = styled.hr`
  border: none; border-top: 1px solid ${({ theme }) => theme.colors?.border};
  margin: ${({ theme }) => theme.spacing?.xl} 0;
`;

const DataUploader = React.forwardRef<HTMLDivElement>((_, ref) => {
  const { uploadPremiumRequests, uploadTeamCsv } = useData();
  const [premiumFile,    setPremiumFile]    = useState<File | null>(null);
  const [teamFile,       setTeamFile]       = useState<File | null>(null);
  const [teamName,       setTeamName]       = useState('');
  const [teamYear,       setTeamYear]       = useState(new Date().getFullYear());
  const [uploading,      setUploading]      = useState(false);
  const [message,        setMessage]        = useState<Msg | null>(null);
  const [dupWarning,     setDupWarning]     = useState<string | null>(null);
  const premiumRef = useRef<HTMLInputElement>(null);
  const teamRef    = useRef<HTMLInputElement>(null);

  const handlePremiumUpload = async () => {
    if (!premiumFile) return;
    setUploading(true); setMessage(null);
    try {
      const r = await uploadPremiumRequests(premiumFile);
      setMessage({ type: 'success', text: r.message || 'Archivo subido exitosamente' });
      setPremiumFile(null);
      if (premiumRef.current) premiumRef.current.value = '';
    } catch (e) {
      setMessage({ type: 'error', text: (e as Error).message || 'Error al subir archivo' });
    } finally { setUploading(false); }
  };

  const doTeamUpload = async () => {
    if (!teamFile) return;
    setDupWarning(null); setUploading(true); setMessage(null);
    try {
      const r = await uploadTeamCsv(teamFile, teamName, teamYear);
      setMessage({ type: 'success', text: r.message || 'Equipo actualizado exitosamente' });
      setTeamFile(null); setTeamName('');
      if (teamRef.current) teamRef.current.value = '';
    } catch (e) {
      setMessage({ type: 'error', text: (e as Error).message || 'Error al subir equipo' });
    } finally { setUploading(false); }
  };

  const handleTeamUpload = async () => {
    if (!teamFile)         { setMessage({ type: 'error', text: 'Selecciona un archivo CSV.' }); return; }
    if (!teamName.trim())  { setMessage({ type: 'error', text: 'Especifica el nombre del equipo.' }); return; }
    setMessage(null);
    try {
      const teams = await api.getTeams();
      const exists = teams.some(t => t.team.toLowerCase() === teamName.trim().toLowerCase());
      if (exists) { setDupWarning(teamName.trim()); return; }
    } catch { /* proceed */ }
    await doTeamUpload();
  };

  return (
    <UploaderContainer ref={ref}>
      {message && <Message $type={message.type}>{message.text}</Message>}

      {dupWarning && (
        <Message $type="warning" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:'1rem', flexWrap:'wrap' }}>
          <span>⚠️ El equipo <strong>{dupWarning}</strong> ya existe. ¿Actualizar integrantes y licencias?</span>
          <span style={{ display:'flex', gap:'0.5rem' }}>
            <Button variant="primary" onClick={doTeamUpload} disabled={uploading}>Sí, actualizar</Button>
            <Button variant="default" onClick={() => setDupWarning(null)} disabled={uploading}>Cancelar</Button>
          </span>
        </Message>
      )}

      <UploadSection>
        <Title>📊 Importar Premium Requests</Title>
        <Description>Sube el CSV de GitHub Copilot Premium Requests. El sistema valida duplicados automáticamente.</Description>
        <FileInputWrapper>
          <HiddenInput id="premium-csv-input" ref={premiumRef} type="file" accept=".csv"
            onChange={e => e.target.files?.[0] && setPremiumFile(e.target.files[0])} />
          <FileInputLabel htmlFor="premium-csv-input" aria-disabled={uploading}>Seleccionar archivo</FileInputLabel>
          {premiumFile && <FileName>{premiumFile.name}</FileName>}
          {premiumFile && (
            <Button variant="primary" onClick={handlePremiumUpload} disabled={uploading}>
              {uploading ? 'Subiendo...' : 'Subir CSV'}
            </Button>
          )}
        </FileInputWrapper>
      </UploadSection>

      <Divider />

      <UploadSection>
        <Title>👥 Importar Equipo</Title>
        <Description>Sube el CSV de un equipo (nombre, usuario, correo).</Description>
        <FileInputWrapper>
          <Input type="text" placeholder="Nombre del equipo (ej: IKTAN)" value={teamName}
            onChange={e => setTeamName(e.target.value)} />
          <Input type="number" placeholder="Año" value={teamYear} min={2020} max={2100}
            style={{ width: '110px' }} onChange={e => setTeamYear(parseInt(e.target.value, 10) || new Date().getFullYear())} />
        </FileInputWrapper>
        <FileInputWrapper>
          <HiddenInput id="team-csv-input" ref={teamRef} type="file" accept=".csv"
            onChange={e => e.target.files?.[0] && setTeamFile(e.target.files[0])} />
          <FileInputLabel htmlFor="team-csv-input" aria-disabled={uploading}>Seleccionar archivo</FileInputLabel>
          {teamFile && <FileName>{teamFile.name}</FileName>}
          {teamFile && (
            <Button variant="primary" onClick={handleTeamUpload}
              disabled={uploading || !teamName.trim()}
              title={!teamName.trim() ? 'Escribe el nombre del equipo primero' : ''}>
              {uploading ? 'Subiendo...' : 'Subir Equipo'}
            </Button>
          )}
        </FileInputWrapper>
      </UploadSection>
    </UploaderContainer>
  );
});

DataUploader.displayName = 'DataUploader';
export default DataUploader;
