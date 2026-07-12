import { Ionicons } from '@expo/vector-icons';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ForecastCard } from '@/components/charts/ForecastCard';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { usePublicCharts } from '@/features/charts/usePublicCharts';
import { useWaveLabTheme } from '@/theme/ThemeProvider';

export default function LatestScreen() {
  const theme = useWaveLabTheme();
  const { charts, loading, error, usingFallback, refresh } = usePublicCharts(theme.isDark);
  const latest = charts[0];

  return (
    <ScreenBackground>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={theme.colors.accent}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={[styles.logo, { backgroundColor: theme.colors.glassFillStrong }]}>
              <Ionicons name="water" size={25} color="#FFFFFF" />
            </View>
            <View>
              <Text style={[styles.brand, { color: theme.colors.text }]}>WAVELAB</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>Official Wave Forecast</Text>
            </View>
          </View>

          <GlassSurface style={styles.iconButton} strong>
            <Ionicons name="notifications-outline" size={20} color={theme.colors.text} />
          </GlassSurface>
        </View>

        {(error || usingFallback) && (
          <GlassSurface style={styles.banner} strong>
            <Ionicons
              name={error ? 'cloud-offline-outline' : 'information-circle-outline'}
              size={20}
              color={theme.colors.warning}
            />
            <Text style={[styles.bannerText, { color: theme.colors.textMuted }]}>
              {error
                ? `Live charts unavailable: ${error} Showing preview data.`
                : 'No live publications were returned. Showing preview data.'}
            </Text>
          </GlassSurface>
        )}

        <GlassSurface style={styles.publication} elevated strong>
          <View style={styles.publicationTop}>
            <View style={styles.publicationCopy}>
              <Text style={[styles.smallLabel, { color: theme.colors.textMuted }]}>LATEST PUBLICATION</Text>
              <Text style={[styles.date, { color: theme.colors.text }]}>Published chart release</Text>
              <Text style={[styles.time, { color: theme.colors.textMuted }]}>
                {latest?.publishedAt ?? 'Pull down to refresh'}
              </Text>
            </View>
            <View
              style={[
                styles.status,
                { backgroundColor: usingFallback ? theme.colors.warning : theme.colors.success },
              ]}
            >
              <Text style={styles.statusText}>{usingFallback ? 'PREVIEW' : 'PUBLISHED'}</Text>
            </View>
          </View>
        </GlassSurface>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Forecast charts</Text>
          <Text style={[styles.sectionMeta, { color: theme.colors.success }]}>
            {charts.length} available
          </Text>
        </View>

        {charts.map((chart, index) => (
          <ForecastCard key={chart.id} chart={chart} featured={index === 0} />
        ))}

        <GlassSurface style={styles.notice}>
          <Ionicons name="shield-checkmark-outline" size={22} color={theme.colors.accent} />
          <Text style={[styles.noticeText, { color: theme.colors.textMuted }]}>
            Wave charts are supplementary guidance. Always check official PAGASA bulletins and local advisories.
          </Text>
        </GlassSurface>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 118 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { fontSize: 22, fontWeight: '900', letterSpacing: 0.4 },
  subtitle: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  banner: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
  },
  bannerText: { flex: 1, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  publication: { padding: 18, marginBottom: 22 },
  publicationTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  publicationCopy: { flex: 1 },
  smallLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.9 },
  date: { fontSize: 20, fontWeight: '900', marginTop: 10 },
  time: { fontSize: 12, lineHeight: 18, fontWeight: '700', marginTop: 4 },
  status: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  statusText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '900' },
  sectionMeta: { fontSize: 12, fontWeight: '800' },
  notice: {
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginTop: 2,
  },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 18, fontWeight: '600' },
});