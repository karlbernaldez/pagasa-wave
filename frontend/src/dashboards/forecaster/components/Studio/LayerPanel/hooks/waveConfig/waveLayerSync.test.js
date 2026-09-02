import { describe, expect, it, vi } from 'vitest';

import { syncWaveContourLayers, syncWaveRasterLayers } from './waveLayerSync';

const createMap = () => {
  const sources = {};
  const layers = [];
  const listeners = new Map();

  const map = {
    addLayer: vi.fn((layer) => {
      layers.push(layer);
    }),
    addSource: vi.fn((id, source) => {
      const mockedSource = { ...source };

      if (source.type === 'raster') {
        mockedSource.setTiles = vi.fn((tiles) => {
          mockedSource.tiles = tiles;
        });
      }

      if (source.type === 'geojson') {
        mockedSource.setData = vi.fn((data) => {
          mockedSource.data = data;
        });
      }

      sources[id] = mockedSource;
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
    triggerRepaint: vi.fn(),
    isSourceLoaded: vi.fn(() => false),
    on: vi.fn((event, handler) => {
      const handlers = listeners.get(event) ?? new Set();
      handlers.add(handler);
      listeners.set(event, handlers);
    }),
    off: vi.fn((event, handler) => {
      listeners.get(event)?.delete(handler);
    }),
    emit(event, payload) {
      listeners.get(event)?.forEach((handler) => handler(payload));
    },
  };

  return map;
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
  it('does not create an ECWAM raster source before the frame is ready', () => {
    const map = createMap();

    syncWaveRasterLayers(map, ['ECWAM'], true, false, false, pendingPackage);

    expect(map.addSource).not.toHaveBeenCalled();
  });

  it('creates the first ECWAM raster in the active crossfade slot', () => {
    const map = createMap();

    syncWaveRasterLayers(map, ['ECWAM'], true, false, false, readyPackage);

    expect(map.addSource).toHaveBeenCalledWith(
      'ecwam-crossfade-source-a',
      expect.objectContaining({
        type: 'raster',
        tiles: ['/wavetiles/ECWAM/light/2026SEP01/2026090100/{z}/{x}/{y}.png'],
      })
    );
    expect(map.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'ecwam-crossfade-layer-a',
        paint: expect.objectContaining({ 'raster-opacity': 1 }),
      }),
      'graticules'
    );
  });

  it('keeps the old ECWAM raster visible until the new frame is loaded, then crossfades', () => {
    vi.useFakeTimers();
    const map = createMap();

    syncWaveRasterLayers(map, ['ECWAM'], true, false, false, readyPackage);
    map.removeLayer.mockClear();
    map.removeSource.mockClear();
    map.setPaintProperty.mockClear();

    syncWaveRasterLayers(map, ['ECWAM'], true, false, false, {
      ...readyPackage,
      ecwamForecastHour: 3,
    });

    expect(map.getSource('ecwam-crossfade-source-a')).toBeTruthy();
    expect(map.getSource('ecwam-crossfade-source-b')).toBeTruthy();
    expect(map.removeSource).not.toHaveBeenCalledWith('ecwam-crossfade-source-a');
    expect(map.addLayer).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: 'ecwam-crossfade-layer-b',
        paint: expect.objectContaining({ 'raster-opacity': 0 }),
      }),
      'graticules'
    );

    map.emit('sourcedata', {
      sourceId: 'ecwam-crossfade-source-b',
      isSourceLoaded: true,
    });

    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'ecwam-crossfade-layer-a',
      'raster-opacity',
      0
    );
    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'ecwam-crossfade-layer-b',
      'raster-opacity',
      1
    );

    vi.advanceTimersByTime(500);
    expect(map.removeSource).toHaveBeenCalledWith('ecwam-crossfade-source-a');
    vi.useRealTimers();
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

  it('updates ECWAM contour data in place when stepping to another ready frame', () => {
    const map = createMap();
    syncWaveContourLayers(map, ['ECWAM'], true, false, readyPackage);

    const source = map.getSource('wave-contours-ECWAM');
    map.removeSource.mockClear();

    syncWaveContourLayers(map, ['ECWAM'], true, false, {
      ...readyPackage,
      ecwamForecastHour: 3,
    });

    expect(source.setData).toHaveBeenCalledWith(
      '/wavetiles/ECWAM/contours/2026SEP01/2026090103/contours.geojson'
    );
    expect(map.removeSource).not.toHaveBeenCalledWith('wave-contours-ECWAM');
  });
});

describe('WW3 forecast navigation', () => {
  const ww3Package = {
    forecastDate: '2026-09-01',
    chartType: '24h forecast',
    ww3ForecastHour: 24,
  };

  it('creates the first WW3 raster in the active crossfade slot', () => {
    const map = createMap();

    syncWaveRasterLayers(map, ['WW3'], true, false, false, ww3Package);

    expect(map.addSource).toHaveBeenCalledWith(
      'ww3-crossfade-source-a',
      expect.objectContaining({
        type: 'raster',
        tiles: ['/wavetiles/WW3/light/2026SEP01/2026090118/{z}/{x}/{y}.png'],
      })
    );
    expect(map.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'ww3-crossfade-layer-a',
        paint: expect.objectContaining({ 'raster-opacity': 1 }),
      }),
      'graticules'
    );
  });

  it('keeps the old WW3 raster visible until the new frame is loaded, then crossfades', () => {
    vi.useFakeTimers();
    const map = createMap();

    syncWaveRasterLayers(map, ['WW3'], true, false, false, ww3Package);
    map.removeLayer.mockClear();
    map.removeSource.mockClear();
    map.setPaintProperty.mockClear();

    syncWaveRasterLayers(map, ['WW3'], true, false, false, {
      ...ww3Package,
      ww3ForecastHour: 27,
    });

    expect(map.getSource('ww3-crossfade-source-a')).toBeTruthy();
    expect(map.getSource('ww3-crossfade-source-b')).toBeTruthy();
    expect(map.removeSource).not.toHaveBeenCalledWith('ww3-crossfade-source-a');
    expect(map.addLayer).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: 'ww3-crossfade-layer-b',
        paint: expect.objectContaining({ 'raster-opacity': 0 }),
      }),
      'graticules'
    );

    map.emit('sourcedata', {
      sourceId: 'ww3-crossfade-source-b',
      isSourceLoaded: true,
    });

    expect(map.setPaintProperty).toHaveBeenCalledWith('ww3-crossfade-layer-a', 'raster-opacity', 0);
    expect(map.setPaintProperty).toHaveBeenCalledWith('ww3-crossfade-layer-b', 'raster-opacity', 1);

    vi.advanceTimersByTime(500);
    expect(map.removeSource).toHaveBeenCalledWith('ww3-crossfade-source-a');
    vi.useRealTimers();
  });

  it('updates WW3 contour data in place when stepping to another frame', () => {
    const map = createMap();
    syncWaveContourLayers(map, ['WW3'], true, false, ww3Package);

    const source = map.getSource('wave-contours-WW3');
    expect(source.data).toBe('/wavetiles/WW3/contours/2026SEP01/2026090118/contours.geojson');

    syncWaveContourLayers(map, ['WW3'], true, false, {
      ...ww3Package,
      ww3ForecastHour: 27,
    });

    expect(source.setData).toHaveBeenCalledWith(
      '/wavetiles/WW3/contours/2026SEP01/2026090121/contours.geojson'
    );
    expect(map.removeSource).not.toHaveBeenCalledWith('wave-contours-WW3');
  });
});
