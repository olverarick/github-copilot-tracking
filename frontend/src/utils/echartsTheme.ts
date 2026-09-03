import { DefaultTheme } from 'styled-components';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createEchartsTheme = (theme: DefaultTheme): Record<string, any> => {
  if (!theme?.colors) {
    console.warn('⚠️ Tema INEGI no disponible');
    return {};
  }
  const c = theme.colors;
  return {
    color: [c.primary, c.secondary, c.success, c.warning, c.error, c.info],
    backgroundColor: c.background,
    textStyle: { fontFamily: theme.typography?.fontFamily, fontSize: 14, color: c.textPrimary },
    categoryAxis: {
      axisLine:  { show: true,  lineStyle: { color: c.border } },
      axisTick:  { show: true,  lineStyle: { color: c.border } },
      axisLabel: { show: true,  color: c.textSecondary },
      splitLine: { show: false },
    },
    valueAxis: {
      axisLine:  { show: true,  lineStyle: { color: c.border } },
      axisTick:  { show: true,  lineStyle: { color: c.border } },
      axisLabel: { show: true,  color: c.textSecondary },
      splitLine: { show: true,  lineStyle: { color: [c.divider] } },
    },
    tooltip: { axisPointer: { lineStyle: { color: c.border, width: 1 } } },
    legend: { textStyle: { color: c.textPrimary } },
  };
};

export const getCategoryColor = (category: string, theme: DefaultTheme): string => {
  const map: Record<string, string> = {
    'SIN USO':               theme.colors?.textSecondary || '#999',
    'USO BAJO (<40%)':       theme.colors?.warning       || '#ff9800',
    'USO MODERADO (40-70%)': theme.colors?.info          || '#2196f3',
    'USO ALTO (>70%)':       theme.colors?.success       || '#4caf50',
  };
  return map[category] ?? theme.colors?.textSecondary ?? '#999';
};
