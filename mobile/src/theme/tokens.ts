export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

export const radii = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '800' as const },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: '800' as const },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '700' as const },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '400' as const },
  callout: { fontSize: 15, lineHeight: 21, fontWeight: '600' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const },
} as const;

export const motion = {
  fast: 160,
  standard: 260,
  slow: 420,
} as const;

export const shadows = {
  soft: {
    shadowColor: '#001D3D',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
  floating: {
    shadowColor: '#00142B',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.28,
    shadowRadius: 32,
    elevation: 16,
  },
} as const;

export const lightColors = {
  background: '#EAF5FF',
  backgroundDeep: '#CFE8FF',
  text: '#09213B',
  textMuted: '#4E6680',
  accent: '#0A84FF',
  accentStrong: '#0066D6',
  cyan: '#38D5FF',
  success: '#2CCB7F',
  warning: '#FFB340',
  danger: '#FF5D67',
  glassFill: 'rgba(255,255,255,0.42)',
  glassFillStrong: 'rgba(255,255,255,0.62)',
  glassBorder: 'rgba(255,255,255,0.74)',
  glassHighlight: 'rgba(255,255,255,0.88)',
  divider: 'rgba(9,33,59,0.10)',
} as const;

export const darkColors = {
  background: '#06152B',
  backgroundDeep: '#020914',
  text: '#F6FBFF',
  textMuted: '#A8BDD1',
  accent: '#4CA6FF',
  accentStrong: '#2B7CFF',
  cyan: '#37D6FF',
  success: '#55D998',
  warning: '#FFC15A',
  danger: '#FF7C83',
  glassFill: 'rgba(17,45,79,0.42)',
  glassFillStrong: 'rgba(20,51,91,0.66)',
  glassBorder: 'rgba(255,255,255,0.18)',
  glassHighlight: 'rgba(255,255,255,0.30)',
  divider: 'rgba(255,255,255,0.10)',
} as const;

export type WaveLabColors = {
  [Key in keyof typeof lightColors]: string;
};