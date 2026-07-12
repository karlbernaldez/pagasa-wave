import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { WaveLabThemeProvider, useWaveLabTheme } from '@/theme/ThemeProvider';

function AppNavigator() {
  const theme = useWaveLabTheme();

  return (
    <>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          animation: 'fade',
        }}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <WaveLabThemeProvider>
        <AppNavigator />
      </WaveLabThemeProvider>
    </SafeAreaProvider>
  );
}
