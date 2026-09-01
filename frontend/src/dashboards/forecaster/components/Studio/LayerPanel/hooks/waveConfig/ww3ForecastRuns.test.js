import { describe, expect, it } from 'vitest';

import { resolveECWAMForecastRun, resolveWW3ForecastRun } from './ww3ForecastRuns';

describe('resolveECWAMForecastRun', () => {
  it('keeps the existing chart-type defaults', () => {
    expect(resolveECWAMForecastRun({ forecastDate: '2026-09-01', chartType: 'analysis' })).toMatchObject({
      forecastHour: 0,
      runDateTime: '2026090100',
      runTag: '2026SEP01/2026090100',
    });

    expect(resolveECWAMForecastRun({ forecastDate: '2026-09-01', chartType: '24h forecast' })).toMatchObject({
      forecastHour: 24,
      runDateTime: '2026090200',
      runTag: '2026SEP01/2026090200',
    });

    expect(resolveECWAMForecastRun({ forecastDate: '2026-09-01', chartType: '36h forecast' })).toMatchObject({
      forecastHour: 36,
      runDateTime: '2026090212',
      runTag: '2026SEP01/2026090212',
    });

    expect(resolveECWAMForecastRun({ forecastDate: '2026-09-01', chartType: '48h forecast' })).toMatchObject({
      forecastHour: 48,
      runDateTime: '2026090300',
      runTag: '2026SEP01/2026090300',
    });
  });

  it('uses an explicit hourly frame instead of the chart-type default', () => {
    expect(
      resolveECWAMForecastRun({
        forecastDate: '2026-09-01',
        chartType: '24h forecast',
        forecastHour: 4,
      })
    ).toMatchObject({
      forecastHour: 4,
      runDateTime: '2026090104',
      runTag: '2026SEP01/2026090104',
    });
  });

  it('crosses UTC day boundaries correctly for hourly navigation', () => {
    expect(resolveECWAMForecastRun({ forecastDate: '2026-09-01', forecastHour: 23 })).toMatchObject({
      runDateTime: '2026090123',
    });
    expect(resolveECWAMForecastRun({ forecastDate: '2026-09-01', forecastHour: 25 })).toMatchObject({
      runDateTime: '2026090201',
    });
    expect(resolveECWAMForecastRun({ forecastDate: '2026-09-01', forecastHour: 48 })).toMatchObject({
      runDateTime: '2026090300',
    });
  });

  it('falls back to chart-type resolution when an explicit hour is invalid', () => {
    expect(
      resolveECWAMForecastRun({
        forecastDate: '2026-09-01',
        chartType: '24h forecast',
        forecastHour: 49,
      })
    ).toMatchObject({
      forecastHour: 24,
      runDateTime: '2026090200',
    });
  });
});

describe('resolveWW3ForecastRun', () => {
  it('is unaffected by ECWAM hourly navigation support', () => {
    expect(resolveWW3ForecastRun({ forecastDate: '2026-09-01', chartType: '24h forecast' })).toMatchObject({
      runDateTime: '2026090118',
      runTag: '2026SEP01/2026090118',
    });
  });
});
