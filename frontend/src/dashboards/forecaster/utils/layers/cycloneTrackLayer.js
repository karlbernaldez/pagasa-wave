const CYCLONE_TRACK_API = 'https://www.panahon.gov.ph/api/v1/cyclone-track?';

export const CYCLONE_TRACK_STORAGE_KEY = 'CYCLONE_TRACK';

const SOURCE_ID = 'cyclone-track-source';
const RADIUS_FILL_LAYER_ID = 'cyclone-track-radius-fill';
const RADIUS_OUTLINE_LAYER_ID = 'cyclone-track-radius-outline';
const LINE_LAYER_ID = 'cyclone-track-line';
const POINT_LAYER_ID = 'cyclone-track-points';
const TYPE_LABEL_LAYER_ID = 'cyclone-track-type-labels';
const TIME_LABEL_LAYER_ID = 'cyclone-track-time-labels';
const LAYER_IDS = [
  RADIUS_FILL_LAYER_ID,
  RADIUS_OUTLINE_LAYER_ID,
  LINE_LAYER_ID,
  POINT_LAYER_ID,
  TYPE_LABEL_LAYER_ID,
  TIME_LABEL_LAYER_ID,
];

const TYPE_COLORS = {
  LPA: '#64748b',
  TD: '#2563eb',
  TS: '#1d4ed8',
  STS: '#1e40af',
  TY: '#4338ca',
  STY: '#7c3aed',
  AA: '#0891b2',
};

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const getVisibility = (visible) => (visible ? 'visible' : 'none');

const safeSetVisibility = (map, layerId, visible) => {
  if (map?.getLayer?.(layerId)) {
    map.setLayoutProperty(layerId, 'visibility', getVisibility(visible));
  }
};

const sortEntries = (info = {}) => Object.entries(info)
  .sort(([a], [b]) => new Date(a.replace(' ', 'T')) - new Date(b.replace(' ', 'T')));

function buildCirclePolygon([centerLng, centerLat], radiusKm, steps = 72) {
  const coordinates = [];
  const latRadians = centerLat * Math.PI / 180;
  const kmPerDegreeLat = 110.574;
  const kmPerDegreeLng = Math.max(1, 111.320 * Math.cos(latRadians));

  for (let i = 0; i <= steps; i += 1) {
    const angle = (i / steps) * Math.PI * 2;
    coordinates.push([
      centerLng + (Math.cos(angle) * radiusKm) / kmPerDegreeLng,
      centerLat + (Math.sin(angle) * radiusKm) / kmPerDegreeLat,
    ]);
  }

  return coordinates;
}

function normalizeCycloneTrack(payload) {
  const cyclones = Array.isArray(payload) ? payload : [];
  const features = [];

  cyclones.forEach((cyclone, cycloneIndex) => {
    const entries = sortEntries(cyclone?.info);
    const trackCoordinates = [];

    entries.forEach(([timestamp, point], pointIndex) => {
      const latitude = toNumber(point?.latitude);
      const longitude = toNumber(point?.longitude);
      if (latitude === null || longitude === null) return;

      const cycloneType = String(point?.cyclone_type || '').trim() || 'TC';
      const radius = Math.max(0, toNumber(point?.radius) || 0);
      const isLatest = pointIndex === entries.length - 1;
      const coordinate = [longitude, latitude];
      trackCoordinates.push(coordinate);

      if (radius > 0) {
        features.push({
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [buildCirclePolygon(coordinate, radius)] },
          properties: {
            kind: 'radius',
            cycloneName: cyclone?.cyclone_name || 'Cyclone',
            cycloneType,
            color: TYPE_COLORS[cycloneType] || '#2563eb',
            radius,
            timestamp,
          },
        });
      }

      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: coordinate },
        properties: {
          kind: 'point',
          cycloneName: cyclone?.cyclone_name || 'Cyclone',
          cycloneType,
          color: TYPE_COLORS[cycloneType] || '#2563eb',
          date: point?.date || '',
          time: point?.time || '',
          timestamp,
          label: cycloneType,
          timeLabel: isLatest ? `${cyclone?.cyclone_name || 'Cyclone'} ${point?.date || ''} ${point?.time || ''}`.trim() : '',
          latest: isLatest,
        },
      });
    });

    if (trackCoordinates.length >= 2) {
      features.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: trackCoordinates },
        properties: {
          kind: 'track',
          cycloneName: cyclone?.cyclone_name || `Cyclone ${cycloneIndex + 1}`,
          color: '#1f2937',
        },
      });
    }
  });

  return { type: 'FeatureCollection', features };
}

