import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { PropsWithChildren } from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useWaveLabTheme } from '@/theme/ThemeProvider';

export type GlassSurfaceProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  elevated?: boolean;
  strong?: boolean;
  accessibilityLabel?: string;
}>;

export function GlassSurface({
  children,
  style,
  intensity = 58,
  elevated = false,
  strong = false,
  accessibilityLabel,
}: GlassSurfaceProps) {
  const theme = useWaveLabTheme();
  const fallbackBackground = strong
    ? theme.isDark ? 'rgba(52,83,132,0.46)' : 'rgba(255,255,255,0.42)'
    : theme.isDark ? 'rgba(24,58,103,0.34)' : 'rgba(255,255,255,0.28)';

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.shell,
        {
          borderColor: theme.isDark ? 'rgba(217,235,255,0.28)' : 'rgba(255,255,255,0.70)',
          borderRadius: theme.radii.lg,
        },
        elevated ? theme.shadows.soft : null,
        style,
      ]}
    >
      <BlurView
        tint={theme.isDark ? 'dark' : 'light'}
        intensity={Platform.OS === 'android' ? Math.min(intensity, 38) : intensity}
        experimentalBlurMethod="dimezisBlurView"
        style={[StyleSheet.absoluteFill, { backgroundColor: fallbackBackground }]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[
          theme.isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.56)',
          'rgba(255,255,255,0.04)',
          theme.isDark ? 'rgba(8,26,55,0.20)' : 'rgba(110,145,196,0.10)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={[styles.highlight, { borderColor: theme.isDark ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.78)' }]} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  content: {
    position: 'relative',
    zIndex: 2,
  },
  highlight: {
    ...StyleSheet.absoluteFillObject,
    borderTopWidth: 1,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    opacity: 0.95,
    zIndex: 1,
  },
});