export type PublishedChart = {
  id: string;
  title: string;
  shortTitle: string;
  validPeriod: string;
  publishedAt: string;
  availability: 'published' | 'unavailable';
};

export type Publication = {
  date: string;
  label: string;
  publishedAt: string;
  charts: PublishedChart[];
};

export const publications: Publication[] = [
  {
    date: '2026-06-30',
    label: 'June 30, 2026',
    publishedAt: '8:00 AM PHT',
    charts: [
      { id: 'wave-wind-0630', title: 'Wave and Wind Forecast', shortTitle: 'Wave & Wind', validPeriod: 'Valid July 1, 2026 · 8:00 AM', publishedAt: 'June 30, 2026 · 8:00 AM', availability: 'published' },
      { id: 'wave-only-0630', title: 'Wave Height Forecast', shortTitle: 'Wave Only', validPeriod: 'Valid July 1, 2026 · 8:00 AM', publishedAt: 'June 30, 2026 · 8:00 AM', availability: 'published' },
      { id: 'accessible-0630', title: 'Accessible Wave Forecast', shortTitle: 'Accessible', validPeriod: 'Valid July 1, 2026 · 8:00 AM', publishedAt: 'June 30, 2026 · 8:00 AM', availability: 'published' },
    ],
  },
  {
    date: '2026-06-29',
    label: 'June 29, 2026',
    publishedAt: '8:00 PM PHT',
    charts: [
      { id: 'wave-wind-0629', title: 'Wave and Wind Forecast', shortTitle: 'Wave & Wind', validPeriod: 'Valid June 30, 2026 · 8:00 AM', publishedAt: 'June 29, 2026 · 8:00 PM', availability: 'published' },
      { id: 'wave-only-0629', title: 'Wave Height Forecast', shortTitle: 'Wave Only', validPeriod: 'Valid June 30, 2026 · 8:00 AM', publishedAt: 'June 29, 2026 · 8:00 PM', availability: 'published' },
    ],
  },
  {
    date: '2026-06-28',
    label: 'June 28, 2026',
    publishedAt: '8:00 AM PHT',
    charts: [
      { id: 'wave-wind-0628', title: 'Wave and Wind Forecast', shortTitle: 'Wave & Wind', validPeriod: 'Valid June 29, 2026 · 8:00 AM', publishedAt: 'June 28, 2026 · 8:00 AM', availability: 'published' },
    ],
  },
];

export const latestPublication = publications[0];

export function findChart(id: string): PublishedChart | undefined {
  return publications.flatMap((publication) => publication.charts).find((chart) => chart.id === id);
}