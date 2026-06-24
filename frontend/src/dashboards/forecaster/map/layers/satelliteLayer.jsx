const SATELLITE_SOURCE_ID = 'pagasa-satellite-image-source';
export const HIMAWARI_LAYER_ID = 'Satellite';

const PAGASA_SATELLITE_API_URL = 'https://www.panahon.gov.ph/api/v1/satellite';
const PAGASA_ORIGIN = 'https://www.panahon.gov.ph';

const PHILIPPINES_SATELLITE_COORDINATES = [
  [104, 29.55],
  [146.99, 29.55],
  [146.99, -1.5],
  [104, -1.5],
];

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function toAbsoluteUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('/')) return `${PAGASA_ORIGIN}${trimmed}`;
  return `${PAGASA_ORIGIN}/${trimmed.replace(/^\/+/, '')}`;
}

function looksLikeSatelliteImageUrl(value) {
  return typeof value === 'string' && /\.(png|jpe?g|webp|gif)(\?|$)/i.test(value);
}

function getTimestampScore(item) {
  if (!isObject(item)) return 0;
  const candidates = [
    item.datetime,
    item.dateTime,
    item.timestamp,
    item.time,
    item.date,
    item.created_at,
    item.createdAt,
    item.updated_at,
    item.updatedAt,
  ];

  for (const value of candidates) {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return 0;
}

function collectImageCandidates(value, candidates = []) {
  if (!value) return candidates;

  if (typeof value === 'string') {
    if (looksLikeSatelliteImageUrl(value)) {
      candidates.push({ url: toAbsoluteUrl(value), score: 0 });
    }
    return candidates;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectImageCandidates(item, candidates));
    return candidates;
  }

  if (!isObject(value)) return candidates;

  const preferredKeys = [
    'image',
    'imageUrl',
    'image_url',
    'url',
    'src',
    'file',
    'filename',
    'path',
    'link',
  ];
  const itemScore = getTimestampScore(value);

  preferredKeys.forEach((key) => {
    const url = toAbsoluteUrl(value[key]);
    if (url && looksLikeSatelliteImageUrl(url)) {
      candidates.push({ url, score: itemScore });
    }
  });

  Object.entries(value).forEach(([key, nested]) => {
    if (preferredKeys.includes(key)) return;
    const before = candidates.length;
    collectImageCandidates(nested, candidates);
    for (let index = before; index < candidates.length; index += 1) {
      if (!candidates[index].score) candidates[index].score = itemScore;
    }
  });

  return candidates;
}

function getLatestSatelliteImageUrl(payload) {
  const candidates = collectImageCandidates(payload)
    .filter((candidate) => candidate.url)
    .sort((left, right) => right.score - left.score);

  return candidates[0]?.url || null;
}

async function fetchLatestSatelliteImageUrl() {
  const response = await fetch(PAGASA_SATELLITE_API_URL, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`PAGASA satellite API returned ${response.status}`);
  }

  const payload = await response.json();
  const imageUrl = getLatestSatelliteImageUrl(payload);

  if (!imageUrl) {
    console.warn('[pagasa-satellite-api-unrecognized-payload]', payload);
    throw new Error('No satellite image found in PAGASA response.');
  }

  return imageUrl;
}

function removeLegacyHimawariVideo(map) {
  if (map.getLayer('himawari-video-layer')) map.removeLayer('himawari-video-layer');
  if (map.getSource('himawari-video')) map.removeSource('himawari-video');
}

export function setHimawariSatelliteVisibility(map, visible) {
  if (!map?.getLayer?.(HIMAWARI_LAYER_ID)) return;
  map.setLayoutProperty(HIMAWARI_LAYER_ID, 'visibility', visible ? 'visible' : 'none');
}

export async function ensureHimawariSatelliteLayer(map, { visible = false } = {}) {
  if (!map) return;

  removeLegacyHimawariVideo(map);

  const imageUrl = await fetchLatestSatelliteImageUrl();
  const source = map.getSource(SATELLITE_SOURCE_ID);

  if (source?.updateImage) {
    source.updateImage({ url: imageUrl, coordinates: PHILIPPINES_SATELLITE_COORDINATES });
  } else {
    if (map.getLayer(HIMAWARI_LAYER_ID)) map.removeLayer(HIMAWARI_LAYER_ID);
    if (map.getSource(SATELLITE_SOURCE_ID)) map.removeSource(SATELLITE_SOURCE_ID);

    map.addSource(SATELLITE_SOURCE_ID, {
      type: 'image',
      url: imageUrl,
      coordinates: PHILIPPINES_SATELLITE_COORDINATES,
    });

    map.addLayer({
      id: HIMAWARI_LAYER_ID,
      type: 'raster',
      source: SATELLITE_SOURCE_ID,
      slot: 'bottom',
      layout: { visibility: visible ? 'visible' : 'none' },
      paint: { 'raster-opacity': 0.95 },
    });
  }

  setHimawariSatelliteVisibility(map, visible);
}

export function addHimawariLayer(map) {
  ensureHimawariSatelliteLayer(map, { visible: false }).catch((error) => {
    console.error('[pagasa-satellite-layer-error]', error);
  });
}
