import { beforeEach, describe, expect, it, vi } from 'vitest';

const updateFeatureNameAPI = vi.fn();
const publishAnnotationHistoryCommand = vi.fn();
const requestAnnotationHistoryRefresh = vi.fn();

vi.mock('@/api/featureServices', () => ({ updateFeatureNameAPI }));
vi.mock('sweetalert2', () => ({ default: { fire: vi.fn() } }));
vi.mock('@dashboards/forecaster/history/annotationHistoryEvents', () => ({
  publishAnnotationHistoryCommand,
  requestAnnotationHistoryRefresh,
}));

import { updateLayerName } from './updateLayerName';

function createMap() {
  const source = {
    _data: {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [120, 15] },
      properties: {
        sourceId: 'annotation-1',
        stableId: 'annotation-1',
        annotationId: 'annotation-1',
        markerType: 'text_note',
        name: 'test',
        title: 'test',
        displayName: 'test',
        labelValue: 'test',
      },
    },
    setData: vi.fn(function setData(data) {
      this._data = data;
    }),
  };

  return {
    source,
    getLayer: vi.fn((id) => (id === 'annotation-1' ? { id, source: 'annotation-1' } : null)),
    getSource: vi.fn((id) => (id === 'annotation-1' ? source : null)),
    getStyle: vi.fn(() => ({
      layers: [{ id: 'annotation-1', source: 'annotation-1', type: 'symbol' }],
    })),
    setLayoutProperty: vi.fn(),
  };
}

function createLayer() {
  return {
    id: 'annotation-1',
    sourceID: 'annotation-1',
    sourceId: 'annotation-1',
    source: 'annotation-1',
    mapLayerId: 'annotation-1',
    name: 'test',
    type: 'text_note',
    properties: {
      sourceId: 'annotation-1',
      stableId: 'annotation-1',
      annotationId: 'annotation-1',
      mapLayerId: 'annotation-1',
      markerType: 'text_note',
      name: 'test',
      title: 'test',
      displayName: 'test',
      labelValue: 'test',
      project: 'project-1',
      layerAliases: ['annotation-1'],
    },
  };
}

function createState(initial) {
  let layers = initial;
  const setLayers = vi.fn((updater) => {
    layers = typeof updater === 'function' ? updater(layers) : updater;
  });
  return { setLayers, getLayers: () => layers };
}

describe('updateLayerName history replay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateFeatureNameAPI.mockResolvedValue({});
    localStorage.setItem('projectId', 'project-1');
  });

  it('renames immediately and records deterministic undo and redo commands', async () => {
    const map = createMap();
    const state = createState([createLayer()]);

    await updateLayerName('annotation-1', 'smoke', state.setLayers, map);

    expect(updateFeatureNameAPI).toHaveBeenLastCalledWith('annotation-1', 'smoke');
    expect(state.getLayers()[0].name).toBe('smoke');
    expect(map.source._data.properties.title).toBe('smoke');
    expect(map.setLayoutProperty).toHaveBeenCalledWith('annotation-1', 'text-field', 'smoke');

    const command = publishAnnotationHistoryCommand.mock.calls[0][0];
    await command.undo();

    expect(updateFeatureNameAPI).toHaveBeenLastCalledWith('annotation-1', 'test');
    expect(state.getLayers()[0].name).toBe('test');
    expect(map.source._data.properties.title).toBe('test');
    expect(map.setLayoutProperty).toHaveBeenLastCalledWith('annotation-1', 'text-field', 'test');

    await command.redo();

    expect(updateFeatureNameAPI).toHaveBeenLastCalledWith('annotation-1', 'smoke');
    expect(state.getLayers()[0].name).toBe('smoke');
    expect(map.source._data.properties.title).toBe('smoke');
    expect(map.setLayoutProperty).toHaveBeenLastCalledWith('annotation-1', 'text-field', 'smoke');
    expect(requestAnnotationHistoryRefresh).toHaveBeenCalledTimes(2);
  });
});
