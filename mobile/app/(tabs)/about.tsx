import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { GlassSurface } from '@/components/ui/GlassSurface';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { useWaveLabTheme } from '@/theme/ThemeProvider';

const sections = [
  { icon: 'analytics-outline' as const, title: 'Chart legend', text: 'Understand wave height, wind direction, speed, and chart symbols.' },
  { icon: 'shield-checkmark-outline' as const, title: 'Safety guidance', text: 'Always check the latest official bulletins, warnings, and local advisories.' },
  { icon: 'accessibility-outline' as const, title: 'Accessible viewing', text: 'Use higher-contrast chart presentation and descriptive public information.' },
  { icon: 'mail-outline' as const, title: 'Contact PAGASA', text: 'Find official channels for weather information and public inquiries.' },
];

export default function AboutScreen() {
  const theme = useWaveLabTheme();
  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.eyebrow, { color: theme.colors.accent }]}>ABOUT</Text>
        <Text style={[styles.title, { color: theme.colors.text }]}>WaveLab public charts</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>Official published wave guidance from DOST-PAGASA.</Text>

        <GlassSurface style={styles.hero} elevated strong>
          <View style={[styles.logo, { backgroundColor: theme.colors.accent }]}>
            <Ionicons name="water" size={34} color="#FFFFFF" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={[styles.heroTitle, { color: theme.colors.text }]}>WaveLab</Text>
            <Text style={[styles.heroText, { color: theme.colors.textMuted }]}>Public Dashboard Mobile App</Text>
            <Text style={[styles.version, { color: theme.colors.textMuted }]}>Prototype version 0.1.0</Text>
          </View>
        </GlassSurface>

        <View style={styles.cards}>
          {sections.map((section) => (
            <GlassSurface key={section.title} style={styles.card}>
              <View style={[styles.icon, { backgroundColor: theme.colors.glassFillStrong }]}>
                <Ionicons name={section.icon} size={23} color={theme.colors.accent} />
              </View>
              <View style={styles.cardCopy}>
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{section.title}</Text>
                <Text style={[styles.cardText, { color: theme.colors.textMuted }]}>{section.text}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
            </GlassSurface>
          ))}
        </View>

        <Text style={[styles.footer, { color: theme.colors.textMuted }]}>Wave information for safer coasts and better preparedness.</Text>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 118 },
  eyebrow: { fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '900', marginTop: 5 },
  subtitle: { fontSize: 14, lineHeight: 21, fontWeight: '600', marginTop: 5 },
  hero: { marginTop: 22, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 15 },
  logo: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1 },
  heroTitle: { fontSize: 21, fontWeight: '900' },
  heroText: { fontSize: 13, fontWeight: '700', marginTop: 3 },
  version: { fontSize: 11, marginTop: 6, fontWeight: '600' },
  cards: { marginTop: 18, gap: 12 },
  card: { padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardCopy: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '800' },
  cardText: { fontSize: 12, lineHeight: 17, fontWeight: '600', marginTop: 3 },
  footer: { fontSize: 12, textAlign: 'center', marginTop: 28, fontWeight: '600' },
});
