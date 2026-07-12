import { Ionicons } from '@expo/vector-icons';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ForecastCard } from '@/components/charts/ForecastCard';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { usePublicCharts } from '@/features/charts/usePublicCharts';
import