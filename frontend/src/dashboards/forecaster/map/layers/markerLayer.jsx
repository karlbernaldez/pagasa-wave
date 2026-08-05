import { fetchFeatures, updateFeatureCoordinates } from '@/api/featureServices';
import {
  publishAnnotationHistoryCommand,
  requestAnnotationHistoryRefresh,
} from '@dashboards/forecaster/history/annotationHistoryEvents';
import { makeMarkerDraggable } from '@dashboards/forecaster/map/helpers/markerDrag';

const dragCleanupRegistry = new Map();
const markerStyleRevisions = new Map();
const projectFeatureRequests = new Map();
const TEXT_STYLE_DEFAULTS = {
  textSize: 16,
  textColor: '#0f172a',
  textHaloColor: '#ffffff',
  textHaloWidth: 1.5,
  textLetterSpacing: 0,
  textTransform: 'none',
};

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

function getPersistedMarkerId(feature) {
  const properties = feature?.properties || {};
  return (
    feature?.sourceId ||
    properties.sourceId ||
    properties.stableId ||
    properties.annotationId ||
    feature?._id ||
    feature?.id ||
    ''
  );
}

function getPersistedMarkerStyle(feature) {
  return feature?.properties?.style || feature?.style || {};
}

function getMarkerRevision(sourceId) {
  return markerStyleRevisions.get(sourceId) || 0;
}

function bumpMarkerRevision(sourceId) {
  const nextRevision = getMarkerRevision(sourceId) + 1;
  markerStyleRevisions.set(sourceId, nextRevision);
  return nextRevision;
}

function normalizeFeatureResponse(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.features)) return response.features;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

function fetchProjectFeatures(projectId) {
  if (!projectId) return Promise.resolve([]);
  if (projectFeatureRequests.has(projectId)) return projectFeatureRequests.get(projectId);

  const request = fetchFeatures(projectId)
    .then(normalizeFeatureResponse)
    .finally(() => {
      window.setTimeout(() => projectFeatureRequests.delete(projectId), 0);
    });

  projectFeatureRequests.set(projectId, request);
  return request;
}

function getMarkerIdentity(layerInfo) {
  const properties = layerInfo?.properties || {};
  const sourceIds = new Set([
    layerInfo?.sourceID,
    layerInfo?.sourceId,
    layerInfo?.source,
    properties.sourceId,
    properties.stableId,
    properties.annotationId,
  ].filter(Boolean));
  const layerIds = new Set([
    layerInfo?.mapLayerId,
    properties.mapLayerId,
    ...(properties.layerAliases || []),
  ].filter(Boolean));
  const markerType = properties.markerType || properties.type || layerInfo?.type;
  const displayName = layerInfo?.name || properties.displayName || properties.name || properties.title || properties.labelValue;

  if (markerType && displayName) layerIds.add(`${markerType}_${displayName}`);
  return { sourceIds, layerIds, markerType };
}

function applyMarkerStyle(map, layerId, markerType, style = {}) {
  if (!map?.getLayer?.(layerId)) return false;

  const mergedStyle = markerType === 'text_note'
    ? { ...TEXT_STYLE_DEFAULTS, ...style }
    : style;
  const layoutProperties = {
    'icon-size': mergedStyle.iconSize,
    'icon-rotate': mergedStyle.iconRotate,
    'text-size': mergedStyle.textSize,
    'text-letter-spacing': mergedStyle.textLetterSpacing,
    'text-transform': mergedStyle.textTransform,
  };
  const paintProperties = {
    'icon-opacity': mergedStyle.iconOpacity,
    'text-color': mergedStyle.textColor,
    'text-halo-color': mergedStyle.textHaloColor,
    'text-halo-width': mergedStyle.textHaloWidth,
  };

  let applied = false;
  Object.entries(layoutProperties).forEach(([property, value]) => {
    if (value === undefined || value === null) return;
    try {
      map.setLayoutProperty(layerId, property, value);
      applied = true;
    } catch (error) {
      console.warn('[MARKER STYLE LAYOUT ERROR]', { layerId, property, value, error });
    }
  });
  Object.entries(paintProperties).forEach(([property, value]) => {
    if (value === undefined || value === null) return;
    try {
      map.setPaintProperty(layerId, property, value);
      applied = true;
    } catch (error) {
      console.warn('[MARKER STYLE PAINT ERROR]', { layerId, property, value, error });
    }
  });
  return applied;
}

