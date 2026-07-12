export type MockChart = {
  id: string;
  title: string;
  shortTitle: string;
  validPeriod: string;
  publishedAt: string;
  waveHeight: string;
  windSpeed: string;
  summary: string;
  colors: readonly [string, string, string];
};

export const mockCharts: MockChart[] = [
  {
    id: 'day-1-am',
    title: 'Wave and Wind Forecast',
    shortTitle: 'Day 1 AM',
    validPeriod: 'Valid July 12 · 6:00 AM–12:00 PM',
    publishedAt: 'Published July 12, 2026 · 5:00 AM PHT',
    waveHeight: '0–2 m',
    windSpeed: '10–20 km/h',
    summary: 'Generally slight waves with light to moderate winds across most coastal areas.',
    colors: ['#0A2B66', '#057CC1', '#42D7C8'],
  },
  {
    id: 'day-1-pm',
    title: 'Wave Height Forecast',
    shortTitle: 'Day 1 PM',
    validPeriod: 'Valid July 12 · 12:00 PM–6:00 PM',
    publishedAt: 'Published July 12, 2026 · 5:00 AM PHT',
    waveHeight: '1–2.5 m',
    windSpeed: '15–25 km/h',
    summary: 'Moderate conditions may develop along exposed eastern coastal waters.',
    colors: ['#08245E', '#168FDB', '#72E2B8'],
  },
  {
    id: 'day-2-am',
    title: 'Accessible Wave Forecast',
    shortTitle: 'Day 2 AM',
    validPeriod: 'Valid July 13 · 6:00 AM–12:00 PM',
    publishedAt: 'Published July 12, 2026 · 5:00 AM PHT',
    waveHeight: '0.5–2 m',
    windSpeed: '10–20 km/h',
    summary: 'Higher-contrast chart mode for easier interpretation of coastal wave conditions.',
    colors: ['#04142F', '#075EA8', '#E6C84B'],
  },
];

export const publicationHistory = [
  { date: 'July 12, 2026', time: '5:00 AM PHT', count: 3, latest: true },
  { date: 'July 11, 2026', time: '5:00 AM PHT', count: 4 },
  { date: 'July 10, 2026', time: '5:00 AM PHT', count: 4 },
  { date: 'July 9, 2026', time: '5:00 AM PHT', count: 3 },
  { date: 'July 8, 2026', time: '5:00 AM PHT', count: 4 },
];
