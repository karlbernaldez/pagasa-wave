import { LinearGradient } from 'expo-linear-gradient';
import { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useWaveLabTheme } from '@/theme/ThemeProvider';

export function ScreenBackground({ children }: PropsWithChildren) {
  const theme = useWaveLabTheme();

  const gradient = theme.isDark
    ? ['#07162F', '#0B2B58', '#07172E', '#020814'] as const
    : ['#DDEBFF', '#AFCBFA', '#6F95CD', '#17345E'] as const;

  return (
    <LinearGradient
      colors={gradient}
      locations={[0, 0.38, 0.72, 1]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={styles.root}
    >
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(93,145,255,0.34)', 'rgba(20,74,151,0.08)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.skyGlow}
      />
      <View pointerEvents="none" style={[styles.orb, styles.orbTop, { backgroundColor: '#6D8DFF' }]} />
      <View pointerEvents="none" style={[styles.orb, styles.orbMiddle, { backgroundColor: '#32B8FF' }]} />
      <View pointerEvents="none" style={styles.horizonGlow} />
      <View pointerEvents="none" style={styles.waveOne} />
      <View pointerEvents="none" style={styles.waveTwo} />
      <View pointerEvents="none" style={styles.vignette} />
      <SafeAreaView style={styles.safeArea}>{children}</SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  safeArea: { flex: 1 },
  skyGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '58%',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.18,
  },
  orbTop: { width: 360, height: 360, top: -170, right: -130 },
  orbMiddle: { width: 280, height: 280, top: 180, left: -180, opacity: 0.12 },
  horizonGlow: {
    position: 'absolute',
    left: -80,
    right: -80,
    bottom: 104,
    height: 170,
    borderRadius: 120,
    backgroundColor: 'rgba(21,105,181,0.18)',
    transform: [{ rotate: '-3deg' }],
  },
  waveOne: {
    position: 'absolute',
    width: 540,
    height: 180,
    left: -90,
    bottom: -42,
    borderRadius: 260,
    borderWidth: 2,
    borderColor: 'rgba(121,190,255,0.12)',
    backgroundColor: 'rgba(5,25,53,0.35)',
    transform: [{ rotate: '-5deg' }],
  },
  waveTwo: {
    position: 'absolute',
    width: 480,
    height: 150,
    right: -180,
    bottom: 30,
    borderRadius: 240,
    borderWidth: 1,
    borderColor: 'rgba(166,214,255,0.10)',
    backgroundColor: 'rgba(9,44,84,0.28)',
    transform: [{ rotate: '8deg' }],
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,6,18,0.08)',
  },
});