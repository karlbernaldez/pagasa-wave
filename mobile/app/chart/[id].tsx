import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { fetchPublicPublishedChartOutput } from '@/api/publicCharts';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { mockCharts, type MockChart } from '@/features/charts/mockCharts';
import { useWaveLabTheme } from '@/theme/ThemeProvider';

const displayModes = ['Wave & Wind', 'Wave Only', 'Accessible'];

function first(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default function ChartDetailScreen() {
  const params = useLocalSearchParams<Record<string, string | string[]>>();
  const id = first(params.id) ?? '';
  const theme = useWaveLabTheme();
  const fallback = mockCharts.find((item) => item.id === id) ?? mockCharts[0];
  const routeColors = first(params.colors)?.split(',').filter(Boolean);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadingOutput, setLoadingOutput] = useState(false);

  const chart: MockChart = {
    id,
    title: first(params.title) ?? fallback.title,
    shortTitle: first(params.shortTitle) ?? fallback.shortTitle,
    validPeriod: first(params.validPeriod) ?? fallback.validPeriod,
    publishedAt: first(params.publishedAt) ?? fallback.publishedAt,
    waveHeight: first(params.waveHeight) ?? fallback.waveHeight,
    windSpeed: first(params.windSpeed) ?? fallback.windSpeed,
    summary: first(params.summary) ?? fallback.summary,
    colors:
      routeColors?.length === 3
        ? [routeColors[0], routeColors[1], routeColors[2]]
        : fallback.colors,
  };

  useEffect(() => {
    if (!id || id.startsWith('day-')) return;

    const controller = new AbortController();
    setLoadingOutput(true);

    fetchPublicPublishedChartOutput(id, {
      theme: theme.isDark ? 'dark' : 'light',
      signal: controller.signal,
    })
      .then((output) => setImageUrl(output.raster?.imageUrl ?? null))
      .catch((error) => {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.warn('[ChartDetail] Published chart output unavailable:', error.message);
        }
      })
      .finally(() => setLoadingOutput(false));

    return () => controller.abort();
  }, [id, theme.isDark]);

  const handleShare = async () => {
    await Share.share({
      title: chart.title,
      message: `${chart.title}\n${chart.validPeriod}\n${chart.publishedAt}`,
    });
  };

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()}>
            <GlassSurface style={styles.roundButton} strong>
              <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
            </GlassSurface>
          </Pressable>

          <View style={styles.headingCopy}>
            <Text numberOfLines={1} style={[styles.heading, { color: theme.colors.text }]}>
              {chart.shortTitle}
            </Text>
            <Text numberOfLines={1} style={[styles.headingMeta, { color: theme.colors.textMuted }]}>
              {chart.publishedAt}
            </Text>
          </View>

          <Pressable accessibilityRole="button" accessibilityLabel="Share chart" onPress={handleShare}>
            <GlassSurface style={styles.roundButton} strong>
              <Ionicons name="share-outline" size={21} color={theme.colors.text} />
            </GlassSurface>
          </Pressable>
        </View>

        <GlassSurface style={styles.mapShell} elevated strong>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.mapImage} resizeMode="cover" />
          ) : (
            <LinearGradient colors={chart.colors} style={styles.map}>
              <View style={styles.landMass} />
              <View style={[styles.landMass, styles.landMassTwo]} />
              <View style={styles.windLineOne} />
              <View style={styles.windLineTwo} />
              <View style={styles.legend}>
                <Text style={styles.legendLabel}>WAVE HEIGHT</Text>
                <Text style={styles.legendValue}>{chart.waveHeight}</Text>
                <Text style={styles.legendLabel}>WIND</Text>
                <Text style={styles.legendValue}>{chart.windSpeed}</Text>
              </View>
            </LinearGradient>
          )}

          {loadingOutput ? (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color="#FFFFFF" />
              <Text style={styles.loadingText}>Loading published chart…</Text>
            </View>
          ) : null}

          <GlassSurface style={styles.resetButton} strong>
            <Ionicons name="locate-outline" size={17} color="#FFFFFF" />
            <Text style={styles.resetText}>Reset view</Text>
          </GlassSurface>
        </GlassSurface>

        <GlassSurface style={styles.segmentedControl} strong>
          {displayModes.map((mode, index) => (
            <View
              key={mode}
              style={[styles.segment, index === 0 && { backgroundColor: theme.colors.accent }]}
            >
              <Text style={[styles.segmentText, { color: index === 0 ? '#FFFFFF' : theme.colors.textMuted }]}>
                {mode}
              </Text>
            </View>
          ))}
        </GlassSurface>

        <GlassSurface style={styles.sheet} elevated strong>
          <View style={[styles.handle, { backgroundColor: theme.colors.textMuted }]} />
          <Text style={[styles.title, { color: theme.colors.text }]}>{chart.title}</Text>
          <Text style={[styles.validPeriod, { color: theme.colors.textMuted }]}>{chart.validPeriod}</Text>

          <View style={[styles.metrics, { borderColor: theme.colors.divider }]}>
            <View style={styles.metric}>
              <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>WAVE HEIGHT</Text>
              <Text style={[styles.metricValue, { color: theme.colors.text }]}>{chart.waveHeight}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>WIND SPEED</Text>
              <Text style={[styles.metricValue, { color: theme.colors.text }]}>{chart.windSpeed}</Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Forecast summary</Text>
          <Text style={[styles.summary, { color: theme.colors.textMuted }]}>{chart.summary}</Text>

          <GlassSurface style={styles.notice}>
            <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.accent} />
            <Text style={[styles.noticeText, { color: theme.colors.textMuted }]}>
              Supplementary public guidance only. Always check current PAGASA bulletins, warnings, and local conditions.
            </Text>
          </GlassSurface>

          <Pressable accessibilityRole="button" style={[styles.primaryButton, { backgroundColor: theme.colors.accent }]}>
            <Ionicons name="download-outline" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Download PDF</Text>
          </Pressable>
        </GlassSurface>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 36 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  roundButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  headingCopy: { flex: 1 },
  heading: { fontSize: 16, fontWeight: '900', textAlign: 'center' },
  headingMeta: { fontSize: 10, fontWeight: '700', textAlign: 'center', marginTop: 3 },
  mapShell: { minHeight: 470 },
  map: { minHeight: 470, overflow: 'hidden', padding: 14 },
  mapImage: { width: '100%', height: 470 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2,9,20,0.44)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  landMass: {
    position: 'absolute',
    width: 180,
    height: 270,
    borderRadius: 90,
    backgroundColor: 'rgba(210,245,230,0.45)',
    top: 80,
    left: 80,
    transform: [{ rotate: '-14deg' }],
  },
  landMassTwo: { width: 100, height: 160, top: 245, left: 25, opacity: 0.7 },
  windLineOne: {
    position: 'absolute',
    width: 300,
    height: 160,
    borderRadius: 150,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.38)',
    top: 40,
    left: -80,
  },
  windLineTwo: {
    position: 'absolute',
    width: 320,
    height: 180,
    borderRadius: 160,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.28)',
    bottom: 20,
    right: -120,
  },
  legend: {
    position: 'absolute',
    right: 14,
    top: 18,
    backgroundColor: 'rgba(2,12,31,0.48)',
    borderRadius: 16,
    padding: 12,
  },
  legendLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 8, fontWeight: '800', letterSpacing: 0.7 },
  legendValue: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', marginTop: 2, marginBottom: 10 },
  resetButton: {
    position: 'absolute',
    left: 14,
    top: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
  },
  resetText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  segmentedControl: { flexDirection: 'row', padding: 4, marginTop: 12, borderRadius: 999 },
  segment: { flex: 1, minHeight: 38, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  segmentText: { fontSize: 11, fontWeight: '800' },
  sheet: { marginTop: 12, padding: 18 },
  handle: { width: 46, height: 5, borderRadius: 999, alignSelf: 'center', opacity: 0.5, marginBottom: 16 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '900' },
  validPeriod: { fontSize: 13, lineHeight: 19, fontWeight: '700', marginTop: 5 },
  metrics: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginVertical: 18,
    paddingVertical: 16,
  },
  metric: { flex: 1 },
  metricLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.7 },
  metricValue: { fontSize: 22, fontWeight: '900', marginTop: 5 },
  sectionTitle: { fontSize: 16, fontWeight: '900' },
  summary: { fontSize: 13, lineHeight: 20, fontWeight: '600', marginTop: 7 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, marginTop: 18 },
  noticeText: { flex: 1, fontSize: 11, lineHeight: 17, fontWeight: '600' },
  primaryButton: {
    minHeight: 52,
    borderRadius: 18,
    flexDirection: 'row',
    gap: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
});