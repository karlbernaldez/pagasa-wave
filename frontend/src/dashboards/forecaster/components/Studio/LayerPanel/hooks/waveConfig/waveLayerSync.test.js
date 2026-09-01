import { describe, expect, it, vi } from 'vitest';

import { syncWaveContourLayers, syncWaveRasterLayers } from './waveLayerSync';

const createMap = () => {
  const sources = {};
  const layers = [];

  return {
    addLayer: vi.fn((layer) => {
      layers.push(layer);
    }),
    addSource: vi.fn((id, source) => {
      sources[id] = source;
    }),
    getLayer: vi.fn((id) => layers.find((layer) => layer.id === id)),
    getSource: vi.fn((id) => sources[id]),
    getStyle: vi.fn(() => ({ layers, sources })),
    removeLayer: vi.fn((id) => {
      const index = layers.findIndex((layer) => layer.id === id);
      if (index >= 0) layers.splice(index, 1);
    }),
    removeSource: vi.fn((id) => {
      delete sources[id];
    }),
    setLayoutProperty: vi.fn(),
    setPaintProperty: vi.fn(),
  };
};

const pendingPackage = {
  forecastDate: '2026-09-01',
  chartType: 'analysis',
  ecwamForecastHour: 0,
  ecwamFrameReady: false,
};

const readyPackage = {
  ...pendingPackage,
  ecwamFrameReady: true,
};

describe('ECWAM readiness gating', () => {
  it('does not create or replace an ECWAM raster source before the frame is ready', () => {
    const map = createMap();

    syncWaveRasterLayers(map, ['ECWAM'], true, false, false, pendingPackage);

    expect(map.addSource).not.toHaveBeenCalled();

    syncWaveRasterLayers(map, ['ECWAM'], true, false, false, readyPackage);

    expect(map.addSource).toHaveBeenCalledWith(
      'wave-source-model-ECWAM',
      expect.objectContaining({
        type: 'raster',
        tiles: ['/wavetiles/ECWAM/light/2026SEP01/2026090100/{z}/{x}/{y}.png'],
      })
    );
  });

  it('does not create or replace ECWAM contours before the frame is ready', () => {
    const map = createMap();

    syncWaveContourLayers(map, ['ECWAM'], true, false, pendingPackage);

    expect(map.addSource).not.toHaveBeenCalled();

    syncWaveContourLayers(map, ['ECWAM'], true, false, readyPackage);

    expect(map.addSource).toHaveBeenCalledWith('wave-contours-ECWAM', {
      type: 'geojson',
      data: '/wavetiles/ECWAM/contours/2026SEP01/2026090100/contours.geojson',
    });
  });
});
