const SATELLITE_SOURCE_ID = 'pagasa-satellite-image-source';
export const HIMAWARI_LAYER_ID = 'Satellite';

const PAGASA_SATELLITE_API_URL = 'https://www.panahon.gov.ph/api/v1/satellite';
const PAGASA_ORIGIN = 'https://www.panahon.gov.ph';
const FRAME_INTERVAL_MS = 700;
const SATELLITE_FRAME_IDS = Array.from({ length: 24 }, (_, index) => index + 1);

const PHILIPPINES_SATELLITE_COORDINATES = [
  [104, 29.55],
  [146.99, 29.55],
  [146.99, -1.5],
  [104, -1.5],
];

const KNOWN_APP_OVERLAY_LAYER_IDS = [
  'PAR',
  'PAR_dash',
  'TCID',
  'TCAD',
  'graticules',
  'graticules_blur',
  'SHIPPING_ZONE_OUTLINE',
  'SHIPPING_ZONE_LABELS',
  'PAGASA_NWP_RASTER',
  'CYCLONE_TRACK',
];

const animationStateByMap = new WeakMap();

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function buildSatelliteApiUrl(frameId) {
  const url = new URL(PAGASA_SATELLITE_API_URL);
  url.searchParams.set('id', String(frameId));
  return url.toString();
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

function collectImageCandidates(value, candidates = []) {
  if (!value) return candidates;

  if (typeof value === 'string') {
    if (looksLikeSatelliteImageUrl(value)) candidates.push(toAbsoluteUrl(value));
    return candidates;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectImageCandidates(item, candidates));
    return candidates;
  }

  if (!isObject(value)) return candidates;

  const preferredKeys = ['image', 'imageUrl', 'image_url', 'url', 'src', 'file', 'filename', 'path', 'link', 'data'];
  preferredKeys.forEach((key) => {
    const url = toAbsoluteUrl(value[key]);
    if (url && looksLikeSatelliteImageUrl(url)) candidates.push(url);
  });

  Object.entries(value).forEach(([key, nested]) => {
    if (preferredKeys.includes(key)) return;
    collectImageCandidates(nested, candidates);
  });

  return candidates;
}

function getSatelliteImageUrl(payload) {
  return collectImageCandidates(payload).find(Boolean) || null;
}

async function fetchSatelliteFrameUrl(frameId) {
  const apiUrl = buildSatelliteApiUrl(frameId);
  const response = await fetch(apiUrl, { cache: 'no-store' });
  if (!response.ok) throw new Error(`PAGASA satellite API id=${frameId} returned ${response.status}`);

  const contentType = response.headers.get('content-type') || '';
  if (/image\//i.test(contentType)) return apiUrl;

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    console.warn('[pagasa-satellite-api-non-json-response]', { frameId, apiUrl, contentType, error });
    return apiUrl;
  }

  const imageUrl = getSatelliteImageUrl(payload);
  if (!imageUrl) {
    console.warn('[pagasa-satellite-api-unrecognized-payload]', { frameId, apiUrl, contentType, payload });
    return apiUrl;
  }

  return imageUrl;
}

async function fetchSatelliteFrameUrls() {
  const settled = await Promise.allSettled(SATELLITE_FRAME_IDS.map(fetchSatelliteFrameUrl));
  const frameUrls = settled
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value)
    .filter(Boolean);

  if (!frameUrls.length) throw new Error('No satellite frames found from PAGASA ids 1-24.');
  return frameUrls;
}

function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(url);
    image.onerror = () => reject(new Error(`Failed to preload satellite frame: ${url}`));
    image.src = url;
  });
}

async function preloadFrames(frameUrls) {
  const settled = await Promise.allSettled(frameUrls.map(preloadImage));
  const loadedUrls = settled
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value);

  if (!loadedUrls.length) throw new Error('No satellite frames could be loaded.');
  return loadedUrls;
}

function removeLegacyHimawariVideo(map) {
  if (map.getLayer('himawari-video-layer')) map.removeLayer('himawari-video-layer');
  if (map.getSource('himawari-video')) map.removeSource('himawari-video');
}

function stopSatelliteAnimation(map) {
  const state = animationStateByMap.get(map);
  if (!state) return;
  window.clearInterval(state.timerId);
  animationStateByMap.delete(map);
}

