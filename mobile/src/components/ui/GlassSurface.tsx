import { BlurView } from 'expo-blur';
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
  intensity = 44,
  elevated = false,
  strong = false,
  accessibilityLabel,
}: GlassSurfaceProps) {
  const theme = useWaveLabTheme();
  const fallbackBackground = strong ? theme.colors.glassFillStrong : theme.colors.glassFill;

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.shell,
        {
          borderColor: theme.colors.glassBorder,
          borderRadius: theme.radii.lg,
        },
        elevated ? theme.shadows.soft : null,
        style,
      ]}
    >
      <BlurView
        tint={theme.isDark ? 'dark' : 'light'}
        intensity={Platform.OS === 'android' ? Math.min(intensity, 32) : intensity}
        experimentalBlurMethod="dimezisBlurView"
        style={[StyleSheet.absoluteFill, { backgroundColor: fallbackBackground }]}
      />
      <View pointerEvents="none" style={[styles.highlight, { borderColor: theme.colors.glassHighlight }]} />
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
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    opacity: 0.9,
    zIndex: 1,
  },
});
