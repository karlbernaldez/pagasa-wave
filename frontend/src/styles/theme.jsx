import { tokens } from './tokens';

const { colors, typography, spacing, radius, shadows, blur, zIndex, animation, gradients } = tokens;

// Helper: map semantic tokens into legacy structure so existing components do not break
const buildTheme = (mode = 'light') => {
  const isDark = mode === 'dark';

  const text = isDark ? colors.text.dark : colors.text.light;
  const surface = isDark ? colors.surface.dark : colors.surface.light;
  const border = isDark ? colors.border.dark : colors.border.light;

  return {
    // ── New token access (preferred) ───────────────────────────────
    tokens,

    // ── Colors (legacy-compatible) ────────────────────────────────
    colors: {
      // legacy keys
      highlight: colors.brand.primary,
      background: surface.page,
      lightBackground: surface.page,
      darkBackground: colors.surface.dark.page,
      bgHeader: surface.raised,
      glassBackground: surface.elevated,

      textPrimary: text.primary,
      textSecondary: text.secondary,
      textMuted: text.muted,

      success: colors.state.success,
      warning: colors.state.warning,
      error: colors.state.error,

      // new semantic
      border,
      action: colors.action,
      overlay: colors.overlay,
      studio: colors.studio,
    },

    // ── Typography ───────────────────────────────────────────────
    fonts: typography.fontFamily,
    fontSizes: typography.scale,
    fontWeights: typography.weight,
    lineHeights: typography.lineHeight,

    // ── Layout ──────────────────────────────────────────────────
    spacing,
    borderRadius: radius,

    // ── Effects ─────────────────────────────────────────────────
    shadows,
    blur,
    gradients,
    animation,

    // ── Z-index ─────────────────────────────────────────────────
    zIndex,

    // ── Map styles (preserved) ──────────────────────────────────
    mapStyles: {
      light: 'mapbox://styles/mapbox/light-v11',
      dark: 'mapbox://styles/mapbox/dark-v11',
    },
  };
};

export const theme = buildTheme('light');
export const darkTheme = buildTheme('dark');