function isSatelliteLayer(layer) {
  return layer?.id === HIMAWARI_LAYER_ID || layer?.source === SATELLITE_SOURCE_ID;
}

function isApplicationOverlayLayer(layer) {
  if (!layer || isSatelliteLayer(layer)) return false;
  if (KNOWN_APP_OVERLAY_LAYER_IDS.includes(layer.id)) return true;
  if (!layer.source) return false;
  if (layer.source === 'composite' || layer.source === 'mapbox' || layer.source === 'mapbox-dem') return false;
  return true;
}

function getFirstApplicationOverlayLayerId(map) {
  const layers = map.getStyle?.()?.layers || [];
  return layers.find(isApplicationOverlayLayer)?.id || null;
}

function moveSatelliteBelowApplicationOverlays(map) {
  if (!map?.getLayer?.(HIMAWARI_LAYER_ID)) return;
  const beforeId = getFirstApplicationOverlayLayerId(map);
  if (beforeId && beforeId !== HIMAWARI_LAYER_ID) {
    try {
      map.moveLayer(HIMAWARI_LAYER_ID, beforeId);
    } catch (error) {
      console.warn('[pagasa-satellite-layer-order-warning]', error);
    }
  }
}

function ensureSatelliteImageLayer(map, initialUrl, visible) {
  if (map.getLayer(HIMAWARI_LAYER_ID)) map.removeLayer(HIMAWARI_LAYER_ID);
  if (map.getSource(SATELLITE_SOURCE_ID)) map.removeSource(SATELLITE_SOURCE_ID);

  map.addSource(SATELLITE_SOURCE_ID, {
    type: 'image',
    url: initialUrl,
    coordinates: PHILIPPINES_SATELLITE_COORDINATES,
  });

  const layerDefinition = {
    id: HIMAWARI_LAYER_ID,
    type: 'raster',
    source: SATELLITE_SOURCE_ID,
    slot: 'bottom',
    layout: { visibility: visible ? 'visible' : 'none' },
    paint: { 'raster-opacity': 0.75 },
  };

  const beforeId = getFirstApplicationOverlayLayerId(map);
  if (beforeId) {
    map.addLayer(layerDefinition, beforeId);
  } else {
    map.addLayer(layerDefinition);
  }

  moveSatelliteBelowApplicationOverlays(map);
}

function setSatelliteLayerVisibility(map, visible) {
  if (map.getLayer(HIMAWARI_LAYER_ID)) {
    map.setLayoutProperty(HIMAWARI_LAYER_ID, 'visibility', visible ? 'visible' : 'none');
    moveSatelliteBelowApplicationOverlays(map);
  }
}

function startSatelliteAnimation(map, frameUrls) {
  stopSatelliteAnimation(map);
  if (frameUrls.length <= 1) return;

  const state = {
    frameUrls,
    index: 0,
    timerId: null,
  };

  state.timerId = window.setInterval(() => {
    if (!map || !map.getLayer(HIMAWARI_LAYER_ID)) {
      stopSatelliteAnimation(map);
      return;
    }

    const nextIndex = (state.index + 1) % state.frameUrls.length;
    const source = map.getSource(SATELLITE_SOURCE_ID);

    if (source?.updateImage) {
      source.updateImage({ url: state.frameUrls[nextIndex], coordinates: PHILIPPINES_SATELLITE_COORDINATES });
    }

    moveSatelliteBelowApplicationOverlays(map);
    state.index = nextIndex;
  }, FRAME_INTERVAL_MS);

  animationStateByMap.set(map, state);
}

export function setHimawariSatelliteVisibility(map, visible) {
  if (!map) return;
  setSatelliteLayerVisibility(map, visible);
  if (!visible) stopSatelliteAnimation(map);
}

export async function ensureHimawariSatelliteLayer(map, { visible = false } = {}) {
  if (!map) return;

  removeLegacyHimawariVideo(map);

  const frameUrls = await preloadFrames(await fetchSatelliteFrameUrls());
  ensureSatelliteImageLayer(map, frameUrls[0], visible);
  setSatelliteLayerVisibility(map, visible);

  if (visible) startSatelliteAnimation(map, frameUrls);
}

export function addHimawariLayer(map) {
  ensureHimawariSatelliteLayer(map, { visible: false }).catch((error) => {
    console.error('[pagasa-satellite-layer-error]', error);
  });
}
