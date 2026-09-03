import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      primary: string;
      primaryDark: string;
      primaryLight: string;
      secondary: string;
      secondaryDark: string;
      secondaryLight: string;
      success: string;
      successLight: string;
      warning: string;
      warningLight: string;
      error: string;
      errorLight: string;
      danger?: string;
      dangerLight?: string;
      info: string;
      infoLight: string;
      background: string;
      surface: string;
      surfaceHover: string;
      surfaceLight?: string;
      textPrimary: string;
      textSecondary: string;
      textDisabled: string;
      textTertiary?: string;
      textOnPrimary: string;
      border: string;
      divider: string;
      shadow: string;
      shadowMedium: string;
      shadowLarge: string;
    };
    spacing: {
      xs: string; sm: string; md: string;
      lg: string; xl: string; xxl: string;
    };
    borderRadius: {
      sm: string; md: string; lg: string; xl: string; full: string;
    };
    shadows: {
      sm: string; md: string; lg: string; xl: string;
    };
    typography: {
      fontFamily: string;
      fontSize: {
        xs: string; sm: string; base: string; lg: string;
        xl: string; '2xl': string; '3xl': string; '4xl': string;
      };
      fontWeight: {
        normal: number; medium: number; semibold: number; bold: number;
      };
      lineHeight: {
        tight: number; normal: number; relaxed: number;
      };
    };
    transitions: {
      fast: string; base: string; slow: string;
    };
  }
}
