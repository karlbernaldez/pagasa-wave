import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GlassSurface } from '@/components/ui/GlassSurface';
import { MockChart } from '@/features/charts/mockCharts';
import { useWaveLabTheme } from '@/theme/ThemeProvider';

export function ForecastCard({ chart, featured = false }: { chart: MockChart; featured?: boolean }) {
  const theme = useWaveLabTheme();

  const openChart = () => {
    router.push({
      pathname: '/chart/[id]',
      params: {
        id: chart.id,
        title: chart.title,
        shortTitle: chart.shortTitle,
        validPeriod: chart.validPeriod,
        publishedAt: chart.publishedAt,
        waveHeight: chart.waveHeight,
        windSpeed: chart.windSpeed,
        summary: chart.summary,
        colors: chart.colors.join(','),
      },
    });
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${chart.title}`}
      onPress={openChart}
      style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] }]}
    >
      <GlassSurface elevated={featured} strong={featured} style={styles.card}>
        <LinearGradient colors={chart.colors} style={[styles.preview, featured && styles.previewFeatured]}>
          <View style={styles.mapGlow} />
          <View style={styles.waveLine} />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{chart.shortTitle.toUpperCase()}</Text>
          </View>
          <View style={styles.metricRow}>
            <View>
              <Text style={styles.metricLabel}>WAVE HEIGHT</Text>
              <Text style={styles.metricValue}>{chart.waveHeight}</Text>
            </View>
            <View>
              <Text style={styles.metricLabel}>WIND</Text>
              <Text style={styles.metricValue}>{chart.windSpeed}</Text>
            </View>
          </View>
        </LinearGradient>
        <View style={styles.content}>
          <View style={styles.copy}>
            <Text style={[styles.title, { color: theme.colors.text }]}>{chart.title}</Text>
            <Text style={[styles.meta, { color: theme.colors.textMuted }]}>{chart.validPeriod}</Text>
          </View>
          <View style={[styles.arrow, { backgroundColor: theme.colors.glassFillStrong }]}>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.text} />
          </View>
        </View>
      </GlassSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 14 },
  preview: { height: 130, padding: 14, overflow: 'hidden' },
  previewFeatured: { height: 220 },
  mapGlow: {
    position: 'absolute', width: 190, height: 190, borderRadius: 95,
    backgroundColor: 'rgba(255,255,255,0.22)', top: -35, right: -20,
  },
  waveLine: {
    position: 'absolute', width: 250, height: 90, borderRadius: 100,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.30)', bottom: -44, left: -25,
  },
  badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'rgba(3,14,35,0.45)' },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  metricRow: { marginTop: 'auto', flexDirection: 'row', gap: 28 },
  metricLabel: { color: 'rgba(255,255,255,0.74)', fontSize: 10, fontWeight: '700' },
  metricValue: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginTop: 2 },
  content: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  copy: { flex: 1 },
  title: { fontSize: 17, fontWeight: '800' },
  meta: { fontSize: 12, fontWeight: '600', marginTop: 5, lineHeight: 17 },
  arrow: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
});