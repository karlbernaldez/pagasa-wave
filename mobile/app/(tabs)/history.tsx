import { Ionicons } from '@expo/vector-icons';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GlassSurface } from '@/components/ui/GlassSurface';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { publicationHistory } from '@/features/charts/mockCharts';
import { usePublicCharts } from '@/features/charts/usePublicCharts';
import { useWaveLabTheme } from '@/theme/ThemeProvider';

export default function HistoryScreen() {
  const theme = useWaveLabTheme();
  const { projects, loading, usingFallback, refresh } = usePublicCharts(theme.isDark);

  const liveHistory = Object.values(projects.reduce<Record<string, { date: string; time: string; count: number; latest?: boolean }>>((groups, project) => {
    const rawDate = project.forecastDate || project.publishedAt;
    const parsed = rawDate ? new Date(rawDate) : null;
    const validDate = parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
    const key = validDate ? validDate.toISOString().slice(0, 10) : 'unknown';
    const label = validDate ? validDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Date unavailable';
    const time = validDate ? validDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'Time unavailable';
    groups[key] = groups[key] ?? { date: label, time, count: 0 };
    groups[key].count += 1;
    return groups;
  }, {})).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((item, index) => ({ ...item, latest: index === 0 }));

  const history = liveHistory.length ? liveHistory : publicationHistory;

  return (
    <ScreenBackground>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={theme.colors.accent} />}
      >
        <Text style={[styles.eyebrow, { color: theme.colors.accent }]}>PUBLIC ARCHIVE</Text>
        <Text style={[styles.title, { color: theme.colors.text }]}>Publication history</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>Browse previous official chart releases.</Text>

        <GlassSurface style={styles.summary} strong>
          <Ionicons name="time-outline" size={24} color={theme.colors.accent} />
          <View style={styles.summaryCopy}>
            <Text style={[styles.summaryTitle, { color: theme.colors.text }]}>Recent publications</Text>
            <Text style={[styles.summaryText, { color: theme.colors.textMuted }]}>{usingFallback ? 'Preview archive shown until the live API returns published charts.' : 'Live public releases from the WaveLab API.'}</Text>
          </View>
        </GlassSurface>

        <Text style={[styles.month, { color: theme.colors.textMuted }]}>RECENT RELEASES</Text>
        <GlassSurface style={styles.list}>
          {history.map((item, index) => (
            <View key={`${item.date}-${index}`} style={[styles.row, index < history.length - 1 && { borderBottomColor: theme.colors.divider, borderBottomWidth: StyleSheet.hairlineWidth }]}> 
              <View style={[styles.calendar, { backgroundColor: theme.colors.glassFillStrong }]}>
                <Ionicons name="calendar-outline" size={20} color={theme.colors.accent} />
              </View>
              <View style={styles.rowCopy}>
                <View style={styles.rowTitleLine}>
                  <Text style={[styles.rowTitle, { color: theme.colors.text }]}>{item.date}</Text>
                  {item.latest ? <Text style={[styles.latest, { color: theme.colors.success }]}>LATEST</Text> : null}
                </View>
                <Text style={[styles.rowMeta, { color: theme.colors.textMuted }]}>{item.time} · {item.count} chart{item.count === 1 ? '' : 's'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
            </View>
          ))}
        </GlassSurface>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 118 },
  eyebrow: { fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '900', marginTop: 5 },
  subtitle: { fontSize: 14, fontWeight: '600', marginTop: 5 },
  summary: { marginTop: 22, padding: 18, flexDirection: 'row', gap: 14, alignItems: 'center' },
  summaryCopy: { flex: 1 },
  summaryTitle: { fontSize: 16, fontWeight: '800' },
  summaryText: { fontSize: 12, lineHeight: 18, marginTop: 4, fontWeight: '600' },
  month: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2, marginTop: 26, marginBottom: 10 },
  list: { overflow: 'hidden' },
  row: { minHeight: 82, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  calendar: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1 },
  rowTitleLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowTitle: { fontSize: 15, fontWeight: '800' },
  rowMeta: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  latest: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
});
