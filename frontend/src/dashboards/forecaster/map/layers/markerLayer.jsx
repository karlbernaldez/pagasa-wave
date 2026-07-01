import { makeMarkerDraggable } from '@dashboards/forecaster/map/helpers/markerDrag';
import { updateFeatureCoordinates } from '@/api/featureServices'; // your API call

// Track cleanup functions so we can remove drag listeners if needed
const dragCleanupRegistry = new Map(); // sourceId -> cleanup fn

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
  const aliases = Array.from(new Set([
    sourceId,
    layerId,
    `${markerType}_${title}`,
    `${markerType}_${displayName}`,
    ...(options.layerAliases || []),
  ].map((value) => String(value || '').trim()).filter(Boolean)));

  const feature = {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [lng, lat] },
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
    },
  };

  // Support both raw map instance and React ref
  const map = mapRef?.current ?? mapRef;
  if (!map) return;

  // ── Add source ────────────────────────────────────────────
  if (!map.getSource(sourceId)) {
    try {
      map.addSource(sourceId, { type: 'geojson', data: feature });
    } catch (err) {
      console.error(`❌ Failed to add source "${sourceId}":`, err);
      return;
    }
  }

  // ── Build layout ──────────────────────────────────────────
  const layout = markerType === 'text_note'
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
    layout['text-offset'] = [
      'case',
      ['==', ['get', 'markerType'], 'low_pressure'], [0, 1.0],
      [0, 1.25],
    ];
    layout['text-anchor'] = 'top';
    layout['text-allow-overlap'] = true;
    layout['text-size'] = [
      'case',
      ['==', ['get', 'markerType'], 'low_pressure'], 12,
      ['==', ['get', 'markerType'], 'high_pressure'], 12,
      12,
    ];
  }

  // ── Build paint ───────────────────────────────────────────
  const paint = {};
  if (markerType === 'text_note') {
    paint['text-color'] = '#0f172a';
    paint['text-halo-color'] = '#ffffff';
    paint['text-halo-width'] = 1.5;
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
      ['any',
        ['==', ['get', 'markerType'], 'low_pressure'],
        ['==', ['get', 'markerType'], 'high_pressure'],
      ],
      0,
      1,
    ];
  }

  // ── Add layer ─────────────────────────────────────────────
  if (!map.getLayer(layerId)) {
    try {
      map.addLayer({ id: layerId, type: 'symbol', source: sourceId, slot: 'top', layout, paint });
    } catch (err) {
      console.error(`❌ Failed to add layer "${layerId}":`, err);
      return;
    }
  }

  // ── Make draggable ────────────────────────────────────────
  // Clean up any previous drag listeners for this marker (e.g. on reload)
  dragCleanupRegistry.get(sourceId)?.();

  const cleanup = makeMarkerDraggable(
    map,
    layerId,
    sourceId,
    async ({ lng: newLng, lat: newLat }) => {
      // ✅ Persist new coordinates to backend
      try {
        await updateFeatureCoordinates(sourceId, [newLng, newLat]);
      } catch (err) {
        console.error('Failed to persist marker position:', err);
      }
    }
  );

  dragCleanupRegistry.set(sourceId, cleanup);
  setShowTitleModal(false);
};

/**
 * Call this when removing a marker to clean up drag listeners.
 */
export function removeMarkerDrag(sourceId) {
  dragCleanupRegistry.get(sourceId)?.();
  dragCleanupRegistry.delete(sourceId);
}