export function applyRuntimeMarkerStyle(map, layerInfo, style = {}) {
  if (!map) return false;

  const { sourceIds, layerIds, markerType } = getMarkerIdentity(layerInfo);
  const styleLayers = map.getStyle?.()?.layers || [];
  styleLayers.forEach((layer) => {
    if (layer?.type !== 'symbol') return;
    if (sourceIds.has(layer.source) || layerIds.has(layer.id)) {
      layerIds.add(layer.id);
      if (layer.source) sourceIds.add(layer.source);
    }
  });

  let applied = false;
  layerIds.forEach((layerId) => {
    applied = applyMarkerStyle(map, layerId, markerType, style) || applied;
  });

  sourceIds.forEach((sourceId) => {
    bumpMarkerRevision(sourceId);
    const source = map.getSource?.(sourceId);
    const data = getSourceData(map, sourceId);
    const feature = getFirstFeature(data);
    if (!source?.setData || !feature) return;

    source.setData({
      ...feature,
      properties: {
        ...(feature.properties || {}),
        style: { ...(feature.properties?.style || {}), ...style },
      },
    });
  });

  return applied;
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
    ) return;

    dragCleanupRegistry.get(layer.source)?.();
    dragCleanupRegistry.delete(layer.source);
    markerStyleRevisions.delete(layer.source);
    if (map.getLayer?.(layer.id)) map.removeLayer(layer.id);
    if (map.getSource?.(layer.source)) map.removeSource(layer.source);
  });
}

async function findPersistedMarker({ projectId, markerType, displayName, coordinates }) {
  if (!projectId) return null;

  try {
    const features = await fetchProjectFeatures(projectId);
    const expectedName = normalizeName(displayName);
    const candidates = features.filter((feature) => {
      const properties = feature?.properties || {};
      const featureType = properties.markerType || properties.type;
      const featureName = normalizeName(
        properties.displayName || feature?.name || properties.name || properties.title || properties.labelValue
      );
      return featureType === markerType && featureName === expectedName;
    });

    return (
      candidates.find((feature) => coordinatesMatch(feature?.geometry?.coordinates, coordinates)) ||
      (candidates.length === 1 ? candidates[0] : null)
    );
  } catch (error) {
    console.warn('[MARKER HYDRATION ERROR]', error);
    return null;
  }
}

