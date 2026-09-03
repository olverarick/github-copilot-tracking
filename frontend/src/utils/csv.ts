// ─── Generación y descarga de CSV en el cliente ───────────────────────────────
// Delimitador: coma (RFC 4180). Si Excel en español abre el archivo en una sola
// columna, usar Datos > Desde texto/CSV y elegir coma como delimitador.

/**
 * Escapa un campo según RFC 4180: entrecomilla cuando el valor contiene coma,
 * comillas o salto de línea, y duplica las comillas internas.
 * Necesario porque Nombre puede venir como "Pérez López, Juan".
 */
export function csvField(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Arma el contenido CSV completo. Antepone un BOM UTF-8 para que Excel en
 * Windows interprete correctamente acentos y ñ sin pasar por el asistente.
 * Usa CRLF como fin de línea, según RFC 4180.
 */
export function buildCsv(headers: string[], rows: unknown[][]): string {
  const lines = [
    headers.map(csvField).join(','),
    ...rows.map(row => row.map(csvField).join(',')),
  ];
  return '﻿' + lines.join('\r\n');
}

/** Dispara la descarga de `content` con el nombre `filename`. */
export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Normaliza un texto para usarlo como parte de un nombre de archivo. */
export function slugForFilename(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .normalize('NFD')
    // Elimina los diacríticos que NFD separó (U+0300–U+036F), para que
    // "Diseño" quede "diseno" y no "dise_o".
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}
