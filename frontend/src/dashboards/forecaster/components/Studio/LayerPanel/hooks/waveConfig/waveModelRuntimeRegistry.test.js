import { beforeEach, describe, expect, it } from 'vitest';

import {
  getWaveModelRuntimeProfile,
  resolveManagedWaveRun,
  setWaveModelRuntimeCatalog,
} from './waveModelRuntimeRegistry';

const managedModel = {
  code: 'CUSTOM',
  runtimeConfigured: true,
  runtimeProfile: {
    mode: 'managed_timestamp',
    cycleDayOffset: -1,
    cycleHourUtc: 18,
    forecastCadenceHours: 3,
    maxForecastHour: 60,
    rasterScheme: 'xyz',
    bounds: [100, -5, 180, 50],
    contoursEnabled: false,
  },
};

describe('waveModelRuntimeRegistry', () => {
  beforeEach(() => {
    setWaveModelRuntimeCatalog([]);
  });

  it('stores only runtime-configured catalog entries', () => {
    setWaveModelRuntimeCatalog([
      managedModel,
      { code: 'INCOMPLETE', runtimeConfigured: false, runtimeProfile: managedModel.runtimeProfile },
    ]);

    expect(getWaveModelRuntimeProfile('custom')).toEqual(managedModel.runtimeProfile);
    expect(getWaveModelRuntimeProfile('INCOMPLETE')).toBeNull();
  });

  it('resolves the chart default against the configured cycle', () => {
    setWaveModelRuntimeCatalog([managedModel]);

    expect(
      resolveManagedWaveRun({
        model: 'CUSTOM',
        forecastDate: '2026-09-03',
        chartType: 'Forecast 24h',
      })
    ).toMatchObject({
      packageDate: '2026SEP03',
      runDateTime: '2026090318',
      runTag: '2026SEP03/2026090318',
      forecastHour: 24,
    });
  });

  it('snaps non-cadence explicit hours to the configured cadence and maximum', () => {
    setWaveModelRuntimeCatalog([managedModel]);

    expect(
      resolveManagedWaveRun({
        model: 'CUSTOM',
        forecastDate: '2026-09-03',
        chartType: '48h',
        forecastHour: 59,
      })
    ).toMatchObject({ forecastHour: 60, runDateTime: '2026090518' });
  });
});
