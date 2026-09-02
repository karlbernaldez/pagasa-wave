import { describe, expect, it } from 'vitest';

import {
  getECWAMForecastHours,
  resolveECWAMForecastRun,
  resolveWW3ForecastRun,
} from './ww3ForecastRuns';

describe('resolveECWAMForecastRun', () => {
  it('keeps the existing chart-type defaults', () => {
    expect(
      resolveECWAMForecastRun({ forecastDate: '2026-09-01', chartType: 'analysis' })
    ).toMatchObject({ forecastHour: 0, runDateTime: '2026090100' });
    expect(
      resolveECWAMForecastRun({ forecastDate: '2026-09-01', chartType: '24h forecast' })
    ).toMatchObject({ forecastHour: 24, runDateTime: '2026090200' });
    expect(
      resolveECWAMForecastRun({ forecastDate: '2026-09-01', chartType: '36h forecast' })
    ).toMatchObject({ forecastHour: 36, runDateTime: '2026090212' });
    expect(
      resolveECWAMForecastRun({ forecastDate: '2026-09-01', chartType: '48h forecast' })
    ).toMatchObject({ forecastHour: 48, runDateTime: '2026090300' });
  });

  it('uses explicit valid three-hour frames through T+60', () => {
    expect(
      resolveECWAMForecastRun({ forecastDate: '2026-09-01', forecastHour: 3 })
    ).toMatchObject({ forecastHour: 3, runDateTime: '2026090103' });
    expect(
      resolveECWAMForecastRun({ forecastDate: '2026-09-01', forecastHour: 60 })
    ).toMatchObject({ forecastHour: 60, runDateTime: '2026090312' });
  });

  it('falls back to chart-type resolution when an explicit hour is off cadence', () => {
    expect(
      resolveECWAMForecastRun({
        forecastDate: '2026-09-01',
        chartType: '24h forecast',
        forecastHour: 25,
      })
    ).toMatchObject({ forecastHour: 24, runDateTime: '2026090200' });
  });
});

describe('getECWAMForecastHours', () => {
  it('returns the TL chart windows on the 3-hour cadence', () => {
    expect(getECWAMForecastHours('analysis')).toEqual([0]);
    expect(getECWAMForecastHours('24h forecast')).toEqual([
      0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33,
    ]);
    expect(getECWAMForecastHours('36h forecast')).toEqual([27, 30, 33, 36, 39, 42, 45]);
    expect(getECWAMForecastHours('48h forecast')).toEqual([39, 42, 45, 48, 51, 54, 57, 60]);
  });
});

describe('resolveWW3ForecastRun', () => {
  it('is unaffected by ECWAM forecast-window support', () => {
    expect(
      resolveWW3ForecastRun({ forecastDate: '2026-09-01', chartType: '24h forecast' })
    ).toMatchObject({
      runDateTime: '2026090118',
      runTag: '2026SEP01/2026090118',
    });
  });
});
