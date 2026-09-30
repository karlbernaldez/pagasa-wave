import { describe, expect, it, vi } from 'vitest';

import { syncWaveContourLayers, syncWaveRasterLayers } from './waveLayerSync';

const createMap = () => {
  const sources = {};
  const layers = [
    { id: 'background', type: 'background' },
    { id: 'ocean-water', type: 'fill', source: 'basemap', 'source-layer': 'water' },
    { id: 'land-fill', type: 'fill', source: 'basemap', 'source-layer': 'land' },
    { id: 'place-label', type: 'symbol', source: 'basemap', 'source-layer': 'place_label' },
  ];
  const listeners = new Map();

  const map = {
    addLayer: vi.fn((layer, beforeId) => {
      const index = beforeId ? layers.findIndex((item) => item.id === beforeId) : -1;
      if (index >= 0) layers.splice(index, 0, layer);
      else layers.push(layer);
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
    moveLayer: vi.fn((id, beforeId) => {
      const currentIndex = layers.findIndex((layer) => layer.id === id);
      if (currentIndex < 0) return;
      const [layer] = layers.splice(currentIndex, 1);
      const beforeIndex = beforeId ? layers.findIndex((item) => item.id === beforeId) : -1;
      if (beforeIndex >= 0) layers.splice(beforeIndex, 0, layer);
      else layers.push(layer);
    }),
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
  ecwamSourceCycle: '2026090100',
  ecwamFrameReady: false,
};

const readyPackage = {
  ...pendingPackage,
  ecwamFrameReady: true,
};

describe('wave overlay layer ordering', () => {
  it('inserts wave overlays above water and before land/labels', () => {
    const map = createMap();

    syncWaveRasterLayers(
      map,
      ['WW3'],
      true,
      false,
      false,
      {
        forecastDate: '2026-09-30',
        chartType: '24h forecast',
        ww3ForecastHour: 24,
        ww3SourceCycle: '2026093000',
      }
    );

    expect(map.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'ww3-crossfade-layer-a', type: 'raster' }),
      'land-fill'
    );

    const layerIds = map.getStyle().layers.map((layer) => layer.id);
    expect(layerIds.indexOf('ocean-water')).toBeLessThan(layerIds.indexOf('ww3-crossfade-layer-a'));
    expect(layerIds.indexOf('ww3-crossfade-layer-a')).toBeLessThan(layerIds.indexOf('land-fill'));
    expect(layerIds.indexOf('ww3-crossfade-layer-a')).toBeLessThan(layerIds.indexOf('place-label'));
  });

  it('repositions an existing wave raster when the layer stack changes', () => {
    const map = createMap();
    const forecastPackage = {
      forecastDate: '2026-09-30',
      chartType: '24h forecast',
      ww3ForecastHour: 24,
      ww3SourceCycle: '2026093000',
    };

    syncWaveRasterLayers(map, ['WW3'], true, false, false, forecastPackage);
    map.moveLayer.mockClear();

    syncWaveRasterLayers(map, ['WW3'], true, false, false, forecastPackage);

    expect(map.moveLayer).toHaveBeenCalledWith('ww3-crossfade-layer-a', 'land-fill');
  });
});

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
      'land-fill'
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
      'land-fill'
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
    ww3SourceCycle: '2026090100',
  };

  it('creates the first WW3 raster in the active crossfade slot', () => {
    const map = createMap();

    syncWaveRasterLayers(map, ['WW3'], true, false, false, ww3Package);

    expect(map.addSource).toHaveBeenCalledWith(
      'ww3-crossfade-source-a',
      expect.objectContaining({
        type: 'raster',
        tiles: ['/wavetiles/WW3/light/2026SEP01/2026090200/{z}/{x}/{y}.png'],
      })
    );
    expect(map.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'ww3-crossfade-layer-a',
        paint: expect.objectContaining({ 'raster-opacity': 1 }),
      }),
      'land-fill'
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
      'land-fill'
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
    expect(source.data).toBe('/wavetiles/WW3/contours/2026SEP01/2026090200/contours.geojson');

    syncWaveContourLayers(map, ['WW3'], true, false, {
      ...ww3Package,
      ww3ForecastHour: 27,
    });

    expect(source.setData).toHaveBeenCalledWith(
      '/wavetiles/WW3/contours/2026SEP01/2026090203/contours.geojson'
    );
    expect(map.removeSource).not.toHaveBeenCalledWith('wave-contours-WW3');
  });
});
