import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchFeatures } from '@/api/featureServices';
import { syncAnnotationFeaturesToMap } from '@dashboards/forecaster/utils/mapSetup';
import { useMapSetup } from './useStudio';

vi.mock('@/api/featureServices', () => ({ fetchFeatures: vi.fn() }));
vi.mock('@/api/projectAPI', () => ({ fetchProjectById: vi.fn() }));
vi.mock('@/socket/socketClient', () => ({
  default: {
    connected: false,
    connect: vi.fn(),
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}));
vi.mock('@dashboards/forecaster/utils/mapSetup', () => ({
  setupMap: vi.fn(),
  syncAnnotationFeaturesToMap: vi.fn(async () => {}),
}));
vi.mock('@dashboards/forecaster/utils/layers/annotationStylePersistence', () => ({
  applyAnnotationStylesToMap: vi.fn(),
}));

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function waveFeature(id) {
  return {
    sourceId: id,
    geometry: { type: 'LineString', coordinates: [[120, 15], [121, 16]] },
    properties: { project: 'project-1', type: 'Wave Height', labelValue: '2' },
  };
}

describe('useMapSetup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not let an older feature request clear or overwrite a newer map sync', async () => {
    const older = deferred();
    const newer = deferred();
    fetchFeatures
      .mockImplementationOnce(() => older.promise)
      .mockImplementationOnce(() => newer.promise);

    const { result } = renderHook(() => useMapSetup('project-1', null, false));
    result.current.mapRef.current = {};

    const olderLoad = result.current.setupFeaturesAndLayers({ syncMap: true });
    const newerLoad = result.current.setupFeaturesAndLayers({ syncMap: true });
    const newestFeatures = [waveFeature('wave-new')];

    let newerResult;
    await act(async () => {
      newer.resolve(newestFeatures);
      newerResult = await newerLoad;
    });

    let olderResult;
    await act(async () => {
      older.resolve([waveFeature('wave-old')]);
      olderResult = await olderLoad;
    });

    expect(newerResult).toEqual(newestFeatures);
    expect(olderResult).toBeNull();
    expect(syncAnnotationFeaturesToMap).toHaveBeenCalledTimes(1);
    expect(syncAnnotationFeaturesToMap).toHaveBeenCalledWith(
      result.current.mapRef.current,
      newestFeatures,
      expect.objectContaining({ isDarkMode: false })
    );
  });

  it('keeps the current map state when a refresh request fails', async () => {
    fetchFeatures.mockRejectedValueOnce(new Error('temporary network failure'));

    const { result } = renderHook(() => useMapSetup('project-1', null, false));
    result.current.mapRef.current = {};

    let loadResult;
    await act(async () => {
      loadResult = await result.current.setupFeaturesAndLayers({ syncMap: true });
    });

    expect(loadResult).toBeNull();
    expect(syncAnnotationFeaturesToMap).not.toHaveBeenCalled();
  });
});
