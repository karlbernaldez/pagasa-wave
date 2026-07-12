import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ForecastCard } from '@/components/charts/ForecastCard';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { mockCharts } from '@/features/charts/mockCharts';
import { useWaveLabTheme } from '@/theme/ThemeProvider';

export default function LatestScreen() {
  const theme = useWaveLabTheme();

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: theme.colors.accent }]}>WAVELAB</Text>
            <Text style={[styles.title, { color: theme.colors.text }]}>Latest wave charts</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>Official published public guidance</Text>
          </View>
          <GlassSurface style={styles.iconButton} strong>
            <Ionicons name="notifications-outline" size={21} color={theme.colors.text} />
          </GlassSurface>
        </View>

        <GlassSurface style={styles.publication} elevated strong>
          <View style={styles.publicationTop}>
            <View>
              <Text style={[styles.smallLabel, { color: theme.colors.textMuted }]}>LATEST PUBLICATION</Text>
              <Text style={[styles.date, { color: theme.colors.text }]}>July 12, 2026</Text>
              <Text style={[styles.time, { color: theme.colors.textMuted }]}>5:00 AM PHT</Text>
            </View>
            <View style={[styles.status, { backgroundColor: theme.colors.success }]}>
              <Text style={styles.statusText}>PUBLISHED</Text>
            </View>
          </View>
          <Text style={[styles.availability, { color: theme.colors.textMuted }]}>3 published charts currently available</Text>
        </GlassSurface>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Forecast charts</Text>
          <Text style={[styles.sectionMeta, { color: theme.colors.success }]}>3/3 available</Text>
        </View>

        <ForecastCard chart={mockCharts[0]} featured />
        {mockCharts.slice(1).map((chart) => <ForecastCard key={chart.id} chart={chart} />)}

        <GlassSurface style={styles.notice}>
          <Ionicons name="shield-checkmark-outline" size={22} color={theme.colors.accent} />
          <Text style={[styles.noticeText, { color: theme.colors.textMuted }]}>Wave charts are supplementary guidance. Always check official PAGASA bulletins and local advisories.</Text>
        </GlassSurface>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 118 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  eyebrow: { fontSize: 12, fontWeight: '900', letterSpacing: 1.6 },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '900', marginTop: 4 },
  subtitle: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  iconButton: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 23 },
  publication: { padding: 18, marginBottom: 22 },
  publicationTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  smallLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  date: { fontSize: 24, fontWeight: '900', marginTop: 8 },
  time: { fontSize: 13, fontWeight: '700', marginTop: 3 },
  status: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  statusText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  availability: { marginTop: 18, fontSize: 13, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '900' },
  sectionMeta: { fontSize: 12, fontWeight: '800' },
  notice: { padding: 16, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 18, fontWeight: '600' },
});
