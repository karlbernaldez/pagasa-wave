const SATELLITE_SOURCE_ID = 'pagasa-satellite-canvas-source';
export const HIMAWARI_LAYER_ID = 'Satellite';

const PAGASA_SATELLITE_API_URL = 'https://www.panahon.gov.ph/api/v1/satellite';
const PAGASA_ORIGIN = 'https://www.panahon.gov.ph';
const FRAME_INTERVAL_MS = 650;
const FADE_DURATION_MS = 220;
const SATELLITE_FRAME_IDS = Array.from({ length: 24 }, (_, index) => 24 - index);
const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 768;

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

const stateByMap = new WeakMap();
const loadingByMap = new WeakMap();

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

function looksLikeImageUrl(value) {
  return typeof value === 'string' && /\.(png|jpe?g|webp|gif)(\?|$)/i.test(value);
}

function findImageUrl(value) {
  if (!value) return null;

  if (typeof value === 'string') {
    const url = toAbsoluteUrl(value);
    return url && looksLikeImageUrl(url) ? url : null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const url = findImageUrl(item);
      if (url) return url;
    }
    return null;
  }

  if (!isObject(value)) return null;

  const preferredKeys = ['image', 'imageUrl', 'image_url', 'url', 'src', 'file', 'filename', 'path', 'link', 'data'];
  for (const key of preferredKeys) {
    const url = findImageUrl(value[key]);
    if (url) return url;
  }

  for (const key of Object.keys(value)) {
    if (preferredKeys.includes(key)) continue;
    const url = findImageUrl(value[key]);
    if (url) return url;
  }

  return null;
}

