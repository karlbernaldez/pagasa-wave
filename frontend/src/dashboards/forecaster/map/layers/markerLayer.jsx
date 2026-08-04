import { fetchFeatures, updateFeatureCoordinates } from '@/api/featureServices';
import {
  publishAnnotationHistoryCommand,
  requestAnnotationHistoryRefresh,
} from '@dashboards/forecaster/history/annotationHistoryEvents';
import { makeMarkerDraggable } from '@dashboards/forecaster/map/helpers/markerDrag';

const dragCleanupRegistry = new Map();

function getSourceData(map, sourceId) {
  const source = map.getSource?.(sourceId);
  return source?._data || map.getStyle?.()?.sources?.[sourceId]?.data || null;
}

function getFirstFeature(data) {
  if (data?.type === 'Feature') return data;
  if (data?.type === 'FeatureCollection') return data.features?.[0] || null;
  return null;
}

function normalizeName(value) {
  return String(value || '').trim().toLowerCase();
}

function coordinatesMatch(left, right, tolerance = 0.000001) {
  return (
    Array.isArray(left) &&
    Array.isArray(right) &&
    left.length >= 2 &&
    right.length >= 2 &&
    Math.abs(Number(left[0]) - Number(right[0])) <= tolerance &&
    Math.abs(Number(left[1]) - Number(right[1])) <= tolerance
  );
}

function removeDuplicateMarkerArtifacts(map, targetLayerId, targetSourceId, markerType, displayName, coordinates) {
  const layers = map.getStyle?.()?.layers || [];
  const expectedName = normalizeName(displayName);

  layers.forEach((layer) => {
    if (layer?.type !== 'symbol' || typeof layer.source !== 'string') return;
    if (layer.id === targetLayerId && layer.source === targetSourceId) return;

    const sourceFeature = getFirstFeature(getSourceData(map, layer.source));
    const properties = sourceFeature?.properties || {};
    const sourceMarkerType = properties.markerType || properties.type;
    const sourceName = normalizeName(
      properties.displayName || properties.name || properties.title || properties.labelValue
    );
    const sourceCoordinates = sourceFeature?.geometry?.coordinates;

    if (
      sourceMarkerType !== markerType ||
      sourceName !== expectedName ||
      !coordinatesMatch(sourceCoordinates, coordinates)
    ) {
      return;
    }

    dragCleanupRegistry.get(layer.source)?.();
    dragCleanupRegistry.delete(layer.source);
    if (map.getLayer?.(layer.id)) map.removeLayer(layer.id);
    if (map.getSource?.(layer.source)) map.removeSource(layer.source);
  });
}

async function resolvePersistedSourceId({ projectId, markerType, displayName, previousCoordinates, fallback }) {
  if (!projectId) return fallback;

  try {
    const features = await fetchFeatures(projectId);
    const expectedName = normalizeName(displayName);
    const candidates = (Array.isArray(features) ? features : []).filter((feature) => {
      const properties = feature?.properties || {};
      const featureType = properties.markerType || properties.type;
      const featureName = normalizeName(
        properties.displayName || feature?.name || properties.name || properties.title || properties.labelValue
      );

      return featureType === markerType && featureName === expectedName;
    });

    const coordinateMatch = candidates.find((feature) =>
      coordinatesMatch(feature?.geometry?.coordinates, previousCoordinates)
    );
    const matchedFeature = coordinateMatch || (candidates.length === 1 ? candidates[0] : null);

    return (
      matchedFeature?.sourceId ||
      matchedFeature?.properties?.sourceId ||
      matchedFeature?.properties?.stableId ||
      fallback
    );
  } catch (error) {
    console.warn('[MARKER ID RESOLUTION ERROR]', error);
    return fallback;
  }
}

