export const theme = {
  colors: {
    // ── Colores principales ───────────────────────────────────────────
    primary:       '#0077C8', // azul primario
    primaryDark:   '#003057', // azul oscuro
    primaryLight:  '#EBF5FF', // fondo hover / estados activos leves

    // ── Secundarios ──────────────────────────────────────────────────
    secondary:     '#6C757D',
    secondaryDark: '#495057',
    secondaryLight:'#F5F8FA',

    // ── Estado ───────────────────────────────────────────────────────
    success:      '#198754',
    successLight: '#D1FAE5',
    warning:      '#D97706',
    warningLight: '#FEF3C7',
    error:        '#E53935',
    errorLight:   '#FEE2E2',
    info:         '#0275D8',
    infoLight:    '#EFF6FF',

    // ── Fondos y superficies ──────────────────────────────────────────
    background:   '#F5F8FA', // fondo de página
    surface:      '#FFFFFF', // fondo de tarjeta / panel
    surfaceHover: '#F9FAFB',

    // ── Texto ─────────────────────────────────────────────────────────
    textPrimary:   '#1F2937',
    textSecondary: '#6B7280',
    textDisabled:  '#ADB5BD',
    textOnPrimary: '#FFFFFF',

    // ── Bordes ────────────────────────────────────────────────────────
    border:  '#E6ECF1', // borde suave de sección
    divider: '#CBD6E2', // borde de input / separadores más definidos

    // ── Sombras ───────────────────────────────────────────────────────
    shadow:       'rgba(0, 0, 0, 0.06)',
    shadowMedium: 'rgba(0, 0, 0, 0.10)',
    shadowLarge:  'rgba(0, 0, 0, 0.16)',
  },

  spacing: {
    xs:  '0.25rem',  //  4px
    sm:  '0.5rem',   //  8px
    md:  '1rem',     // 16px
    lg:  '1.5rem',   // 24px
    xl:  '2rem',     // 32px
    xxl: '3rem',     // 48px
  },

  borderRadius: {
    sm:   '0.125rem', //  2px (botón DS: 4px → md)
    md:   '0.25rem',  //  4px — botones y controles
    lg:   '0.5rem',   //  8px — paneles / cards DS
    xl:   '0.75rem',  // 12px — cards grandes
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.06)',
    md: '0 2px 8px rgba(0, 0, 0, 0.08)',
    lg: '0 4px 12px rgba(0, 0, 0, 0.10)',
    xl: '0 8px 24px rgba(0, 0, 0, 0.14)',
  },

  typography: {
    fontFamily: '"Source Sans Pro", "Source Sans 3", system-ui, -apple-system, "Segoe UI", sans-serif',
    fontSize: {
      xs:   '0.75rem',   // 12px
      sm:   '0.875rem',  // 14px — body DS
      base: '1rem',      // 16px
      lg:   '1.125rem',  // 18px
      xl:   '1.25rem',   // 20px
      '2xl':'1.5rem',    // 24px
      '3xl':'1.875rem',  // 30px
      '4xl':'2.25rem',   // 36px
    },
    fontWeight: {
      normal:   400,
      medium:   500,
      semibold: 600,
      bold:     700,
    },
    lineHeight: {
      tight:   1.2,
      normal:  1.5,
      relaxed: 1.75,
    },
  },

  transitions: {
    fast: '150ms ease-in-out',
    base: '250ms ease-in-out',
    slow: '350ms ease-in-out',
  },
};
