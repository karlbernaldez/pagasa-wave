import { LinearGradient } from 'expo-linear-gradient';
import { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useWaveLabTheme } from '@/theme/ThemeProvider';

export function ScreenBackground({ children }: PropsWithChildren) {
  const theme = useWaveLabTheme();

  const gradient = theme.isDark
    ? ['#020914', '#071C38', '#0B315B'] as const
    : ['#F7FCFF', '#DCEFFF', '#BFE5F8'] as const;

  return (
    <LinearGradient colors={gradient} style={styles.root}>
      <View pointerEvents="none" style={[styles.orb, styles.orbTop, { backgroundColor: theme.colors.cyan }]} />
      <View pointerEvents="none" style={[styles.orb, styles.orbBottom, { backgroundColor: theme.colors.accent }]} />
      <SafeAreaView style={styles.safeArea}>{children}</SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  safeArea: { flex: 1 },
  orb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.13,
  },
  orbTop: { top: -120, right: -110 },
  orbBottom: { bottom: -150, left: -110 },
});
