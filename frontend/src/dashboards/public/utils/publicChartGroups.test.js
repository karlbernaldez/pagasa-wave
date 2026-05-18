import { describe, expect, it } from 'vitest';

import {
  PUBLIC_CHART_SLOTS,
  filterProjectsToPublicChartWindow,
  getPublicChartAvailableCount,
  getPublicChartCardDescription,
  getPublicChartTenDayWindow,
  groupPublicChartHistory,
  groupPublicChartsByTypeForDate,
  isEmptyPublicChartDescription,
  toPublicChartDateKey,
} from './publicChartGroups';

const owner = { firstName: 'DOST', lastName: 'PAGASA', username: 'pagasa' };

function project(overrides = {}) {
  return {
    _id: overrides._id || Math.random().toString(36).slice(2),
    name: overrides.name || 'Wave Chart',
    chartType: overrides.chartType || 'analysis',
    forecastDate: overrides.forecastDate || '2026-05-18T00:00:00.000Z',
    publishedAt: overrides.publishedAt || '2026-05-18T12:00:00.000Z',
    owner,
    ...overrides,
  };
}

describe('publicChartGroups', () => {
  it('normalizes valid forecast dates to stable date keys', () => {
    expect(toPublicChartDateKey('2026-05-18T12:30:00.000Z')).toBe('2026-05-18');
    expect(toPublicChartDateKey('invalid')).toBe('');
    expect(toPublicChartDateKey(null)).toBe('');
  });

  it('builds a 10-day public chart window from the latest available date', () => {
    const window = getPublicChartTenDayWindow([
      project({ forecastDate: '2026-05-12T00:00:00.000Z' }),
      project({ forecastDate: '2026-05-18T00:00:00.000Z' }),
    ]);

    expect(window).toEqual({
      latestDate: '2026-05-18',
      startDate: '2026-05-08',
    });
  });

  it('filters projects to the latest 10-day public chart window', () => {
    const projects = [
      project({ _id: 'old', forecastDate: '2026-05-01T00:00:00.000Z' }),
      project({ _id: 'inside', forecastDate: '2026-05-08T00:00:00.000Z' }),
      project({ _id: 'latest', forecastDate: '2026-05-18T00:00:00.000Z' }),
    ];

    expect(filterProjectsToPublicChartWindow(projects).map((item) => item._id)).toEqual(['inside', 'latest']);
  });

  it('groups charts by type for a selected date and keeps the latest published chart per type', () => {
    const grouped = groupPublicChartsByTypeForDate([
      project({ _id: 'older-analysis', chartType: 'analysis', publishedAt: '2026-05-18T08:00:00.000Z' }),
      project({ _id: 'latest-analysis', chartType: 'analysis', publishedAt: '2026-05-18T12:00:00.000Z' }),
      project({ _id: 'twenty-four', chartType: 'forecast_24h', publishedAt: '2026-05-18T10:00:00.000Z' }),
      project({ _id: 'other-date', chartType: 'forecast_36h', forecastDate: '2026-05-17T00:00:00.000Z' }),
    ], '2026-05-18');

    expect(grouped.get('analysis')._id).toBe('latest-analysis');
    expect(grouped.get('forecast_24h')._id).toBe('twenty-four');
    expect(grouped.has('forecast_36h')).toBe(false);
    expect(getPublicChartAvailableCount(grouped)).toBe(2);
  });

  it('groups recent history by date in newest-first order', () => {
    expect(groupPublicChartHistory([
      project({ forecastDate: '2026-05-17T00:00:00.000Z' }),
      project({ forecastDate: '2026-05-18T00:00:00.000Z' }),
      project({ forecastDate: '2026-05-18T00:00:00.000Z' }),
    ])).toEqual([
      { dateKey: '2026-05-18', count: 2 },
      { dateKey: '2026-05-17', count: 1 },
    ]);
  });

  it('detects stale empty-state descriptions and replaces them for published charts', () => {
    const slot = PUBLIC_CHART_SLOTS[0];
    const chart = project({
      description: 'No published analysis chart is available for this date yet.',
    });

    expect(isEmptyPublicChartDescription(chart.description)).toBe(true);
    expect(getPublicChartCardDescription({
      chart,
      slot,
      hasChart: true,
      formatDate: () => 'May 18, 2026',
      getPersonName: () => 'DOST PAGASA',
    })).toBe('Analysis Chart for May 18, 2026 published by DOST PAGASA.');
  });

  it('keeps real custom descriptions for published charts', () => {
    const slot = PUBLIC_CHART_SLOTS[1];
    const chart = project({ description: 'Moderate seas expected over northern waters.' });

    expect(getPublicChartCardDescription({
      chart,
      slot,
      hasChart: true,
      formatDate: () => 'May 18, 2026',
      getPersonName: () => 'DOST PAGASA',
    })).toBe('Moderate seas expected over northern waters.');
  });

  it('uses empty-state copy only for missing chart slots', () => {
    expect(getPublicChartCardDescription({
      chart: null,
      slot: PUBLIC_CHART_SLOTS[2],
      hasChart: false,
      formatDate: () => 'May 18, 2026',
      getPersonName: () => 'DOST PAGASA',
    })).toBe('No published 36-hour chart is available for this date yet.');
  });
});
