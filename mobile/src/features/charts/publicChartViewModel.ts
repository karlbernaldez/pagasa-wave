import type { PublicChart } from '@/lib/publicCharts';
import type { MockChart } from './mockCharts';

const SLOT_LABELS: Record<string, string> = {
  day1_am: 'Day 1 AM',
  day1_pm: 'Day 1 PM',
  day2_am: 'Day 2 AM',
  day2_pm: 'Day 2 PM',
};

function asDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateTime(value?: string) {
  const date = asDate(value);
  if (!date) return 'Publication time unavailable';
  return `Published ${date.toLocaleString('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Manila',
    timeZoneName: 'short',
  })}`;
}

function formatValidPeriod(value?: string) {
  const date = asDate(value);
  if (!date) return 'Valid period unavailable';
  return `Valid ${date.toLocaleDateString('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Manila',
  })}`;
}

function normalizeChartType(value?: string) {
  return String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

export function toMobileChart(project: PublicChart, index = 0): MockChart {
  const chartType = normalizeChartType(project.chartType);
  const shortTitle = SLOT_LABELS[chartType] || project.chartType || `Chart ${index + 1}`;
  const title = project.name || project.description || 'Published Wave Forecast';

  return {
    id: project._id,
    title,
    shortTitle,
    validPeriod: formatValidPeriod(project.forecastDate),
    publishedAt: formatDateTime(project.publishedAt),
    waveHeight: 'See chart',
    windSpeed: 'See chart',
    summary: project.description || 'Official published WaveLab public forecast guidance.',
    colors: ['#0A2B66', '#057CC1', '#42D7C8'],
    source: 'live',
    imageUrl: project.raster?.imageUrl,
    forecastDate: project.forecastDate,
    publishedAtRaw: project.publishedAt,
  };
}

export function groupPublicationHistory(charts: MockChart[]) {
  const groups = new Map<string, { date: string; time: string; count: number; latest?: boolean }>();

  charts.forEach((chart) => {
    const date = asDate(chart.publishedAtRaw || chart.forecastDate);
    if (!date) return;
    const key = date.toISOString().slice(0, 10);
    const current = groups.get(key);
    if (current) {
      current.count += 1;
      return;
    }
    groups.set(key, {
      date: date.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' }),
      time: date.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila', timeZoneName: 'short' }),
      count: 1,
    });
  });

  return [...groups.values()].map((item, index) => ({ ...item, latest: index === 0 }));
}