async function fetchCycloneTrackData() {
  const response = await fetch(CYCLONE_TRACK_API, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Cyclone track request failed (${response.status})`);
  return normalizeCycloneTrack(await response.json());
}

function addLayerIfMissing(map, layer) {
  if (!map.getLayer(layer.id)) map.addLayer(layer);
}

function addCycloneTrackLayers(map, visible) {
  const visibility = getVisibility(visible);

  addLayerIfMissing(map, {
    id: RADIUS_FILL_LAYER_ID,
    type: 'fill',
    source: SOURCE_ID,
    filter: ['==', ['get', 'kind'], 'radius'],
    layout: { visibility },
    paint: {
      'fill-color': '#94a3b8',
      'fill-opacity': 0.18,
    },
  });

  addLayerIfMissing(map, {
    id: RADIUS_OUTLINE_LAYER_ID,
    type: 'line',
    source: SOURCE_ID,
    filter: ['==', ['get', 'kind'], 'radius'],
    layout: { visibility, 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': '#cbd5e1',
      'line-width': 1,
      'line-dasharray': [3, 3],
      'line-opacity': 0.85,
    },
  });

  addLayerIfMissing(map, {
    id: LINE_LAYER_ID,
    type: 'line',
    source: SOURCE_ID,
    filter: ['==', ['get', 'kind'], 'track'],
    layout: { visibility, 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': '#111827',
      'line-width': 1.5,
      'line-opacity': 0.82,
    },
  });

  addLayerIfMissing(map, {
    id: POINT_LAYER_ID,
    type: 'circle',
    source: SOURCE_ID,
    filter: ['==', ['get', 'kind'], 'point'],
    layout: { visibility },
    paint: {
      'circle-radius': ['case', ['get', 'latest'], 6.5, 7.5],
      'circle-color': ['get', 'color'],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1.5,
      'circle-opacity': 1,
    },
  });

  addLayerIfMissing(map, {
    id: TYPE_LABEL_LAYER_ID,
    type: 'symbol',
    source: SOURCE_ID,
    filter: ['==', ['get', 'kind'], 'point'],
    layout: {
      visibility,
      'text-field': ['get', 'label'],
      'text-size': 10,
      'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
      'text-allow-overlap': true,
      'text-ignore-placement': true,
    },
    paint: {
      'text-color': '#ffffff',
      'text-halo-color': '#1d4ed8',
      'text-halo-width': 0.4,
    },
  });

  addLayerIfMissing(map, {
    id: TIME_LABEL_LAYER_ID,
    type: 'symbol',
    source: SOURCE_ID,
    filter: ['all', ['==', ['get', 'kind'], 'point'], ['!=', ['get', 'timeLabel'], '']],
    layout: {
      visibility,
      'text-field': ['get', 'timeLabel'],
      'text-size': 10,
      'text-anchor': 'left',
      'text-offset': [1.1, 0.8],
      'text-font': ['Open Sans Semibold', 'Arial Unicode MS Regular'],
      'text-allow-overlap': false,
    },
    paint: {
      'text-color': '#0f172a',
      'text-halo-color': '#ffffff',
      'text-halo-width': 1.1,
    },
  });
}

export async function ensureCycloneTrackLayer(map, visible = true) {
  if (!map) return;
  const data = await fetchCycloneTrackData();

  if (map.getSource(SOURCE_ID)) {
    map.getSource(SOURCE_ID).setData(data);
  } else {
    map.addSource(SOURCE_ID, { type: 'geojson', data });
  }

  addCycloneTrackLayers(map, visible);
  setCycloneTrackVisibility(map, visible);
}

export function setCycloneTrackVisibility(map, visible) {
  LAYER_IDS.forEach((layerId) => safeSetVisibility(map, layerId, visible));
}
