import { preloadHimawariAndCreateGif } from '@/utils/himawariPreloader';

const SATELLITE_SOURCE_ID = 'pagasa-satellite-gif-source';
export const HIMAWARI_LAYER_ID = 'Satellite';

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

const gifUrlByMap = new WeakMap();

function removeLegacySatelliteLayers(map) {
  ['himawari-video-layer', 'himawari-video', 'Satellite_next', 'pagasa-satellite-image-source-a', 'pagasa-satellite-image-source-b', 'pagasa-satellite-image-source'].forEach((id) => {
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

function revokePreviousGifUrl(map) {
  const previousUrl = gifUrlByMap.get(map);
  if (previousUrl) URL.revokeObjectURL(previousUrl);
  gifUrlByMap.delete(map);
}

function setSatelliteLayerVisibility(map, visible) {
  if (!map?.getLayer?.(HIMAWARI_LAYER_ID)) return;
  map.setLayoutProperty(HIMAWARI_LAYER_ID, 'visibility', visible ? 'visible' : 'none');
  moveSatelliteBelowApplicationOverlays(map);
}

export function setHimawariSatelliteVisibility(map, visible) {
  if (!map) return;
  setSatelliteLayerVisibility(map, visible);
}

export async function ensureHimawariSatelliteLayer(map, { visible = false } = {}) {
  if (!map) return;

  removeLegacySatelliteLayers(map);
  revokePreviousGifUrl(map);

  const gifUrl = await preloadHimawariAndCreateGif();
  if (!gifUrl) throw new Error('No animated PAGASA satellite GIF could be generated.');
  gifUrlByMap.set(map, gifUrl);

  map.addSource(SATELLITE_SOURCE_ID, {
    type: 'image',
    url: gifUrl,
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
  if (beforeId) map.addLayer(layerDefinition, beforeId);
  else map.addLayer(layerDefinition);

  setSatelliteLayerVisibility(map, visible);
}

export function addHimawariLayer(map) {
  ensureHimawariSatelliteLayer(map, { visible: false }).catch((error) => {
    console.error('[pagasa-satellite-layer-error]', error);
  });
}
