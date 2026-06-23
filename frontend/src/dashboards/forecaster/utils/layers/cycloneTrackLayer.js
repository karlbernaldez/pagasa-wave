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

const popupListeners = new Set();
let cycloneTrackPopup = null;

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

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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

function buildConePoint(point, previous, next) {
  const dx = next.longitude - previous.longitude;
  const dy = next.latitude - previous.latitude;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const nx = -uy;
  const ny = ux;
  const coordinate = [point.longitude, point.latitude];

  return {
    coordinate,
    radius: point.radius,
    ux,
    uy,
    nx,
    ny,
    left: offsetCoordinate(coordinate, nx, ny, point.radius),
    right: offsetCoordinate(coordinate, -nx, -ny, point.radius),
  };
}

function buildCap(center, radiusKm, startAngle, endAngle, steps = 18) {
  const coordinates = [];
  let delta = endAngle - startAngle;
  if (delta < 0) delta += Math.PI * 2;

  for (let i = 0; i <= steps; i += 1) {
    const angle = startAngle + (delta * i) / steps;
    coordinates.push(offsetCoordinate(center, Math.cos(angle), Math.sin(angle), radiusKm));
  }

  return coordinates;
}

function buildForecastConePolygon(points) {
  const forecastPoints = points.filter((point) => point.radius > 0);
  if (forecastPoints.length < 2) return null;

  const conePoints = forecastPoints.map((point, index) => buildConePoint(
    point,
    forecastPoints[Math.max(0, index - 1)],
    forecastPoints[Math.min(forecastPoints.length - 1, index + 1)],
  ));

  const first = conePoints[0];
  const last = conePoints[conePoints.length - 1];
  const left = conePoints.map((point) => point.left);
  const right = conePoints.map((point) => point.right);

  const lastLeftAngle = Math.atan2(last.ny, last.nx);
  const lastRightAngle = Math.atan2(-last.ny, -last.nx);
  const firstRightAngle = Math.atan2(-first.ny, -first.nx);
  const firstLeftAngle = Math.atan2(first.ny, first.nx);

  const endCap = buildCap(last.coordinate, last.radius, lastLeftAngle, lastRightAngle);
  const startCap = buildCap(first.coordinate, first.radius, firstRightAngle, firstLeftAngle);
  const ring = left.concat(endCap.slice(1), right.reverse().slice(1), startCap.slice(1), [left[0]]);

  return [ring];
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
          latitude: point.latitude,
          longitude: point.longitude,
          radius: point.radius,
          pointLabel: `${point.date} ${point.time}`.trim(),
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

function createCyclonePointPopup(feature) {
  const properties = feature?.properties || {};
  const longitude = toNumber(properties.longitude);
  const latitude = toNumber(properties.latitude);
  const radius = toNumber(properties.radius) || 0;

  return `
    <div style="min-width: 210px; padding: 10px 12px; border: 1px solid rgba(148,163,184,0.35); border-radius: 14px; background: rgba(15,23,42,0.94); color: #f8fafc; box-shadow: 0 18px 45px rgba(0,0,0,0.35); font-family: Inter, system-ui, sans-serif;">
      <div style="font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: #67e8f9; font-weight: 800; margin-bottom: 4px;">Cyclone Track</div>
      <div style="font-size: 13px; line-height: 1.25; font-weight: 800; margin-bottom: 8px;">${escapeHtml(properties.cycloneName || 'Cyclone')}</div>
      <div style="display: grid; grid-template-columns: 72px 1fr; row-gap: 5px; column-gap: 8px; font-size: 11px; line-height: 1.25;">
        <span style="color:#94a3b8;">Type</span><strong>${escapeHtml(properties.cycloneType || 'TC')}</strong>
        <span style="color:#94a3b8;">Date</span><strong>${escapeHtml(properties.date || '-')}</strong>
        <span style="color:#94a3b8;">Time</span><strong>${escapeHtml(properties.time || '-')}</strong>
        <span style="color:#94a3b8;">Position</span><strong>${latitude?.toFixed?.(1) || '-'}°N, ${longitude?.toFixed?.(1) || '-'}°E</strong>
        <span style="color:#94a3b8;">Radius</span><strong>${radius > 0 ? `${radius} km` : 'Observed point'}</strong>
      </div>
    </div>
  `;
}

function setupCycloneTrackPopup(map) {
  if (!map || popupListeners.has(POINT_LAYER_ID)) return;

  const showPopup = (event) => {
    if (!event.features?.length) return;
    cycloneTrackPopup?.remove();
    cycloneTrackPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: true, maxWidth: '260px' })
      .setLngLat(event.lngLat)
      .setHTML(createCyclonePointPopup(event.features[0]))
      .setOffset([0, -8])
      .addTo(map);
  };

  map.on('click', POINT_LAYER_ID, showPopup);
  map.on('mouseenter', POINT_LAYER_ID, () => { map.getCanvas().style.cursor = 'pointer'; });
  map.on('mouseleave', POINT_LAYER_ID, () => { map.getCanvas().style.cursor = ''; });
  popupListeners.add(POINT_LAYER_ID);
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

  setupCycloneTrackPopup(map);
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
  if (!visible) cycloneTrackPopup?.remove();
}
