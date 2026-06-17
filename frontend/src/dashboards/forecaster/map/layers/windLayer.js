import { fetchLatestGeoJSON, createWindPopup } from '@dashboards/forecaster/utils/mapHelpers';
import { WIND_RASTER_TILESETS, WIND_PARTICLE_TILESETS } from '@dashboards/forecaster/components/Studio/LayerPanel/constants/layerConstants';

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

// ── Exported constants (used by useWindConfig) ────────────────────────────────
export const WIND_RASTER_LAYER_PREFIX = 'wind-raster-layer-';
export const WIND_RASTER_SOURCE_PREFIX = 'wind-raster-source-';

// Tracks which layers already have popup listeners — never double-register
const _popupListeners = new Set();

// ── Helpers ───────────────────────────────────────────────────────────────────

const normalizeModel = (model = '') => model.trim().toUpperCase();

const ensureSource = (map, id, config) => {
  if (!map.getSource(id)) map.addSource(id, config);
};

export const getWindRasterTileUrl = (model, isDarkMode) => {
  const tilesets = WIND_RASTER_TILESETS[normalizeModel(model)];
  if (!tilesets) return null;
  return isDarkMode ? tilesets.dark : tilesets.light;
};

export const hasWindRaster = (model) =>
  Boolean(WIND_RASTER_TILESETS[normalizeModel(model)]);

const getParticleTileset = (model) =>
  WIND_PARTICLE_TILESETS[normalizeModel(model)] ?? null;

export const hasWindData = (model) =>
  Boolean(getParticleTileset(model));

// Resolve a raw model string/array to the first model that has particle data
const resolveParticleModel = (raw) => {
  if (!raw) return null;
  const candidates = Array.isArray(raw) ? raw : String(raw).split(',');
  return candidates.map((m) => normalizeModel(m)).find((m) => hasWindData(m)) ?? null;
};

const EMPTY_GEOJSON = { type: 'FeatureCollection', features: [] };

// ── Barb style helpers ────────────────────────────────────────────────────────

const DEFAULT_BARB_STYLE = { size: 1.0, opacity: 0.5 };

/**
 * Reads persisted barbStyle from localStorage.
 * Falls back to defaults so the layer always has valid values on first load.
 */
const readBarbStyle = () => {
  try {
    const raw = localStorage.getItem('WIND_BARB_STYLE');
    return raw ? { ...DEFAULT_BARB_STYLE, ...JSON.parse(raw) } : DEFAULT_BARB_STYLE;
  } catch {
    return DEFAULT_BARB_STYLE;
  }
};

/**
 * Builds the data-driven icon-size expression scaled by a multiplier.
 * Preserves the wind-speed interpolation — never sets a flat value.
 */
export const buildIconSizeExpression = (multiplier = 1.0) => [
  'interpolate', ['linear'], ['get', 'windSpeed'],
  0, 2.25 * multiplier,
  16.5, 3.15 * multiplier,
];

// ── Sources ───────────────────────────────────────────────────────────────────

/**
 * Registers the glass overlay, GeoJSON barb points, and particle sources.
 * Safe to call multiple times — every add is guarded by ensureSource checks.
 */
export async function addWindSource(map, isDarkMode, model) {
  if (!model) { model = 'ECMWF'; }

  if (!map) return;

  const raw = model ?? localStorage.getItem('WIND_MODEL');
  const primaryModel = resolveParticleModel(raw);
  const particleTileset = primaryModel ? getParticleTileset(primaryModel) : null;
  const hasData = Boolean(particleTileset);

  const windData = hasData
    ? (await fetchLatestGeoJSON({ model: primaryModel.toLowerCase(), product: 'wind', date: 'today' })) ?? EMPTY_GEOJSON
    : EMPTY_GEOJSON;

  // Glass overlay (shared with wave layer)
  ensureSource(map, 'glass-layer', {
    type: 'vector',
    url: 'mapbox://votewave.a1s6vck4',
  });

  // GeoJSON barb points
  if (!map.getSource('wind-points')) {
    map.addSource('wind-points', { type: 'geojson', data: windData });
  } else {
    map.getSource('wind-points').setData(windData);
  }

  // Particles — always remove + re-add so tileset URL reflects current model
  if (map.getSource('wind-particles')) {
    if (map.getLayer('wind-particles')) map.removeLayer('wind-particles');
    map.removeSource('wind-particles');
  }
  if (hasData) {
    map.addSource('wind-particles', {
      type: 'raster-array',
      url: `${particleTileset}?fresh=${Date.now()}`,
      tileSize: 4096,
    });
  }
}

/**
 * Registers all map sources and layers for wind.
 * Idempotent — safe to call repeatedly or when toggling layers.
 */
export async function addWindLayer(map, isDarkMode, model) {
  if (!map) return;
  if (localStorage.getItem('WIND_ENABLED') !== 'true') return;

  await addWindSource(map, isDarkMode, model);
  syncWindGlassOverlay(map, isDarkMode);
  addWindParticlesLayer(map);
  addWindArrowsLayer(map);
  setupPopup(map, isDarkMode);
}

// ── Shared (non-per-model) layers ─────────────────────────────────────────────

