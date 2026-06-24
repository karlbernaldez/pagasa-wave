const SATELLITE_SOURCE_IDS = ['pagasa-satellite-image-source-a', 'pagasa-satellite-image-source-b'];
const SATELLITE_LAYER_IDS = ['Satellite', 'Satellite_next'];
export const HIMAWARI_LAYER_ID = SATELLITE_LAYER_IDS[0];

const PAGASA_SATELLITE_API_URL = 'https://www.panahon.gov.ph/api/v1/satellite';
const PAGASA_ORIGIN = 'https://www.panahon.gov.ph';
const FRAME_INTERVAL_MS = 650;
const FADE_DURATION_MS = 280;
const SATELLITE_FRAME_IDS = Array.from({ length: 24 }, (_, index) => index + 1);

const PHILIPPINES_SATELLITE_COORDINATES = [
  [104, 29.55],
  [146.99, 29.55],
  [146.99, -1.5],
  [104, -1.5],
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

function ensureSatelliteImageLayerPair(map, initialUrl, visible) {
  SATELLITE_LAYER_IDS.forEach((layerId) => {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
  });
  SATELLITE_SOURCE_IDS.forEach((sourceId) => {
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  });

  SATELLITE_SOURCE_IDS.forEach((sourceId) => {
    map.addSource(sourceId, {
      type: 'image',
      url: initialUrl,
      coordinates: PHILIPPINES_SATELLITE_COORDINATES,
    });
  });

  SATELLITE_LAYER_IDS.forEach((layerId, index) => {
    map.addLayer({
      id: layerId,
      type: 'raster',
      source: SATELLITE_SOURCE_IDS[index],
      slot: 'bottom',
      layout: { visibility: visible ? 'visible' : 'none' },
      paint: { 'raster-opacity': index === 0 ? 0.95 : 0 },
    });
  });
}

function setSatelliteLayersVisibility(map, visible) {
  SATELLITE_LAYER_IDS.forEach((layerId) => {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
    }
  });
}

function startSatelliteAnimation(map, frameUrls) {
  stopSatelliteAnimation(map);
  if (frameUrls.length <= 1) return;

  const state = {
    frameUrls,
    index: 0,
    activeLayerSlot: 0,
    timerId: null,
  };

  state.timerId = window.setInterval(() => {
    if (!map || !map.getLayer(SATELLITE_LAYER_IDS[0]) || !map.getLayer(SATELLITE_LAYER_IDS[1])) {
      stopSatelliteAnimation(map);
      return;
    }

    const nextIndex = (state.index + 1) % state.frameUrls.length;
    const nextSlot = state.activeLayerSlot === 0 ? 1 : 0;
    const currentSlot = state.activeLayerSlot;
    const nextSource = map.getSource(SATELLITE_SOURCE_IDS[nextSlot]);

    if (nextSource?.updateImage) {
      nextSource.updateImage({ url: state.frameUrls[nextIndex], coordinates: PHILIPPINES_SATELLITE_COORDINATES });
    }

    map.setPaintProperty(SATELLITE_LAYER_IDS[nextSlot], 'raster-opacity-transition', { duration: FADE_DURATION_MS, delay: 0 });
    map.setPaintProperty(SATELLITE_LAYER_IDS[currentSlot], 'raster-opacity-transition', { duration: FADE_DURATION_MS, delay: 0 });
    map.setPaintProperty(SATELLITE_LAYER_IDS[nextSlot], 'raster-opacity', 0.95);
    map.setPaintProperty(SATELLITE_LAYER_IDS[currentSlot], 'raster-opacity', 0);

    state.index = nextIndex;
    state.activeLayerSlot = nextSlot;
  }, FRAME_INTERVAL_MS);

  animationStateByMap.set(map, state);
}

export function setHimawariSatelliteVisibility(map, visible) {
  if (!map) return;
  setSatelliteLayersVisibility(map, visible);
  if (!visible) stopSatelliteAnimation(map);
}

export async function ensureHimawariSatelliteLayer(map, { visible = false } = {}) {
  if (!map) return;

  removeLegacyHimawariVideo(map);

  const frameUrls = await preloadFrames(await fetchSatelliteFrameUrls());
  ensureSatelliteImageLayerPair(map, frameUrls[0], visible);
  setSatelliteLayersVisibility(map, visible);

  if (visible) startSatelliteAnimation(map, frameUrls);
}

export function addHimawariLayer(map) {
  ensureHimawariSatelliteLayer(map, { visible: false }).catch((error) => {
    console.error('[pagasa-satellite-layer-error]', error);
  });
}
