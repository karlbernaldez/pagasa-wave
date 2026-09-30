import { adaptiveBucketDays, bucketDateSeries } from './analyticsWorkspaceModel';

export const bucketLabel = (days) => (adaptiveBucketDays(days) === 1 ? 'Daily' : 'Weekly');

export function buildTrend(rows, range, valueFields) {
  return bucketDateSeries(rows || [], {
    start: range?.start,
    end: range?.end,
    valueFields,
    dayCount: range?.days,
  });
}

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Manila',
  }).format(date);
}

export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Manila',
  }).format(date);
}

export function formatHours(value) {
  if (value == null) return '—';
  const number = Number(value);
  return Number.isFinite(number) ? `${number}h` : '—';
}

export function formatGeneratedAt(value) {
  if (!value) return 'Not refreshed yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not refreshed yet';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Manila',
  }).format(date);
}
