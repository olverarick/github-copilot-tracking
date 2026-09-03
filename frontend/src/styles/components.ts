import styled, { css } from 'styled-components';

// ── Button ────────────────────────────────────────────────────────────────────

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'default';
  $size?: 'small' | 'medium' | 'large';
}

export const Button = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme, $size = 'medium' }) => {
    if ($size === 'small') return `${theme.spacing.sm} ${theme.spacing.md}`;
    if ($size === 'large') return `${theme.spacing.lg} ${theme.spacing.xl}`;
    return `${theme.spacing.md} ${theme.spacing.lg}`;
  }};
  font-size: ${({ theme, $size = 'medium' }) => {
    if ($size === 'small') return theme.typography.fontSize.sm;
    if ($size === 'large') return theme.typography.fontSize.lg;
    return theme.typography.fontSize.base;
  }};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  white-space: nowrap;

  ${({ theme, variant = 'primary' }) => {
    if (variant === 'primary') return css`
      background-color: ${theme.colors.primary};
      color: ${theme.colors.textOnPrimary};
      &:hover:not(:disabled) { background-color: ${theme.colors.primaryDark}; box-shadow: ${theme.shadows.md}; }
    `;
    if (variant === 'secondary') return css`
      background-color: ${theme.colors.secondary};
      color: ${theme.colors.textOnPrimary};
      &:hover:not(:disabled) { background-color: ${theme.colors.secondaryDark}; box-shadow: ${theme.shadows.md}; }
    `;
    if (variant === 'outline') return css`
      background-color: transparent;
      color: ${theme.colors.primary};
      border: 1px solid ${theme.colors.primary};
      &:hover:not(:disabled) { background-color: ${theme.colors.primary}; color: ${theme.colors.textOnPrimary}; }
    `;
    return css`
      background-color: ${theme.colors.surface};
      color: ${theme.colors.textPrimary};
      border: 1px solid ${theme.colors.border};
      &:hover:not(:disabled) { background-color: ${theme.colors.surfaceHover}; border-color: ${theme.colors.primary}; }
    `;
  }}

  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &:active:not(:disabled) { transform: translateY(1px); }
`;

// ── Card ──────────────────────────────────────────────────────────────────────

export const Card = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  padding: ${({ theme }) => theme.spacing.xl};
  transition: box-shadow ${({ theme }) => theme.transitions.fast};
  &:hover { box-shadow: ${({ theme }) => theme.shadows.md}; }
`;

// ── Badge ─────────────────────────────────────────────────────────────────────

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

export const Badge = styled.span<BadgeProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  white-space: nowrap;

  ${({ theme, variant = 'default' }) => {
    if (variant === 'success') return css`background-color: ${theme.colors.successLight}; color: ${theme.colors.success};`;
    if (variant === 'warning') return css`background-color: ${theme.colors.warningLight}; color: ${theme.colors.warning};`;
    if (variant === 'error')   return css`background-color: ${theme.colors.errorLight};   color: ${theme.colors.error};`;
    if (variant === 'info')    return css`background-color: ${theme.colors.infoLight};    color: ${theme.colors.info};`;
    return css`background-color: ${theme.colors.divider}; color: ${theme.colors.textSecondary};`;
  }}
`;

// ── Table ─────────────────────────────────────────────────────────────────────

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

export const TableHead   = styled.thead`background-color: ${({ theme }) => theme.colors.background};`;
export const TableBody   = styled.tbody``;

export const TableRow = styled.tr`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  transition: background-color ${({ theme }) => theme.transitions.fast};
  &:last-child { border-bottom: none; }
  &:hover { background-color: ${({ theme }) => theme.colors.surfaceHover}; }
`;

export const TableHeader = styled.th`
  padding: ${({ theme }) => theme.spacing.md};
  text-align: left;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

export const TableCell = styled.td`
  padding: ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

// ── Input ─────────────────────────────────────────────────────────────────────

export const Input = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.textPrimary};
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  transition: all ${({ theme }) => theme.transitions.fast};
  &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20; }
  &:disabled { background-color: ${({ theme }) => theme.colors.background}; cursor: not-allowed; }
  &::placeholder { color: ${({ theme }) => theme.colors.textDisabled}; }
`;
