import { fetchLatestGeoJSON, createWavePopup, getWaveSourceId } from '../../utils/mapHelpers';

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

const MRI3_TIMESTEP    = '012';
const WAVE_BUCKET_BASE = 'https://storage.googleapis.com/wavelab-tiles';

// Tracks which layers already have popup listeners — never double-register
const _popupListeners = new Set();

// Default icon-size expression (size multiplier = 1.0).
// useWaveConfig.syncWaveSymbolLayers will override this at runtime when
// the user adjusts the size slider.
const DEFAULT_ICON_SIZE = [
  'interpolate', ['linear'], ['get', 'waveHeight'],
  0.0, 0.30,
  1.0, 0.45,
  3.0, 0.65,
  6.0, 0.85,
];

// Default colored ramp — overridden at runtime by syncWaveSymbolLayers
const DEFAULT_ICON_COLOR = [
  'interpolate', ['linear'], ['get', 'waveHeight'],
  0.0, 'rgba(160, 220, 255, 0.70)',
  1.0, 'rgba( 64, 196, 180, 0.80)',
  2.5, 'rgba( 80, 200,  80, 0.85)',
  4.0, 'rgba(255, 160,  40, 0.90)',
  6.0, 'rgba(220,  40,  40, 0.95)',
];

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
export async function addWaveSource(map, isDarkMode, models = ['WW3']) {
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

// ── Main entry point ──────────────────────────────────────────────────────────

/**
 * Registers all map sources and layers for the given models.
 * Idempotent — safe to call repeatedly or with a single new model.
 */
export async function addWaveLayer(map, isDarkMode, models = ['WW3']) {
  if (!map) return;

  const normalized = models.map(normalizeModel).filter(Boolean);

  await addWaveSource(map, isDarkMode, normalized);
  addSharedLayers(map, isDarkMode);
  addWaveDirectionLayers(map, normalized);
  setupPopup(map, isDarkMode, normalized);
}

// ── Shared (non-per-model) layers ─────────────────────────────────────────────

function addSharedLayers(map, isDarkMode) {
  if (!map.getLayer('wave-glass-fill')) {
    map.addLayer({
      id: 'wave-glass-fill',
      type: 'fill',
      source: 'glass-layer',
      'source-layer': 'ph-bum99e',
      slot: 'top',
      paint: {
        'fill-color': 'rgba(255, 255, 255, 0.15)',
        'fill-opacity': 0.8,
        'fill-outline-color': 'rgba(255, 255, 255, 0.35)',
      },
      layout: { visibility: 'none' },
    });
  }

  if (!map.getLayer('wave-glass-depth')) {
    map.addLayer({
      id: 'wave-glass-depth',
      type: 'fill',
      source: 'glass-layer',
      'source-layer': 'ph-bum99e',
      slot: 'top',
      paint: {
        'fill-color': [
          'interpolate', ['linear'], ['zoom'],
          5,  'rgba(255,255,255,0.05)',
          10, 'rgba(255,255,255,0.25)',
        ],
        'fill-opacity': 0.8,
      },
      layout: { visibility: 'none' },
    });
  }

  if (!map.getLayer('ph-overlay')) {
    map.addLayer({
      id: 'ph-overlay',
      type: 'fill',
      source: 'ph-boundaries',
      'source-layer': 'country_boundaries',
      filter: ['all', ['match', ['get', 'iso_3166_1_alpha_3'], ['PHL'], true, false]],
      paint: {
        'fill-color':   isDarkMode ? '#0f1117' : '#f2f2f2',
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
        'line-color':   isDarkMode ? '#1e3a5f' : '#000000',
        'line-width':   0.5,
        'line-opacity': 0.8,
      },
    });
  }
}

// ── Per-model wave direction symbol layers ────────────────────────────────────
//
// Each model gets its own layer (wave-direction-WW3, wave-direction-ECWAM …)
// reading from its own GeoJSON source (wave-points-WW3 etc.).
//
// The layer is registered with default color + size values.
// useWaveConfig.syncWaveSymbolLayers overrides icon-color and icon-size at
// runtime whenever the user changes theme or size — no layer rebuild needed.
//
function addWaveDirectionLayers(map, models = []) {
  if (!map.hasImage('wave-arrow')) loadWaveArrowImage(map);

  models.forEach((model) => {
    const layerId  = `wave-direction-${model}`;
    const sourceId = `wave-points-${model}`;

    if (map.getLayer(layerId))    return; // already registered
    if (!map.getSource(sourceId)) return; // GeoJSON not ready yet

    map.addLayer({
      id: layerId,
      type: 'symbol',
      source: sourceId,
      slot: 'middle',

      filter: [
        'all',
        ['has', 'waveDirection'],
        ['>', ['to-number', ['get', 'waveHeight'], 0], 0],
      ],

      layout: {
        visibility: 'none', // controlled by useWaveConfig

        'icon-image': 'wave-arrow',
        'icon-size':  DEFAULT_ICON_SIZE,   // overridden by syncWaveSymbolLayers

        'icon-rotate':             ['to-number', ['get', 'waveDirection'], 0],
        'icon-rotation-alignment': 'map',
        'icon-pitch-alignment':    'map',
        'icon-allow-overlap':      true,
        'icon-ignore-placement':   true,
      },

      paint: {
        'icon-color':   DEFAULT_ICON_COLOR, // overridden by syncWaveSymbolLayers
        'icon-opacity': [
          'interpolate', ['linear'], ['zoom'],
          3, 0.0,
          4, 0.5,
          5, 1.0,
        ],
      },
    }, 'country-boundaries');
  });
}

// ── Canvas arrow SDF image ────────────────────────────────────────────────────

function loadWaveArrowImage(map) {
  const SIZE = 64;
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
  ctx.moveTo(cx,               SIZE * 0.08);
  ctx.lineTo(cx - SIZE * 0.18, SIZE * 0.32);
  ctx.lineTo(cx + SIZE * 0.18, SIZE * 0.32);
  ctx.closePath();
  ctx.fill();

  map.addImage('wave-arrow', ctx.getImageData(0, 0, SIZE, SIZE), { sdf: true });
}

// ── Popup ─────────────────────────────────────────────────────────────────────

function setupPopup(map, isDarkMode, models = []) {
  const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });

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

  attach('wave-arrows');
  models.forEach((model) => attach(`wave-direction-${model}`));
}