export function syncWindGlassOverlay(map, isDarkMode) {
  const isRasterVisible = localStorage.getItem('WIND_RASTER') === 'true';
  ensureSource(map, 'glass-layer', {
    type: 'vector',
    url: 'mapbox://votewave.a1s6vck4',
  });
  const fillColor = isDarkMode ? 'rgba(103, 232, 249, 0.12)' : 'rgba(255, 255, 255, 0.22)';
  const fillOutline = isDarkMode ? 'rgba(103, 232, 249, 0.36)' : 'rgba(8, 121, 155, 0.28)';
  const depthStart = isDarkMode ? 'rgba(14,165,233,0.05)' : 'rgba(255,255,255,0.10)';
  const depthEnd = isDarkMode ? 'rgba(103,232,249,0.18)' : 'rgba(14,165,233,0.16)';

  if (!map.getLayer('wind-glass-fill')) {
    map.addLayer({
      id: 'wind-glass-fill',
      type: 'fill',
      source: 'glass-layer',
      'source-layer': 'ph-bum99e',
      slot: 'top',
      paint: {
        'fill-color': fillColor,
        'fill-opacity': isDarkMode ? 0.48 : 0.38,
        'fill-outline-color': fillOutline,
      },
      layout: { visibility: isRasterVisible ? 'visible' : 'none' },
    });
  } else {
    map.setPaintProperty('wind-glass-fill', 'fill-color', fillColor);
    map.setPaintProperty('wind-glass-fill', 'fill-opacity', isDarkMode ? 0.48 : 0.38);
    map.setPaintProperty('wind-glass-fill', 'fill-outline-color', fillOutline);
  }

  if (!map.getLayer('wind-glass-depth')) {
    map.addLayer({
      id: 'wind-glass-depth',
      type: 'fill',
      source: 'glass-layer',
      'source-layer': 'ph-bum99e',
      slot: 'top',
      paint: {
        'fill-color': ['interpolate', ['linear'], ['zoom'],
          5, depthStart,
          10, depthEnd,
        ],
        'fill-opacity': isDarkMode ? 0.34 : 0.28,
      },
      layout: { visibility: isRasterVisible ? 'visible' : 'none' },
    });
  } else {
    map.setPaintProperty('wind-glass-depth', 'fill-color', ['interpolate', ['linear'], ['zoom'],
      5, depthStart,
      10, depthEnd,
    ]);
    map.setPaintProperty('wind-glass-depth', 'fill-opacity', isDarkMode ? 0.34 : 0.28);
  }
}

// ── Layer helpers ─────────────────────────────────────────────────────────────

function addWindParticlesLayer(map) {
  const visible = localStorage.getItem('WIND_PARTICLES') === 'true';

  if (!map.getLayer('wind-particles')) {
    map.addLayer({
      id: 'wind-particles',
      type: 'raster-particle',
      source: 'wind-particles',
      'source-layer': '10m_wind',
      slot: 'bottom',
      paint: {
        'raster-particle-speed-factor': 0.25,
        'raster-particle-fade-opacity-factor': 0.996,
        'raster-particle-reset-rate-factor': 0.4,
        'raster-particle-count': 48000,
        'raster-particle-max-speed': 80,
        'raster-particle-color': [
          'interpolate', ['linear'], ['raster-particle-speed'],
          0, 'rgba(255,255,255,0.3)',
          100, 'rgba(255,255,255,0.6)',
        ],
      },
      layout: { visibility: visible ? 'visible' : 'none' },
    });
  }
}

function addWindArrowsLayer(map) {
  const visible = localStorage.getItem('WIND_BARBS') === 'true';

  // Read persisted style so the layer is created with the user's last values
  const { size, opacity } = readBarbStyle();

  if (!map.getLayer('wind-arrows')) {
    map.addLayer({
      id: 'wind-arrows',
      type: 'symbol',
      source: 'wind-points',
      slot: 'middle',
      filter: ['>=', ['get', 'windSpeed'], 3.08],
      layout: {
        visibility: visible ? 'visible' : 'none',
        'icon-image': [
          'step', ['get', 'windSpeed'],
          ['image', '0KTS', { params: { 'color-1': 'rgb(240,240,240)' } }],
          2, ['image', '5 kts'],
          3.57632, ['image', '10kts (1)'],
          6.25856, ['image', '15 kts'],
          8.9408, ['image', '20 kts'],
          11.176, ['image', '25 kts'],
          13.85824, ['image', '30 kts'],
        ],
        'icon-size': buildIconSizeExpression(size),
        'icon-rotate': ['+', ['to-number', ['get', 'windDirection'], 0], 360],
        'icon-rotation-alignment': 'map',
        'icon-allow-overlap': true,
      },
      paint: { 'icon-opacity': opacity },
    });
  }
}

// ── Popup ─────────────────────────────────────────────────────────────────────

function setupPopup(map, isDarkMode) {
  const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });

  const showPopup = (e) => {
    if (!e.features?.length) return;
    popup
      .setLngLat(e.lngLat)
      .setHTML(createWindPopup(e.features[0], isDarkMode))
      .setOffset([0, -5])
      .addTo(map);
  };
  const hidePopup = () => popup.remove();

  const attach = (layerId) => {
    if (_popupListeners.has(layerId)) return;
    map.on('mousemove', layerId, showPopup);
    map.on('mouseleave', layerId, hidePopup);
    _popupListeners.add(layerId);
  };

  attach('wind-arrows');
}
