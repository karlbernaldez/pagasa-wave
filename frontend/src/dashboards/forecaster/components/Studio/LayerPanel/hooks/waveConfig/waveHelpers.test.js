import { describe, expect, it } from 'vitest';

import { buildWaveContourUrl, buildWaveTileUrl } from './waveHelpers';

describe('ECWAM three-hour wave URLs', () => {
  it('builds raster URLs for an explicit forecast hour', () => {
    const url = buildWaveTileUrl({
      model: 'ECWAM',
      theme: 'light',
      forecastDate: '2026-09-01',
      chartType: '24h forecast',
      forecastHour: 3,
    });

    expect(url).toContain('/ECWAM/light/2026SEP01/2026090103/{z}/{x}/{y}.png');
  });

  it('builds contour URLs for the same explicit frame', () => {
    const url = buildWaveContourUrl({
      model: 'ECWAM',
      forecastDate: '2026-09-01',
      chartType: '36h forecast',
      forecastHour: 27,
    });

    expect(url).toContain('/ECWAM/contours/2026SEP01/2026090203/contours.geojson');
  });

  it('does not apply ECWAM forecastHour to WW3 URL resolution', () => {
    const url = buildWaveTileUrl({
      model: 'WW3',
      theme: 'dark',
      forecastDate: '2026-09-01',
      chartType: '24h forecast',
      forecastHour: 3,
    });

    expect(url).toContain('/WW3/dark/2026SEP01/2026090118/{z}/{x}/{y}.png');
  });
});