export const saveMarker = (selectedPoint, mapRef, setShowTitleModal, type) => (title, options = {}) => {
  if (!selectedPoint) return;

  const { lng, lat } = selectedPoint;

  const iconMap = {
    typhoon: 'typhoon',
    low_pressure: 'low_pressure',
    high_pressure: 'high_pressure',
    less_1: 'less_1',
    text_note: null,
  };

  const defaultTitles = {
    typhoon: 'Typhoon',
    low_pressure: 'LPA',
    high_pressure: 'HPA',
    less_1: '<1',
    text_note: 'Text Label',
  };

  const markerType = type;
  const iconName = iconMap[markerType];
  const sourceId = options.sourceId || `${markerType}_${title}`;
  const layerId = options.layerId || sourceId;
  const labelValue = options.labelValue || title || defaultTitles[markerType];
  const displayName = options.displayName || title || defaultTitles[markerType];
  const projectId = options.projectId || localStorage.getItem('projectId') || '';
  const coordinates = [lng, lat];
  const aliases = Array.from(
    new Set(
      [
        sourceId,
        layerId,
        `${markerType}_${title}`,
        `${markerType}_${displayName}`,
        ...(options.layerAliases || []),
      ]
        .map((value) => String(value || '').trim())
        .filter(Boolean)
    )
  );

  const feature = {
    type: 'Feature',
    geometry: { type: 'Point', coordinates },
    properties: {
      title: labelValue,
      name: displayName,
      displayName,
      labelValue,
      markerType,
      type: markerType,
      icon: iconName,
      sourceId,
      stableId: sourceId,
      annotationId: sourceId,
      mapLayerId: layerId,
      layerAliases: aliases,
      project: projectId,
    },
  };

  const map = mapRef?.current ?? mapRef;
  if (!map) return;

  removeDuplicateMarkerArtifacts(map, layerId, sourceId, markerType, displayName, coordinates);

  const existingSource = map.getSource(sourceId);
  if (existingSource?.setData) {
    existingSource.setData(feature);
  } else {
    try {
      map.addSource(sourceId, { type: 'geojson', data: feature });
    } catch (err) {
      console.error(`Failed to add source "${sourceId}":`, err);
      return;
    }
  }

  const layout =
    markerType === 'text_note'
      ? {
          'text-field': ['get', 'title'],
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-anchor': 'center',
          'text-allow-overlap': true,
          'text-size': 16,
        }
      : {
          'icon-image': ['get', 'icon'],
          'icon-size': [
            'case',
            ['==', ['get', 'markerType'], 'low_pressure'],
            0.015,
            ['==', ['get', 'markerType'], 'high_pressure'],
            0.015,
            ['==', ['get', 'markerType'], 'less_1'],
            0.28,
            0.03,
          ],
          'icon-allow-overlap': true,
        };

  if (markerType !== 'less_1' && markerType !== 'text_note') {
    layout['text-field'] = ['get', 'title'];
    layout['text-font'] = ['Open Sans Semibold', 'Arial Unicode MS Bold'];
    layout['text-offset'] = [
      'case',
      ['==', ['get', 'markerType'], 'low_pressure'],
      [0, 1.0],
      [0, 1.25],
    ];
    layout['text-anchor'] = 'top';
    layout['text-allow-overlap'] = true;
    layout['text-size'] = [
      'case',
      ['==', ['get', 'markerType'], 'low_pressure'],
      12,
      ['==', ['get', 'markerType'], 'high_pressure'],
      12,
      12,
    ];
  }

  const paint = {};
  if (markerType === 'text_note') {
    paint['text-color'] = '#0f172a';
    paint['text-halo-color'] = '#ffffff';
    paint['text-halo-width'] = 1.5;
  } else if (markerType !== 'less_1') {
    paint['text-color'] = [
      'case',
      ['==', ['get', 'markerType'], 'low_pressure'],
      'red',
      ['==', ['get', 'markerType'], 'high_pressure'],
      'blue',
      'purple',
    ];
    paint['text-halo-color'] = '#FFFFFF';
    paint['text-halo-width'] = 1;
    paint['text-opacity'] = [
      'case',
      [
        'any',
        ['==', ['get', 'markerType'], 'low_pressure'],
        ['==', ['get', 'markerType'], 'high_pressure'],
      ],
      0,
      1,
    ];
  }

  if (!map.getLayer(layerId)) {
    try {
      map.addLayer({ id: layerId, type: 'symbol', source: sourceId, slot: 'top', layout, paint });
    } catch (err) {
      console.error(`Failed to add layer "${layerId}":`, err);
      return;
    }
  }

  dragCleanupRegistry.get(sourceId)?.();

  const cleanup = makeMarkerDraggable(
    map,
    layerId,
    sourceId,
    async ({ coordinates: nextCoordinates, previousCoordinates }) => {
      const persistedSourceId = await resolvePersistedSourceId({
        projectId,
        markerType,
        displayName,
        previousCoordinates,
        fallback: sourceId,
      });

      try {
        await updateFeatureCoordinates(persistedSourceId, nextCoordinates);

        publishAnnotationHistoryCommand({
          label: `Move ${displayName || 'annotation'}`,
          undo: async () => {
            await updateFeatureCoordinates(persistedSourceId, previousCoordinates);
            requestAnnotationHistoryRefresh(projectId);
          },
          redo: async () => {
            await updateFeatureCoordinates(persistedSourceId, nextCoordinates);
            requestAnnotationHistoryRefresh(projectId);
          },
        });
      } catch (err) {
        console.error('Failed to persist marker position:', err);
        const source = map.getSource(sourceId);
        source?.setData({
          ...feature,
          geometry: { type: 'Point', coordinates: previousCoordinates },
        });
      }
    }
  );

  dragCleanupRegistry.set(sourceId, cleanup);
  setShowTitleModal(false);
};

export function removeMarkerDrag(sourceId) {
  dragCleanupRegistry.get(sourceId)?.();
  dragCleanupRegistry.delete(sourceId);
}
