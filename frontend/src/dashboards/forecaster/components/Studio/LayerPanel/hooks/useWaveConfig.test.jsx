import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { registerMapInstance } from '@dashboards/forecaster/map/helpers/mapInstance';
import { useWaveConfig } from './useWaveConfig';

const mocks = vi.hoisted(() => ({
  addWaveLayer: vi.fn(() => Promise.resolve()),
  ensureEcwamFrameReady: vi.fn(() => Promise.resolve({ state: 'ready' })),
  projectData: {
    chartType: 'analysis',
    forecastDate: '2026-08-04',
  },
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

vi.mock('@/api/ecwamFrames', () => ({
  ensureEcwamFrameReady: mocks.ensureEcwamFrameReady,
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
  useProjectData: () => ({ ...mocks.projectData }),
}));

const defaultWaveStorage = () => ({
  enabled: true,
  models: ['WW3'],
  elements: { height: true },
  directionStyle: {},
});

const ecwamWaveStorage = () => ({
  enabled: true,
  models: ['ECWAM'],
  elements: { raster: true },
  directionStyle: {},
});

const createReadyMap = () => ({
  getStyle: () => ({ layers: [] }),
  isStyleLoaded: () => true,
});

const hasReadyEcwamSync = () =>
  mocks.syncAllWaveLayers.mock.calls.some(
    ([, , , , forecastPackage]) => forecastPackage?.ecwamFrameReady === true
  );

describe('useWaveConfig hydration', () => {
  afterEach(() => {
    registerMapInstance(null);
    mocks.projectData.chartType = 'analysis';
    mocks.projectData.forecastDate = '2026-08-04';
    mocks.readWaveStorage.mockReturnValue(defaultWaveStorage());
    mocks.ensureEcwamFrameReady.mockResolvedValue({ state: 'ready' });
    vi.clearAllMocks();
  });

  it('restores an enabled saved wave layer when the map registers after mount', async () => {
    const map = createReadyMap();
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

  it('steps WW3 within the current chart window without a readiness request', () => {
    mocks.projectData.chartType = '24h forecast';

    const mapRef = { current: createReadyMap() };
    const { result } = renderHook(() => useWaveConfig({ mapRef, isDarkMode: false }));

    expect(result.current.waveConfig.ww3Frame).toMatchObject({
      state: 'ready',
      forecastHour: 24,
      minHour: 0,
      maxHour: 33,
    });

    act(() => {
      result.current.waveConfig.stepWW3ForecastHour(1);
    });

    expect(result.current.waveConfig.ww3Frame.forecastHour).toBe(27);
    expect(mocks.ensureEcwamFrameReady).not.toHaveBeenCalled();

    let invalidResult;
    act(() => {
      invalidResult = result.current.waveConfig.setWW3ForecastHour(60);
    });

    expect(invalidResult.state).toBe('invalid');
    expect(result.current.waveConfig.ww3Frame.forecastHour).toBe(27);
  });

  it('validates the default ECWAM frame before marking the package ready', async () => {
    mocks.readWaveStorage.mockReturnValue(ecwamWaveStorage());

    const map = createReadyMap();
    const mapRef = { current: map };

    const { result } = renderHook(() => useWaveConfig({ mapRef, isDarkMode: false }));

    await waitFor(() => {
      expect(mocks.ensureEcwamFrameReady).toHaveBeenCalledWith('2026-08-04', 0);
    });

    await waitFor(() => {
      expect(result.current.waveConfig.ecwamFrame.state).toBe('ready');
    });

    expect(hasReadyEcwamSync()).toBe(true);
  });

  it('revalidates the default ECWAM frame when the forecast package changes', async () => {
    mocks.readWaveStorage.mockReturnValue(ecwamWaveStorage());

    const map = createReadyMap();
    const mapRef = { current: map };

    const { rerender } = renderHook(() => useWaveConfig({ mapRef, isDarkMode: false }));

    await waitFor(() => {
      expect(mocks.ensureEcwamFrameReady).toHaveBeenCalledWith('2026-08-04', 0);
    });

    mocks.projectData.chartType = '24h forecast';
    mocks.projectData.forecastDate = '2026-08-05';
    rerender();

    await waitFor(() => {
      expect(mocks.ensureEcwamFrameReady).toHaveBeenCalledWith('2026-08-05', 24);
    });
  });

  it.each([
    ['busy', 'Another ECWAM frame is currently building.'],
    ['failed', 'ECWAM frame generation failed.'],
    ['rate_limited', 'Too many ECWAM frame requests.'],
    ['unavailable', 'ECWAM T+0 is not available for this package.'],
  ])('keeps ECWAM unapplied when default frame returns %s', async (state, message) => {
    mocks.readWaveStorage.mockReturnValue(ecwamWaveStorage());
    mocks.ensureEcwamFrameReady.mockResolvedValue({ state, message });

    const map = createReadyMap();
    const mapRef = { current: map };
    const { result } = renderHook(() => useWaveConfig({ mapRef, isDarkMode: false }));

    await waitFor(() => {
      expect(result.current.waveConfig.ecwamFrame.state).toBe(state);
    });

    expect(result.current.waveConfig.ecwamFrame.forecastHour).toBe(0);
    expect(result.current.waveConfig.ecwamFrame.message).toBe(message);
    expect(hasReadyEcwamSync()).toBe(false);
  });

  it('surfaces a thrown ECWAM readiness error as failed without applying the frame', async () => {
    mocks.readWaveStorage.mockReturnValue(ecwamWaveStorage());
    mocks.ensureEcwamFrameReady.mockRejectedValue(new Error('ECWAM backend unavailable'));

    const map = createReadyMap();
    const mapRef = { current: map };
    const { result } = renderHook(() => useWaveConfig({ mapRef, isDarkMode: false }));

    await waitFor(() => {
      expect(result.current.waveConfig.ecwamFrame.state).toBe('failed');
    });

    expect(result.current.waveConfig.ecwamFrame.message).toBe('ECWAM backend unavailable');
    expect(hasReadyEcwamSync()).toBe(false);
  });

  it('allows retrying the same default hour after a terminal ECWAM failure', async () => {
    mocks.readWaveStorage.mockReturnValue(ecwamWaveStorage());
    mocks.ensureEcwamFrameReady
      .mockResolvedValueOnce({ state: 'unavailable', message: 'Not available yet.' })
      .mockResolvedValueOnce({ state: 'ready' });

    const map = createReadyMap();
    const mapRef = { current: map };
    const { result } = renderHook(() => useWaveConfig({ mapRef, isDarkMode: false }));

    await waitFor(() => {
      expect(result.current.waveConfig.ecwamFrame.state).toBe('unavailable');
    });

    await act(async () => {
      await result.current.waveConfig.setEcwamForecastHour(0);
    });

    await waitFor(() => {
      expect(result.current.waveConfig.ecwamFrame.state).toBe('ready');
    });

    expect(mocks.ensureEcwamFrameReady).toHaveBeenCalledTimes(2);
    expect(hasReadyEcwamSync()).toBe(true);
  });
});
