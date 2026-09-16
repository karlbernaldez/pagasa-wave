export const ANALYTICS_RANGE_PRESETS = Object.freeze([
  { id: 'today', label: 'Today', days: 1 },
  { id: '7d', label: 'Last 7 days', days: 7 },
  { id: '14d', label: 'Last 14 days', days: 14 },
  { id: '30d', label: 'Last 30 days', days: 30 },
  { id: '60d', label: 'Last 60 days', days: 60 },
  { id: '90d', label: 'Last 90 days', days: 90 },
  { id: 'custom', label: 'Custom', days: null },
]);

const pad = (value) => String(value).padStart(2, '0');

export function toManilaDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const valueByType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${valueByType.year}-${valueByType.month}-${valueByType.day}`;
}

const subtractCalendarDays = (dateKey, days) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - days);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
};

export function buildPresetRange(days, now = new Date()) {
  const end = toManilaDateKey(now);
  const start = subtractCalendarDays(end, days - 1);
  return { start, end };
}

export function initialAnalyticsRange(now = new Date()) {
  return { preset: '14d', ...buildPresetRange(14, now) };
}

export function isAnalyticsDataStale(loadedAt, now = Date.now(), staleAfterMs = 5 * 60 * 1000) {
  if (!loadedAt) return false;
  const timestamp = new Date(loadedAt).getTime();
  if (!Number.isFinite(timestamp)) return false;
  return now - timestamp > staleAfterMs;
}
