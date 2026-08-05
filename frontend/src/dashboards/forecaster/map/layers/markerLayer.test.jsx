import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  fetchFeatures,
  updateFeatureCoordinates,
  makeMarkerDraggable,
} = vi.hoisted(() => ({
  fetchFeatures: vi.fn(),
  updateFeatureCoordinates: vi.fn(),
  makeMarkerDraggable: vi.fn(() => vi.fn()),
}));

vi.mock('@/api/featureServices', () => ({
  fetchFeatures,
  updateFeatureCoordinates,
}));
vi.mock('@dashboards/forecaster/history/annotationHistoryEvents', () => ({
  publishAnnotationHistoryCommand: vi.fn(),
  requestAnnotationHistoryRefresh: vi.fn(),
}));
vi.mock('@dashboards/forecaster/map/helpers/markerDrag', () => ({
  makeMarkerDraggable,
}));

import { applyRuntimeMarkerStyle, saveMarker } from './markerLayer';

function createMap() {
  const sources = new Map();
  const layers = new Map();

  return {
    sources,
    layers,
    getSource: vi.fn((id) => sources.get(id)),
    addSource: vi.fn((id, definition) => {
      sources.set(id, {
        _data: definition.data,
        setData(data) {
          this._data = data;
        },
      });
    }),
    removeSource: vi.fn((id) => sources.delete(id)),
    getLayer: vi.fn((id) => layers.get(id)),
    addLayer: vi.fn((layer) => layers.set(layer.id, layer)),
    removeLayer: vi.fn((id) => layers.delete(id)),
    getStyle: vi.fn(() => ({
      layers: Array.from(layers.values()),
      sources: Object.fromEntries(
        Array.from(sources.entries()).map(([id, source]) => [id, { data: source._data }])
      ),
    })),
    setLayoutProperty: vi.fn(),
    setPaintProperty: vi.fn(),
  };
}

function persistedTextFeature(overrides = {}) {
  return {
    _id: 'annotation-1',
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [120, 15] },
    properties: {
      sourceId: 'annotation-1',
      stableId: 'annotation-1',
      annotationId: 'annotation-1',
      mapLayerId: 'annotation-1',
      markerType: 'text_note',
      type: 'text_note',
      name: 'test',
      title: 'test',
      displayName: 'test',
      labelValue: 'test',
      project: 'project-1',
      style: { textSize: 22 },
      layerAliases: ['text_note_test'],
      ...overrides,
    },
  };
}

describe('markerLayer canonical rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('projectId', 'project-1');
    fetchFeatures.mockResolvedValue([persistedTextFeature()]);
  });

  it('hydrates persisted identity before rendering and creates only one symbol layer', async () => {
    const map = createMap();
    const setShowTitleModal = vi.fn();

    await saveMarker(
      { lng: 120, lat: 15 },
      { current: map },
      setShowTitleModal,
      'text_note'
    )('test');

    expect(fetchFeatures).toHaveBeenCalledWith('project-1');
    expect(map.addSource).toHaveBeenCalledTimes(1);
    expect(map.addSource).toHaveBeenCalledWith(
      'annotation-1',
      expect.objectContaining({ type: 'geojson' })
    );
    expect(map.addLayer).toHaveBeenCalledTimes(1);
    expect(map.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'annotation-1', source: 'annotation-1', type: 'symbol' })
    );
    expect(map.layers.has('text_note_test')).toBe(false);
    expect(map.setLayoutProperty).toHaveBeenCalledWith('annotation-1', 'text-size', 22);
    expect(setShowTitleModal).toHaveBeenCalledWith(false);
  });

  it('removes a legacy duplicate before rendering the canonical annotation', async () => {
    const map = createMap();
    const legacyFeature = persistedTextFeature({
      sourceId: 'text_note_test',
      stableId: 'annotation-1',
      annotationId: 'annotation-1',
      mapLayerId: 'text_note_test',
    });
    map.sources.set('text_note_test', {
      _data: legacyFeature,
      setData(data) {
        this._data = data;
      },
    });
    map.layers.set('text_note_test', {
      id: 'text_note_test',
      source: 'text_note_test',
      type: 'symbol',
    });

    await saveMarker(
      { lng: 120, lat: 15 },
      { current: map },
      vi.fn(),
      'text_note'
    )('test');

    expect(map.removeLayer).toHaveBeenCalledWith('text_note_test');
    expect(map.removeSource).toHaveBeenCalledWith('text_note_test');
    expect(map.layers.has('annotation-1')).toBe(true);
  });

  it('applies only the changed text size to the canonical live layer', () => {
    const map = createMap();
    map.sources.set('annotation-1', {
      _data: persistedTextFeature(),
      setData(data) {
        this._data = data;
      },
    });
    map.layers.set('annotation-1', {
      id: 'annotation-1',
      source: 'annotation-1',
      type: 'symbol',
    });

    const applied = applyRuntimeMarkerStyle(
      map,
      {
        sourceID: 'annotation-1',
        mapLayerId: 'annotation-1',
        type: 'text_note',
        properties: {
          sourceId: 'annotation-1',
          stableId: 'annotation-1',
          annotationId: 'annotation-1',
          mapLayerId: 'annotation-1',
          markerType: 'text_note',
        },
      },
      { textSize: 28 }
    );

    expect(applied).toBe(true);
    expect(map.setLayoutProperty).toHaveBeenCalledWith('annotation-1', 'text-size', 28);
    expect(map.setPaintProperty).not.toHaveBeenCalled();
    expect(map.sources.get('annotation-1')._data.properties.style.textSize).toBe(28);
  });
});
