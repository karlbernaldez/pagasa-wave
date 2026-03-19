import { fetchLatestGeoJSON, createWavePopup, getWaveSourceId } from '../../utils/mapHelpers';
import {
  DEFAULT_DIRECTION_STYLE,
  BASE_SIZE_STOPS,
  BLACK_ICON_COLOR,
  COLORED_ICON_COLOR,
} from '@dashboards/forecaster/components/Studio/LayerPanel/constants/layerConstants';

// ── Popup style injection (once) ──────────────────────────────────────────────

(function injectPopupStyle() {
  const style = document.createElement('style');
  style.textContent = `
    .mapboxgl-popup-content {
      background: transparent !important;
      padding: 0 !important;
      box-shadow: none !important;
    }
    .mapboxgl-popup-tip { display: none !important; }
  `;
  document.head.appendChild(style);
})();

// ── Constants ─────────────────────────────────────────────────────────────────

const MRI3_TIMESTEP   = '012';
const WAVE_BUCKET_BASE = 'https://storage.googleapis.com/wavelab-tiles';

// ── Module-level singletons ───────────────────────────────────────────────────

// One popup instance shared across all wave direction layers and all calls to
// addWaveLayer — prevents multiple popups when models change or layers re-init.
let _wavePopup = null;
const _popupListeners = new Set();  // never double-register a layer

const getWavePopup = () => {
  if (!_wavePopup) {
    _wavePopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });
  }
  return _wavePopup;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const normalizeModel = (model = '') => model.trim().toUpperCase();

const resolveDate = (model) => {
  switch (model) {
    case 'WW3': return '2026011200'; // TODO: replace with dynamic date
    default:    return '2026011200';
  }
};

const buildTileUrl = (model, theme) => {
  const m    = normalizeModel(model);
  const date = resolveDate(m);
  const base = `${WAVE_BUCKET_BASE}/${m}/${theme}/${date}`;
  return m === 'MRI3'
    ? `${base}/${MRI3_TIMESTEP}/{z}/{x}/{y}.png`
    : `${base}/{z}/{x}/{y}.png`;
};

const ensureSource = (map, id, config) => {
  if (!map.getSource(id)) map.addSource(id, config);
};

// ── Sources ───────────────────────────────────────────────────────────────────

/**
 * Registers raster tile sources and per-model GeoJSON point sources.
 * Safe to call multiple times — every add is guarded by getSource checks.
 */
export async function addWaveSource(map, isDarkMode, models) {
  if (!map) return;

  const theme = isDarkMode ? 'dark' : 'light';

  for (const model of models) {
    // Raster tile source
    ensureSource(map, `wave-source-${model}`, {
      type: 'raster',
      tiles: [buildTileUrl(model, theme)],
      tileSize: 256,
      bounds: [100, -5, 180, 50],
      scheme: 'xyz',
    });

    // Per-model GeoJSON source for direction arrows
    const pointSourceId = `wave-points-${model}`;
    if (map.getSource(pointSourceId)) continue;

    try {
      const geojson = await fetchLatestGeoJSON({
        model: model.toLowerCase(),
        product: 'wave',
        date: 'today',
      });
      if (geojson) {
        ensureSource(map, pointSourceId, { type: 'geojson', data: geojson });
      }
    } catch (err) {
      console.error(`[Wave] GeoJSON fetch failed for ${model}:`, err);
    }
  }

  // Shared PH boundaries vector source
  ensureSource(map, 'ph-boundaries', {
    type: 'vector',
    url: 'mapbox://mapbox.country-boundaries-v1',
  });
}

/**
 * Registers all map sources and layers for the given models.
 * Idempotent — safe to call repeatedly or with a single new model.
 */
export async function addWaveLayer(map, isDarkMode, models) {
  if (!map) return;

  const normalized = models.map(normalizeModel).filter(Boolean);

  await addWaveSource(map, isDarkMode, normalized);
  addWaveDirectionLayers(map, normalized);
  addSharedLayers(map, isDarkMode);
  setupPopup(map, isDarkMode, normalized);   // always after layers exist
}

// ── Shared (non-per-model) layers ─────────────────────────────────────────────

