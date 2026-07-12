import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';

import { useWaveLabTheme } from '@/theme/ThemeProvider';

export default function TabsLayout() {
  const theme = useWaveLabTheme();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: styles.label,
        tabBarStyle: [
          styles.tabBar,
          {
            borderColor: theme.colors.glassBorder,
            backgroundColor: Platform.OS === 'android' ? theme.colors.glassFillStrong : 'transparent',
          },
        ],
        tabBarBackground: () => (
          <BlurView
            tint={theme.isDark ? 'dark' : 'light'}
            intensity={70}
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarIcon: ({ color, size, focused }) => {
          const names: Record<string, keyof typeof Ionicons.glyphMap> = {
            index: focused ? 'water' : 'water-outline',
            history: focused ? 'time' : 'time-outline',
            about: focused ? 'information-circle' : 'information-circle-outline',
          };
          return <Ionicons name={names[route.name] ?? 'ellipse-outline'} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Latest' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <Tabs.Screen name="about" options={{ title: 'About' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 16,
    height: 72,
    borderRadius: 28,
    borderTopWidth: 0.5,
    borderWidth: 0.5,
    overflow: 'hidden',
    paddingTop: 8,
    paddingBottom: 8,
  },
  label: { fontSize: 11, fontWeight: '700' },
});
