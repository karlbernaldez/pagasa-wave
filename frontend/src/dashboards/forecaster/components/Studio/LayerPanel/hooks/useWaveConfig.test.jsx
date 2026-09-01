import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { registerMapInstance } from '@dashboards/forecaster/map/helpers/mapInstance';
import { useWaveConfig } from './useWaveConfig';

const mocks = vi.hoisted(() => ({
  addWaveLayer: vi.fn(() => Promise.resolve()),
  syncAllWaveLayers: vi.fn(),
  readWaveStorage: vi.fn(() => ({
    enabled: true,
    models: ['WW3'],
    elements: { height: true },
    directionStyle: {},
  })),
  saveEnabled: vi.fn(),
  saveModels: vi.fn(),
  saveElements: vi.fn(),
  saveDirectionStyle: vi.fn(),
}));

vi.mock('@dashboards/forecaster/map/layers/waveLayer', () => ({
  addWaveLayer: mocks.addWaveLayer,
}));

vi.mock('./waveConfig/waveLayerSync', () => ({
  syncAllWaveLayers: mocks.syncAllWaveLayers,
}));

vi.mock('./waveConfig/useWaveStorage', () => ({
  useWaveStorage: () => ({
    readWaveStorage: mocks.readWaveStorage,
    saveEnabled: mocks.saveEnabled,
    saveModels: mocks.saveModels,
    saveElements: mocks.saveElements,
    saveDirectionStyle: mocks.saveDirectionStyle,
  }),
}));

vi.mock('../../Menu/hooks/useProjectData', () => ({
  useProjectData: () => ({
    chartType: 'analysis',
    forecastDate: '2026-08-04',
  }),
}));

describe('useWaveConfig hydration', () => {
  afterEach(() => {
    registerMapInstance(null);
    vi.clearAllMocks();
  });

  it('restores an enabled saved wave layer when the map registers after mount', async () => {
    const map = {
      getStyle: () => ({ layers: [] }),
      isStyleLoaded: () => true,
    };
    const mapRef = { current: null };

    renderHook(() => useWaveConfig({ mapRef, isDarkMode: false }));

    expect(mocks.addWaveLayer).not.toHaveBeenCalled();

    act(() => {
      registerMapInstance(map);
    });

    await waitFor(() => {
      expect(mocks.addWaveLayer).toHaveBeenCalledWith(map, false, ['WW3']);
    });

    await waitFor(() => {
      expect(mocks.syncAllWaveLayers).toHaveBeenCalledWith(
        map,
        expect.objectContaining({ enabled: true, models: ['WW3'] }),
        false,
        expect.any(Object),
        expect.objectContaining({
          chartType: 'analysis',
          forecastDate: '2026-08-04',
        })
      );
    });
  });

  it('waits for the map load event before adding saved wave layers', async () => {
    let loadHandler;
    const map = {
      getStyle: () => ({ layers: [] }),
      isStyleLoaded: () => false,
      once: vi.fn((event, handler) => {
        if (event === 'load') loadHandler = handler;
      }),
      off: vi.fn(),
    };
    const mapRef = { current: null };

    renderHook(() => useWaveConfig({ mapRef, isDarkMode: true }));

    act(() => {
      registerMapInstance(map);
    });

    expect(map.once).toHaveBeenCalledWith('load', expect.any(Function));
    expect(mocks.addWaveLayer).not.toHaveBeenCalled();

    await act(async () => {
      loadHandler();
      await Promise.resolve();
    });

    expect(mocks.addWaveLayer).toHaveBeenCalledWith(map, true, ['WW3']);
  });
});