function addSharedLayers(map, isDarkMode) {
  if (!map.getLayer('ph-overlay')) {
    map.addLayer({
      id: 'ph-overlay',
      type: 'fill',
      source: 'ph-boundaries',
      'source-layer': 'country_boundaries',
      filter: ['all', ['match', ['get', 'iso_3166_1_alpha_3'], ['PHL'], true, false]],
      paint: {
        'fill-color': isDarkMode ? '#0f1117' : '#f2f2f2',
        'fill-opacity': 1,
      },
    });
  }

  if (!map.getLayer('ph-overlay-outline')) {
    map.addLayer({
      id: 'ph-overlay-outline',
      type: 'line',
      source: 'ph-boundaries',
      'source-layer': 'country_boundaries',
      filter: ['all', ['match', ['get', 'iso_3166_1_alpha_3'], ['PHL'], true, false]],
      paint: {
        'line-color': isDarkMode ? '#1e3a5f' : '#000000',
        'line-width': 0.5,
        'line-opacity': 0.8,
      },
    });
  }
}

// ── Wave direction layers ─────────────────────────────────────────────────────

function addWaveDirectionLayers(map, models = []) {
  if (!map.hasImage('wave-arrow')) loadWaveArrowImage(map);

  // Read saved direction style from localStorage
  let savedStyle = DEFAULT_DIRECTION_STYLE;
  try {
    const raw = localStorage.getItem('WAVE_DIRECTION_STYLE');
    if (raw) savedStyle = { ...DEFAULT_DIRECTION_STYLE, ...JSON.parse(raw) };
  } catch {
    // malformed JSON — fall back to defaults
  }

  const iconColor = savedStyle.theme === 'black' ? BLACK_ICON_COLOR : COLORED_ICON_COLOR;
  const iconSize  = [
    'interpolate', ['linear'], ['get', 'waveHeight'],
    ...BASE_SIZE_STOPS.flatMap(([waveH, baseSize]) => [waveH, baseSize * (savedStyle.size ?? 1.0)]),
  ];

  models.forEach((model) => {
    const layerId  = `wave-direction-${model}`;
    const sourceId = `wave-points-${model}`;

    if (map.getLayer(layerId))   return;
    if (!map.getSource(sourceId)) return;

    map.addLayer({
      id:     layerId,
      type:   'symbol',
      source: sourceId,
      slot:   'middle',

      filter: [
        'all',
        ['has', 'waveDirection'],
        ['>', ['to-number', ['get', 'waveHeight'], 0], 0],
      ],

      layout: {
        visibility:                'visible',
        'icon-image':              'wave-arrow',
        'icon-size':               iconSize,
        'icon-rotate':             ['to-number', ['get', 'waveDirection'], 0],
        'icon-rotation-alignment': 'map',
        'icon-pitch-alignment':    'map',
        'icon-allow-overlap':      true,
        'icon-ignore-placement':   true,
      },

      paint: {
        'icon-color':   iconColor,
        'icon-opacity': savedStyle.opacity ?? 1.0,
      },
    });
  });
}

// ── Canvas arrow SDF image ────────────────────────────────────────────────────

function loadWaveArrowImage(map) {
  const SIZE   = 64;
  const canvas = document.createElement('canvas');
  canvas.width  = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  const cx  = SIZE / 2;

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth   = 6;
  ctx.lineCap     = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, SIZE * 0.80);
  ctx.lineTo(cx, SIZE * 0.18);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(cx,                SIZE * 0.08);
  ctx.lineTo(cx - SIZE * 0.18,  SIZE * 0.32);
  ctx.lineTo(cx + SIZE * 0.18,  SIZE * 0.32);
  ctx.closePath();
  ctx.fill();

  map.addImage('wave-arrow', ctx.getImageData(0, 0, SIZE, SIZE), { sdf: true });
}

// ── Popup ─────────────────────────────────────────────────────────────────────

function setupPopup(map, isDarkMode, models = []) {
  // Use the module-level singleton — all layers share one popup so only
  // one card can ever be visible at a time, regardless of how many models
  // are active or how many times addWaveLayer is called.
  const popup = getWavePopup();

  const showPopup = (e) => {
    if (!e.features?.length) return;
    popup
      .setLngLat(e.lngLat)
      .setHTML(createWavePopup(e.features[0], isDarkMode))
      .setOffset([0, -5])
      .addTo(map);
  };
  const hidePopup = () => popup.remove();

  const attach = (layerId) => {
    if (_popupListeners.has(layerId)) return;
    map.on('mousemove',  layerId, showPopup);
    map.on('mouseleave', layerId, hidePopup);
    _popupListeners.add(layerId);
  };

  models.forEach((model) => attach(`wave-direction-${model}`));
}