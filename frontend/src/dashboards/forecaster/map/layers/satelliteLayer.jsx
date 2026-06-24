const HIMAWARI_SOURCE_ID = 'himawari-video';
export const HIMAWARI_LAYER_ID = 'Satellite';

function getHimawariVideoUrl() {
  return `${import.meta.env.VITE_API_URL}/api/public/himawari.mp4`;
}

function startHimawariVideo(map) {
  const video = map?.getSource?.(HIMAWARI_SOURCE_ID)?.getVideo?.();
  if (!video) return;
  video.loop = true;
  video.muted = true;
  video.play().catch((err) => console.warn('Video play failed:', err));
}

export function setHimawariSatelliteVisibility(map, visible) {
  if (!map?.getLayer?.(HIMAWARI_LAYER_ID)) return;
  map.setLayoutProperty(HIMAWARI_LAYER_ID, 'visibility', visible ? 'visible' : 'none');
  if (visible) startHimawariVideo(map);
}

export function ensureHimawariSatelliteLayer(map, { visible = false } = {}) {
  if (!map) return;

  if (map.getLayer(HIMAWARI_LAYER_ID)) {
    setHimawariSatelliteVisibility(map, visible);
    return;
  }

  if (map.getSource(HIMAWARI_SOURCE_ID)) {
    map.removeSource(HIMAWARI_SOURCE_ID);
  }

  map.addSource(HIMAWARI_SOURCE_ID, {
    type: 'video',
    urls: [getHimawariVideoUrl()],
    coordinates: [
      [104, 29.55],
      [146.99, 29.55],
      [146.99, -1.5],
      [104, -1.5],
    ],
  });

  map.addLayer({
    id: HIMAWARI_LAYER_ID,
    type: 'raster',
    source: HIMAWARI_SOURCE_ID,
    slot: 'bottom',
    layout: { visibility: visible ? 'visible' : 'none' },
    paint: { 'raster-opacity': 0.95 },
  });

  map.once('data', (event) => {
    if (event.sourceId === HIMAWARI_SOURCE_ID && event.isSourceLoaded) {
      startHimawariVideo(map);
    }
  });

  if (visible) startHimawariVideo(map);
}

export function addHimawariLayer(map) {
  ensureHimawariSatelliteLayer(map, { visible: false });
}
