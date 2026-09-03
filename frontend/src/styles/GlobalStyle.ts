import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Source Sans 3', 'Source Sans Pro', ${({ theme }) => theme.typography.fontFamily};
    font-size: ${({ theme }) => theme.typography.fontSize.sm}; /* 14px base DS */
    line-height: ${({ theme }) => theme.typography.lineHeight.normal};
    color: ${({ theme }) => theme.colors.textPrimary};
    background-color: ${({ theme }) => theme.colors.background};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  h1, h2, h3, h4, h5, h6 {
    font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
    line-height: ${({ theme }) => theme.typography.lineHeight.tight};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
  h1 { font-size: ${({ theme }) => theme.typography.fontSize['4xl']}; }
  h2 { font-size: ${({ theme }) => theme.typography.fontSize['3xl']}; }
  h3 { font-size: ${({ theme }) => theme.typography.fontSize['2xl']}; }
  h4 { font-size: ${({ theme }) => theme.typography.fontSize.xl}; }
  h5 { font-size: ${({ theme }) => theme.typography.fontSize.lg}; }
  h6 { font-size: ${({ theme }) => theme.typography.fontSize.base}; }
  a {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: none;
    transition: color ${({ theme }) => theme.transitions.fast};
    &:hover { color: ${({ theme }) => theme.colors.primaryDark}; }
  }
  button { font-family: inherit; cursor: pointer; }
  input, textarea, select { font-family: inherit; }
`;
