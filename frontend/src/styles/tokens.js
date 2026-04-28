// WaveLab Design Tokens (DS-01)
// Source of truth for the PAGASA Wave visual system.
// Keep this file framework-agnostic so styled-components, Tailwind config,
// and future shared UI primitives can consume the same values.

export const palette = {
  // Sampled from the PAGASA logo mark.
  pagasaCyan: '#01B0EF',
  pagasaSky: '#03C3F4',
  pagasaYellow: '#FFFE06',
  pagasaRed: '#FC050D',
  pagasaBlack: '#0C0C0C',

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
  amber500: '#FFFE06',
  red500: '#FC050D',
};

export const colors = {
  brand: {
    primary: palette.pagasaCyan,
    primaryStrong: '#00A9E8',
    secondary: palette.pagasaBlack,
    accent: palette.pagasaYellow,
    danger: palette.pagasaRed,
    sky: palette.pagasaSky,
  },

  state: {
    success: palette.green500,
    warning: palette.pagasaYellow,
    error: palette.pagasaRed,
  },

  text: {
    light: {
      primary: palette.pagasaBlack,
      secondary: '#334155',
      muted: '#64748B',
      inverse: palette.white,
      accent: '#0369A1',
    },
    dark: {
      primary: palette.white,
      secondary: '#D7F7FF',
      muted: '#91DFF6',
      inverse: palette.pagasaBlack,
      accent: palette.pagasaYellow,
    },
  },

  surface: {
    light: {
      page: '#F3FBFF',
      raised: palette.white,
      muted: '#E6F8FE',
      elevated: 'rgba(255, 255, 255, 0.88)',
      brandWash: 'rgba(1, 176, 239, 0.10)',
    },
    dark: {
      page: palette.pagasaBlack,
      raised: '#101A20',
      muted: '#122E3A',
      elevated: 'rgba(12, 12, 12, 0.88)',
      brandWash: 'rgba(1, 176, 239, 0.16)',
    },
  },

  border: {
    light: {
      subtle: 'rgba(12, 12, 12, 0.08)',
      default: 'rgba(1, 176, 239, 0.28)',
      strong: 'rgba(1, 176, 239, 0.44)',
      focus: palette.pagasaCyan,
      accent: 'rgba(255, 254, 6, 0.72)',
    },
    dark: {
      subtle: 'rgba(255, 255, 255, 0.12)',
      default: 'rgba(1, 176, 239, 0.34)',
      strong: 'rgba(3, 195, 244, 0.52)',
      focus: palette.pagasaYellow,
      accent: 'rgba(255, 254, 6, 0.78)',
    },
  },

  action: {
    primary: palette.pagasaCyan,
    primaryHover: '#00A9E8',
    secondary: palette.pagasaBlack,
    secondaryHover: '#000000',
    accent: palette.pagasaYellow,
    accentHover: '#E7E600',
    danger: palette.pagasaRed,
    dangerHover: '#D9040B',
    warning: palette.pagasaYellow,
    warningHover: '#E7E600',
  },

  overlay: {
    scrim: 'rgba(12, 12, 12, 0.56)',
    scrimStrong: 'rgba(12, 12, 12, 0.74)',
    blur: 'blur(8px)',
  },

  studio: {
    panel: '#0C0C0C',
    panelGlass: 'rgba(12, 12, 12, 0.84)',
    panelGlassLight: 'rgba(255, 255, 255, 0.76)',
    panelBorder: 'rgba(1, 176, 239, 0.28)',
    panelBorderLight: 'rgba(1, 176, 239, 0.22)',
    control: 'rgba(1, 176, 239, 0.10)',
    controlHover: 'rgba(1, 176, 239, 0.18)',
    controlActive: 'rgba(255, 254, 6, 0.24)',
    badge: 'rgba(255, 254, 6, 0.18)',
    badgeText: palette.pagasaYellow,
  },
};

export const gradients = {
  primary: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${colors.brand.sky} 48%, ${colors.brand.accent} 100%)`,
  primaryHover: `linear-gradient(135deg, ${colors.action.primaryHover} 0%, ${colors.brand.sky} 52%, ${colors.action.accentHover} 100%)`,
  pageLight: 'linear-gradient(135deg, #FFFFFF 0%, #F3FBFF 42%, #D7F4FD 100%)',
  pageDark: 'linear-gradient(135deg, #0C0C0C 0%, #102A35 48%, #01B0EF 140%)',
  studioPanel: 'linear-gradient(180deg, rgba(12, 12, 12, 0.94) 0%, rgba(16, 42, 53, 0.88) 100%)',
  pagasaSeal: 'linear-gradient(135deg, #01B0EF 0%, #03C3F4 40%, #FFFE06 72%, #FC050D 100%)',
  warning: 'linear-gradient(135deg, #FFFE06 0%, #E7E600 100%)',
  danger: 'linear-gradient(135deg, #FC050D 0%, #D9040B 100%)',
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
  sm: '0 2px 6px rgba(12, 12, 12, 0.08)',
  md: '0 8px 20px rgba(12, 12, 12, 0.12)',
  lg: '0 16px 40px rgba(12, 12, 12, 0.16)',
  xl: '0 24px 64px rgba(12, 12, 12, 0.24)',
  studioPanel: '0 18px 44px rgba(12, 12, 12, 0.30)',
  focus: '0 0 0 3px rgba(1, 176, 239, 0.26)',
  focusDark: '0 0 0 3px rgba(255, 254, 6, 0.24)',
  brandGlow: '0 0 32px rgba(1, 176, 239, 0.34)',
  sealGlow: '0 0 36px rgba(255, 254, 6, 0.28)',
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

// Explicit DS-01 semantic groups. These aliases make the token contract easy to
// consume without requiring components to know the nested color structure.
export const surfaces = colors.surface;
export const borders = colors.border;
export const statusColors = colors.state;
export const motion = animation;

export const mapPanels = {
  dark: {
    surface: colors.studio.panelGlass,
    surfaceSolid: colors.studio.panel,
    border: colors.studio.panelBorder,
    shadow: shadows.studioPanel,
    control: colors.studio.control,
    controlHover: colors.studio.controlHover,
    controlActive: colors.studio.controlActive,
    badge: colors.studio.badge,
    badgeText: colors.studio.badgeText,
  },
  light: {
    surface: colors.studio.panelGlassLight,
    surfaceSolid: colors.surface.light.raised,
    border: colors.studio.panelBorderLight,
    shadow: shadows.md,
    control: 'rgba(12, 12, 12, 0.05)',
    controlHover: 'rgba(1, 176, 239, 0.10)',
    controlActive: 'rgba(255, 254, 6, 0.20)',
    badge: 'rgba(1, 176, 239, 0.12)',
    badgeText: colors.brand.primary,
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
  motion,
  surfaces,
  borders,
  statusColors,
  mapPanels,
};
