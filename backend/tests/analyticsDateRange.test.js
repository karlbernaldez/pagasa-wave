import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ANALYTICS_DATE_RANGE_LIMITS,
  buildDateMatch,
  parseAnalyticsDateRange,
} from '../utils/analyticsDateRange.js';

const NOW = new Date('2026-09-15T07:30:00.000Z'); // 15:30 Asia/Manila

test('analytics range defaults to the latest 14 Manila calendar days', () => {
  const range = parseAnalyticsDateRange({}, NOW);

  assert.equal(range.start, '2026-09-02');
  assert.equal(range.end, '2026-09-15');
  assert.equal(range.days, 14);
  assert.equal(range.timezone, 'Asia/Manila');
  assert.equal(range.startAt.toISOString(), '2026-09-01T16:00:00.000Z');
  assert.equal(range.endExclusive.toISOString(), '2026-09-15T16:00:00.000Z');
});

test('analytics range accepts an explicit inclusive date range', () => {
  const range = parseAnalyticsDateRange({ start: '2026-09-01', end: '2026-09-07' }, NOW);

  assert.equal(range.start, '2026-09-01');
  assert.equal(range.end, '2026-09-07');
  assert.equal(range.days, 7);
});

test('analytics range rejects missing pair values', () => {
  assert.throws(() => parseAnalyticsDateRange({ start: '2026-09-01' }, NOW), {
    message: 'start and end must be provided together.',
    status: 400,
  });
});

test('analytics range rejects invalid and reversed calendar dates', () => {
  assert.throws(() => parseAnalyticsDateRange({ start: '2026-02-30', end: '2026-03-01' }, NOW), {
    message: 'start is not a valid calendar date.',
    status: 400,
  });
  assert.throws(() => parseAnalyticsDateRange({ start: '2026-09-10', end: '2026-09-01' }, NOW), {
    message: 'start must be on or before end.',
    status: 400,
  });
});

test('analytics range rejects periods beyond the bounded maximum', () => {
  assert.equal(ANALYTICS_DATE_RANGE_LIMITS.maxDays, 90);
  assert.throws(() => parseAnalyticsDateRange({ start: '2026-01-01', end: '2026-04-15' }, NOW), {
    message: 'Analytics date range cannot exceed 90 days.',
    status: 400,
  });
});

test('buildDateMatch creates half-open MongoDB date bounds', () => {
  const range = parseAnalyticsDateRange({ start: '2026-09-01', end: '2026-09-01' }, NOW);
  const match = buildDateMatch('forecastDate', range);

  assert.equal(match.forecastDate.$gte.toISOString(), '2026-08-31T16:00:00.000Z');
  assert.equal(match.forecastDate.$lt.toISOString(), '2026-09-01T16:00:00.000Z');
});