async function resolvePersistedSourceId({ projectId, markerType, displayName, previousCoordinates, fallback }) {
  const matchedFeature = await findPersistedMarker({
    projectId,
    markerType,
    displayName,
    coordinates: previousCoordinates,
  });
  return getPersistedMarkerId(matchedFeature) || fallback;
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
  const initialStyle = markerType === 'text_note'
    ? { ...TEXT_STYLE_DEFAULTS, ...(options.style || {}) }
    : { ...(options.style || {}) };
  const aliases = Array.from(new Set([
    sourceId,
    layerId,
    `${markerType}_${title}`,
    `${markerType}_${displayName}`,
    ...(options.layerAliases || []),
  ].map((value) => String(value || '').trim()).filter(Boolean)));

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
      stableId: options.stableId || sourceId,
      annotationId: options.annotationId || sourceId,
      mapLayerId: layerId,
      layerAliases: aliases,
      project: projectId,
      style: initialStyle,
    },
  };

  const map = mapRef?.current ?? mapRef;
  if (!map) return;

  removeDuplicateMarkerArtifacts(map, layerId, sourceId, markerType, displayName, coordinates);

  const existingSource = map.getSource(sourceId);
  if (existingSource?.setData) existingSource.setData(feature);
  else {
    try {
      map.addSource(sourceId, { type: 'geojson', data: feature });
    } catch (error) {
      console.error(`Failed to add source "${sourceId}":`, error);
      return;
    }
  }

  const layout = markerType === 'text_note'
    ? {
        'text-field': ['get', 'title'],
        'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
        'text-anchor': 'center',
        'text-allow-overlap': true,
        'text-size': initialStyle.textSize,
        'text-letter-spacing': initialStyle.textLetterSpacing,
        'text-transform': initialStyle.textTransform,
      }
    : {
        'icon-image': ['get', 'icon'],
        'icon-size': [
          'case',
          ['==', ['get', 'markerType'], 'low_pressure'], 0.015,
          ['==', ['get', 'markerType'], 'high_pressure'], 0.015,
          ['==', ['get', 'markerType'], 'less_1'], 0.28,
          0.03,
        ],
        'icon-allow-overlap': true,
      };

  if (markerType !== 'less_1' && markerType !== 'text_note') {
    layout['text-field'] = ['get', 'title'];
    layout['text-font'] = ['Open Sans Semibold', 'Arial Unicode MS Bold'];
    layout['text-offset'] = ['case', ['==', ['get', 'markerType'], 'low_pressure'], [0, 1.0], [0, 1.25]];
    layout['text-anchor'] = 'top';
    layout['text-allow-overlap'] = true;
    layout['text-size'] = 12;
  }

  const paint = {};
  if (markerType === 'text_note') {
    paint['text-color'] = initialStyle.textColor;
    paint['text-halo-color'] = initialStyle.textHaloColor;
    paint['text-halo-width'] = initialStyle.textHaloWidth;
  } else if (markerType !== 'less_1') {
    paint['text-color'] = [
      'case',
      ['==', ['get', 'markerType'], 'low_pressure'], 'red',
      ['==', ['get', 'markerType'], 'high_pressure'], 'blue',
      'purple',
    ];
    paint['text-halo-color'] = '#FFFFFF';
    paint['text-halo-width'] = 1;
    paint['text-opacity'] = [
      'case',
      ['any', ['==', ['get', 'markerType'], 'low_pressure'], ['==', ['get', 'markerType'], 'high_pressure']],
      0,
      1,
    ];
  }

  if (!map.getLayer(layerId)) {
    try {
      map.addLayer({ id: layerId, type: 'symbol', source: sourceId, slot: 'top', layout, paint });
    } catch (error) {
      console.error(`Failed to add layer "${layerId}":`, error);
      return;
    }
  }

  applyMarkerStyle(map, layerId, markerType, initialStyle);
  const hydrationRevision = getMarkerRevision(sourceId);

  if (!options.skipHydration) {
    void findPersistedMarker({ projectId, markerType, displayName, coordinates }).then((persistedFeature) => {
      if (!persistedFeature || getMarkerRevision(sourceId) !== hydrationRevision) return;

      const persistedProperties = persistedFeature.properties || {};
      const persistedId = getPersistedMarkerId(persistedFeature) || sourceId;
      const persistedStyle = markerType === 'text_note'
        ? { ...TEXT_STYLE_DEFAULTS, ...getPersistedMarkerStyle(persistedFeature) }
        : getPersistedMarkerStyle(persistedFeature);
      const hydratedFeature = {
        ...feature,
        properties: {
          ...feature.properties,
          ...persistedProperties,
          sourceId: persistedId,
          stableId: persistedProperties.stableId || persistedId,
          annotationId: persistedProperties.annotationId || persistedId,
          mapLayerId: layerId,
          layerAliases: Array.from(new Set([
            ...aliases,
            persistedId,
            persistedProperties.mapLayerId,
            ...(persistedProperties.layerAliases || []),
          ].filter(Boolean))),
          style: persistedStyle,
        },
      };

      map.getSource(sourceId)?.setData?.(hydratedFeature);
      applyMarkerStyle(map, layerId, markerType, persistedStyle);
    });
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
      } catch (error) {
        console.error('Failed to persist marker position:', error);
        map.getSource(sourceId)?.setData?.({
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
  markerStyleRevisions.delete(sourceId);
}