async function fetchFrameBlobUrl(frameId) {
  const apiUrl = buildSatelliteApiUrl(frameId);
  const response = await fetch(apiUrl, { cache: 'no-store' });
  if (!response.ok) throw new Error(`PAGASA satellite API id=${frameId} returned ${response.status}`);

  const contentType = response.headers.get('content-type') || '';
  if (/image\//i.test(contentType)) {
    return URL.createObjectURL(await response.blob());
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    return apiUrl;
  }

  return findImageUrl(payload) || apiUrl;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load satellite frame: ${url}`));
    image.src = url;
  });
}

async function loadFrame(frameId) {
  const url = await fetchFrameBlobUrl(frameId);
  const image = await loadImage(url);
  return { frameId, image, url, revoke: url.startsWith('blob:') };
}

function clearState(map) {
  const state = stateByMap.get(map);
  if (!state) return;
  if (state.timerId) window.clearInterval(state.timerId);
  if (state.fadeFrameId) window.cancelAnimationFrame(state.fadeFrameId);
  state.frames?.forEach((frame) => {
    if (frame.revoke) URL.revokeObjectURL(frame.url);
  });
  stateByMap.delete(map);
}

function removeSatelliteLayerAndSource(map) {
  if (!map) return;
  if (map.getLayer(HIMAWARI_LAYER_ID)) map.removeLayer(HIMAWARI_LAYER_ID);
  if (map.getSource(SATELLITE_SOURCE_ID)) map.removeSource(SATELLITE_SOURCE_ID);
}

function removeLegacySatelliteLayers(map) {
  [
    'Satellite_next',
    'himawari-video-layer',
    'himawari-video',
    'pagasa-satellite-gif-source',
    'pagasa-satellite-image-source-a',
    'pagasa-satellite-image-source-b',
    'pagasa-satellite-image-source',
  ].forEach((id) => {
    if (map.getLayer(id)) map.removeLayer(id);
    if (map.getSource(id)) map.removeSource(id);
  });
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
  if (!beforeId || beforeId === HIMAWARI_LAYER_ID) return;

  try {
    map.moveLayer(HIMAWARI_LAYER_ID, beforeId);
  } catch (error) {
    console.warn('[pagasa-satellite-layer-order-warning]', error);
  }
}

function drawFrame(canvas, frame, nextFrame = null, progress = 0) {
  const ctx = canvas.getContext('2d');
  if (!ctx || !frame?.image) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1;
  ctx.drawImage(frame.image, 0, 0, canvas.width, canvas.height);

  if (nextFrame?.image && progress > 0) {
    ctx.globalAlpha = Math.min(1, Math.max(0, progress));
    ctx.drawImage(nextFrame.image, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
  }
}

function fadeToFrame(state, nextIndex) {
  const start = performance.now();
  const fromFrame = state.frames[state.index];
  const toFrame = state.frames[nextIndex];

  const step = (now) => {
    const progress = Math.min(1, (now - start) / FADE_DURATION_MS);
    drawFrame(state.canvas, fromFrame, toFrame, progress);

    if (progress < 1) {
      state.fadeFrameId = window.requestAnimationFrame(step);
      return;
    }

    state.fadeFrameId = null;
    state.index = nextIndex;
    drawFrame(state.canvas, toFrame);
  };

  if (state.fadeFrameId) window.cancelAnimationFrame(state.fadeFrameId);
  state.fadeFrameId = window.requestAnimationFrame(step);
}

async function loadRemainingFrames(state) {
  const remainingIds = SATELLITE_FRAME_IDS.filter((id) => id !== state.frames[0]?.frameId);
  const settled = await Promise.allSettled(remainingIds.map(loadFrame));
  const nextFrames = settled
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value);

  if (!nextFrames.length) return;

  state.frames = [state.frames[0], ...nextFrames].sort((a, b) => b.frameId - a.frameId);
}

function startAnimation(map, state) {
  if (state.timerId) window.clearInterval(state.timerId);

  state.timerId = window.setInterval(() => {
    if (!map?.getLayer?.(HIMAWARI_LAYER_ID)) {
      clearState(map);
      return;
    }

    if (state.frames.length <= 1 || state.fadeFrameId) return;
    const nextIndex = (state.index + 1) % state.frames.length;
    fadeToFrame(state, nextIndex);
    moveSatelliteBelowApplicationOverlays(map);
  }, FRAME_INTERVAL_MS);
}

function setSatelliteLayerVisibility(map, visible) {
  if (!map?.getLayer?.(HIMAWARI_LAYER_ID)) return;
  map.setLayoutProperty(HIMAWARI_LAYER_ID, 'visibility', visible ? 'visible' : 'none');
  moveSatelliteBelowApplicationOverlays(map);
}

export function setHimawariSatelliteVisibility(map, visible) {
  if (!map) return;
  setSatelliteLayerVisibility(map, visible);
  if (!visible) {
    const state = stateByMap.get(map);
    if (state?.timerId) {
      window.clearInterval(state.timerId);
      state.timerId = null;
    }
  } else {
    const state = stateByMap.get(map);
    if (state) startAnimation(map, state);
  }
}

export async function ensureHimawariSatelliteLayer(map, { visible = false } = {}) {
  if (!map) return;

  const existingLoad = loadingByMap.get(map);
  if (existingLoad) return existingLoad;

  const loadPromise = (async () => {
    removeLegacySatelliteLayers(map);
    removeSatelliteLayerAndSource(map);
    clearState(map);

    const firstFrame = await loadFrame(SATELLITE_FRAME_IDS[0]);
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    drawFrame(canvas, firstFrame);

    map.addSource(SATELLITE_SOURCE_ID, {
      type: 'canvas',
      canvas,
      coordinates: PHILIPPINES_SATELLITE_COORDINATES,
      animate: true,
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
    if (beforeId) map.addLayer(layerDefinition, beforeId);
    else map.addLayer(layerDefinition);

    const state = { canvas, frames: [firstFrame], index: 0, timerId: null, fadeFrameId: null };
    stateByMap.set(map, state);
    setSatelliteLayerVisibility(map, visible);

    loadRemainingFrames(state).then(() => {
      if (visible) startAnimation(map, state);
    }).catch((error) => {
      console.warn('[pagasa-satellite-frame-preload-warning]', error);
    });
  })();

  loadingByMap.set(map, loadPromise);

  try {
    await loadPromise;
  } finally {
    if (loadingByMap.get(map) === loadPromise) loadingByMap.delete(map);
  }
}

export function addHimawariLayer(map) {
  ensureHimawariSatelliteLayer(map, { visible: false }).catch((error) => {
    console.error('[pagasa-satellite-layer-error]', error);
  });
}
