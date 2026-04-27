import { colors, typography, spacing, radius, shadows } from './tokens';

const sharedColors = {
  blue: colors.primary,
  lightBlue: colors.accent,
  white: '#ffffff',
  black: '#000000',
};

const sharedFontSizes = typography.scale;

const sharedSpacing = spacing;

const sharedBorderRadius = radius;

export const theme = {
  colors: {
    highlight: colors.primary,
    background: colors.surface.light,
    darkBackground: colors.surface.dark,
    textPrimary: '#000',
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
  },
  fontSizes: sharedFontSizes,
  spacing: sharedSpacing,
  borderRadius: sharedBorderRadius,
  shadows,
};

export const darkTheme = {
  colors: {
    highlight: colors.primary,
    background: colors.surface.dark,
    darkBackground: '#000',
    textPrimary: '#fff',
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
  },
  fontSizes: sharedFontSizes,
  spacing: sharedSpacing,
  borderRadius: sharedBorderRadius,
  shadows,
};
