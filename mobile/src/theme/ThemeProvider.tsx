import { createContext, PropsWithChildren, useContext, useMemo } from 'react';
import { ColorSchemeName, useColorScheme } from 'react-native';

import { darkColors, lightColors, motion, radii, shadows, spacing, typography, WaveLabColors } from './tokens';

export type WaveLabTheme = {
  isDark: boolean;
  colorScheme: Exclude<ColorSchemeName, null | undefined>;
  colors: WaveLabColors;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
  motion: typeof motion;
  shadows: typeof shadows;
};

const ThemeContext = createContext<WaveLabTheme | null>(null);

export function WaveLabThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const colorScheme = systemScheme === 'dark' ? 'dark' : 'light';

  const value = useMemo<WaveLabTheme>(() => ({
    isDark: colorScheme === 'dark',
    colorScheme,
    colors: colorScheme === 'dark' ? darkColors : lightColors,
    spacing,
    radii,
    typography,
    motion,
    shadows,
  }), [colorScheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useWaveLabTheme(): WaveLabTheme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useWaveLabTheme must be used inside WaveLabThemeProvider');
  return theme;
}
