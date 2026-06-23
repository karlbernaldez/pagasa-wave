const CYCLONE_TRACK_API = 'https://www.panahon.gov.ph/api/v1/cyclone-track?';

export const CYCLONE_TRACK_STORAGE_KEY = 'CYCLONE_TRACK';

const SOURCE_ID = 'cyclone-track-source';
const CONE_FILL_LAYER_ID = 'cyclone-track-cone-fill';
const CONE_OUTLINE_LAYER_ID = 'cyclone-track-cone-outline';
const LINE_LAYER_ID = 'cyclone-track-line';
const POINT_LAYER_ID = 'cyclone-track-points';
const TYPE_LABEL_LAYER_ID = 'cyclone-track-type-labels';
const TIME_LABEL_LAYER_ID = 'cyclone-track-time-labels';
const LAYER_IDS = [
  CONE_FILL_LAYER_ID,
  CONE_OUTLINE_LAYER_ID,
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
  TY: '#1d4ed8',
  STY: '#1d4ed8',
  AA: '#2563eb',
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

function getCompactTrackLabel(cycloneType) {
  if (cycloneType === 'LPA') return 'L';
  if (cycloneType === 'AA') return 'A';
  return 'T';
}

function getKmPerDegree(centerLat) {
  const latRadians = centerLat * Math.PI / 180;
  return {
    lat: 110.574,
    lng: Math.max(1, 111.320 * Math.cos(latRadians)),
  };
}

function offsetCoordinate([lng, lat], nx, ny, radiusKm) {
  const kmPerDegree = getKmPerDegree(lat);
  return [
    lng + (nx * radiusKm) / kmPerDegree.lng,
    lat + (ny * radiusKm) / kmPerDegree.lat,
  ];
}

function buildForecastConePolygon(points) {
  const forecastPoints = points.filter((point) => point.radius > 0);
  if (forecastPoints.length < 2) return null;

  const left = [];
  const right = [];

  forecastPoints.forEach((point, index) => {
    const previous = forecastPoints[Math.max(0, index - 1)];
    const next = forecastPoints[Math.min(forecastPoints.length - 1, index + 1)];
    const dx = next.longitude - previous.longitude;
    const dy = next.latitude - previous.latitude;
    const length = Math.hypot(dx, dy) || 1;
    const ux = dx / length;
    const uy = dy / length;
    const nx = -uy;
    const ny = ux;
    const coordinate = [point.longitude, point.latitude];

    left.push(offsetCoordinate(coordinate, nx, ny, point.radius));
    right.push(offsetCoordinate(coordinate, -nx, -ny, point.radius));
  });

  return [left.concat(right.reverse(), [left[0]])];
}

function normalizeCycloneTrack(payload) {
  const cyclones = Array.isArray(payload) ? payload : [];
  const features = [];

  cyclones.forEach((cyclone, cycloneIndex) => {
    const entries = sortEntries(cyclone?.info);
    const validPoints = [];

    entries.forEach(([timestamp, point]) => {
      const latitude = toNumber(point?.latitude);
      const longitude = toNumber(point?.longitude);
      if (latitude === null || longitude === null) return;

      validPoints.push({
        timestamp,
        date: point?.date || '',
        time: point?.time || '',
        latitude,
        longitude,
        cycloneType: String(point?.cyclone_type || '').trim() || 'TC',
        radius: Math.max(0, toNumber(point?.radius) || 0),
      });
    });

    const trackCoordinates = validPoints.map((point) => [point.longitude, point.latitude]);
    const coneCoordinates = buildForecastConePolygon(validPoints);

    if (coneCoordinates) {
      features.push({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: coneCoordinates },
        properties: {
          kind: 'forecastCone',
          cycloneName: cyclone?.cyclone_name || 'Cyclone',
        },
      });
    }

    validPoints.forEach((point, pointIndex) => {
      const isLatest = pointIndex === validPoints.length - 1;
      const coordinate = [point.longitude, point.latitude];

      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: coordinate },
        properties: {
          kind: 'point',
          cycloneName: cyclone?.cyclone_name || 'Cyclone',
          cycloneType: point.cycloneType,
          color: TYPE_COLORS[point.cycloneType] || '#2563eb',
          date: point.date,
          time: point.time,
          timestamp: point.timestamp,
          label: getCompactTrackLabel(point.cycloneType),
          timeLabel: isLatest ? `${cyclone?.cyclone_name || 'Cyclone'}\n${point.date} ${point.time}`.trim() : '',
          latest: isLatest,
          forecast: point.radius > 0,
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
          color: '#111827',
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
    id: CONE_FILL_LAYER_ID,
    type: 'fill',
    source: SOURCE_ID,
    filter: ['==', ['get', 'kind'], 'forecastCone'],
    layout: { visibility },
    paint: {
      'fill-color': '#cbd5e1',
      'fill-opacity': 0.18,
    },
  });

  addLayerIfMissing(map, {
    id: CONE_OUTLINE_LAYER_ID,
    type: 'line',
    source: SOURCE_ID,
    filter: ['==', ['get', 'kind'], 'forecastCone'],
    layout: { visibility, 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': '#e2e8f0',
      'line-width': 1,
      'line-dasharray': [4, 4],
      'line-opacity': 0.72,
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
      'line-width': 1.25,
      'line-opacity': 0.78,
    },
  });

  addLayerIfMissing(map, {
    id: POINT_LAYER_ID,
    type: 'circle',
    source: SOURCE_ID,
    filter: ['==', ['get', 'kind'], 'point'],
    layout: { visibility },
    paint: {
      'circle-radius': ['case', ['get', 'latest'], 6, 5.5],
      'circle-color': ['get', 'color'],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1.35,
      'circle-opacity': 0.98,
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
      'text-size': 9,
      'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
      'text-allow-overlap': true,
      'text-ignore-placement': true,
    },
    paint: {
      'text-color': '#ffffff',
      'text-halo-color': '#1e3a8a',
      'text-halo-width': 0.35,
    },
  });

  addLayerIfMissing(map, {
    id: TIME_LABEL_LAYER_ID,
    type: 'symbol',
    source: SOURCE_ID,
    filter: ['all', ['==', ['get', 'kind'], 'point'], ['==', ['get', 'latest'], true]],
    layout: {
      visibility,
      'text-field': ['get', 'timeLabel'],
      'text-size': 9,
      'text-anchor': 'left',
      'text-offset': [0.95, 0.75],
      'text-font': ['Open Sans Semibold', 'Arial Unicode MS Regular'],
      'text-allow-overlap': false,
    },
    paint: {
      'text-color': '#f8fafc',
      'text-halo-color': '#0f172a',
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
