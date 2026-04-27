// WaveLab Design Tokens (DS-01)
// Source of truth for the PAGASA Wave visual system.
// Keep this file framework-agnostic so styled-components, Tailwind config,
// and future shared UI primitives can consume the same values.

export const palette = {
  pagasaBlue: '#0057B8',
  navy: '#0A2540',
  cyan: '#00C8DA',

  white: '#FFFFFF',
  black: '#000000',

  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1E293B',
  slate900: '#0F172A',
  slate950: '#020617',

  green500: '#22C55E',
  amber500: '#F59E0B',
  red500: '#EF4444',
};

export const colors = {
  brand: {
    primary: palette.pagasaBlue,
    secondary: palette.navy,
    accent: palette.cyan,
  },

  state: {
    success: palette.green500,
    warning: palette.amber500,
    error: palette.red500,
  },

  text: {
    light: {
      primary: palette.slate950,
      secondary: palette.slate600,
      muted: palette.slate500,
      inverse: palette.white,
    },
    dark: {
      primary: palette.white,
      secondary: palette.slate300,
      muted: palette.slate400,
      inverse: palette.slate950,
    },
  },

  surface: {
    light: {
      page: palette.slate50,
      raised: palette.white,
      muted: palette.slate100,
      elevated: 'rgba(255, 255, 255, 0.86)',
    },
    dark: {
      page: '#071A2A',
      raised: '#0B1E2D',
      muted: '#102A43',
      elevated: 'rgba(11, 30, 45, 0.88)',
    },
  },

  border: {
    light: {
      subtle: 'rgba(15, 23, 42, 0.08)',
      default: palette.slate200,
      strong: palette.slate300,
      focus: palette.pagasaBlue,
    },
    dark: {
      subtle: 'rgba(255, 255, 255, 0.10)',
      default: 'rgba(148, 163, 184, 0.24)',
      strong: 'rgba(148, 163, 184, 0.40)',
      focus: palette.cyan,
    },
  },

  action: {
    primary: palette.pagasaBlue,
    primaryHover: '#004A9F',
    secondary: palette.navy,
    secondaryHover: '#071A2A',
    accent: palette.cyan,
    accentHover: '#00AFC0',
    danger: palette.red500,
    dangerHover: '#DC2626',
    warning: palette.amber500,
    warningHover: '#D97706',
  },

  overlay: {
    scrim: 'rgba(2, 6, 23, 0.56)',
    scrimStrong: 'rgba(2, 6, 23, 0.72)',
    blur: 'blur(8px)',
  },

  studio: {
    panel: '#0F2A44',
    panelGlass: 'rgba(15, 42, 68, 0.82)',
    panelGlassLight: 'rgba(255, 255, 255, 0.72)',
    panelBorder: 'rgba(255, 255, 255, 0.18)',
    panelBorderLight: 'rgba(15, 23, 42, 0.12)',
    control: 'rgba(255, 255, 255, 0.08)',
    controlHover: 'rgba(255, 255, 255, 0.14)',
    controlActive: 'rgba(0, 200, 218, 0.20)',
    badge: 'rgba(0, 200, 218, 0.18)',
    badgeText: '#67E8F9',
  },
};

export const gradients = {
  primary: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${colors.brand.accent} 100%)`,
  primaryHover: `linear-gradient(135deg, ${colors.action.primaryHover} 0%, ${colors.action.accentHover} 100%)`,
  pageLight: 'linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 45%, #E0F2FE 100%)',
  pageDark: 'linear-gradient(135deg, #071A2A 0%, #0A2540 50%, #020617 100%)',
  studioPanel: 'linear-gradient(180deg, rgba(15, 42, 68, 0.92) 0%, rgba(10, 37, 64, 0.86) 100%)',
  warning: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
  danger: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
};

export const typography = {
  fontFamily: {
    sans: '"Poppins", "Segoe UI", Roboto, "Open Sans", Helvetica, Arial, sans-serif',
    system: '"Segoe UI", Roboto, "Open Sans", Helvetica, Arial, sans-serif',
    mono: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
  },
  scale: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    display: '64px',
  },
  weight: {
    thin: 100,
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.65,
  },
};

export const spacing = {
  '0': '0',
  '1': '4px',
  '2': '8px',
  '3': '12px',
  '4': '16px',
  '5': '20px',
  '6': '24px',
  '8': '32px',
  '10': '40px',
  '12': '48px',
  '16': '64px',
};

export const radius = {
  none: '0',
  xs: '2px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '20px',
  full: '9999px',
};

export const shadows = {
  none: 'none',
  sm: '0 2px 6px rgba(15, 23, 42, 0.08)',
  md: '0 8px 20px rgba(15, 23, 42, 0.12)',
  lg: '0 16px 40px rgba(15, 23, 42, 0.16)',
  xl: '0 24px 64px rgba(15, 23, 42, 0.24)',
  studioPanel: '0 18px 44px rgba(2, 6, 23, 0.28)',
  focus: '0 0 0 3px rgba(0, 87, 184, 0.24)',
  focusDark: '0 0 0 3px rgba(0, 200, 218, 0.22)',
};

export const blur = {
  sm: 'blur(4px)',
  md: 'blur(8px)',
  lg: 'blur(16px)',
  xl: 'blur(20px)',
};

export const zIndex = {
  dropdown: 50,
  stickyHeader: 999,
  modal: 1000,
  toast: 9999,
  loadingScreen: 9999,
};

export const animation = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },
  easing: {
    standard: 'ease',
    productive: 'cubic-bezier(0.2, 0, 0, 1)',
  },
};

export const tokens = {
  palette,
  colors,
  gradients,
  typography,
  spacing,
  radius,
  shadows,
  blur,
  zIndex,
  animation,
};
