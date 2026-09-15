export const ANALYTICS_RANGE_PRESETS = Object.freeze([
  { id: 'today', label: 'Today', days: 1 },
  { id: '7d', label: 'Last 7 days', days: 7 },
  { id: '14d', label: 'Last 14 days', days: 14 },
  { id: '30d', label: 'Last 30 days', days: 30 },
  { id: 'custom', label: 'Custom', days: null },
]);

const pad = (value) => String(value).padStart(2, '0');

export const toLocalDateKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export function buildPresetRange(days, now = new Date()) {
  const end = new Date(now);
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  return { start: toLocalDateKey(start), end: toLocalDateKey(end) };
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
