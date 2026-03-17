import { fetchLatestGeoJSON, createWindPopup } from '@dashboards/forecaster/utils/mapHelpers';

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

// ── Per-model raster tilesets (theme-aware) ───────────────────────────────────
// Mirrors WAVE_BUCKET_BASE pattern — add entries here as new model tilesets land
export const WIND_RASTER_TILESETS = {
  ECMWF: { light: 'mapbox://votewave.windtif', dark: 'mapbox://votewave.darktif' },
};

// ── Per-model particle tilesets (raster-array) ────────────────────────────────
const WIND_PARTICLE_TILESETS = {
  ECMWF: 'mapbox://votewave.ecmwf',
  // GFS:   'mapbox://votewave.gfs',
  // NAM:   'mapbox://votewave.nam',
  // HRRR:  'mapbox://votewave.hrrr',
  // NOAA:  'mapbox://votewave.noaa',
};

// ── Exported constants (used by useWindConfig) ────────────────────────────────
export const WIND_RASTER_LAYER_PREFIX  = 'wind-raster-layer-';
export const WIND_RASTER_SOURCE_PREFIX = 'wind-raster-source-';

// ── Helpers ───────────────────────────────────────────────────────────────────

const normalizeModel = (model = '') => model.trim().toUpperCase();

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
  const candidates = Array.isArray(raw)
    ? raw
    : String(raw).split(',');
  return candidates
    .map((m) => normalizeModel(m))
    .find((m) => hasWindData(m)) ?? null;
};

const EMPTY_GEOJSON = { type: 'FeatureCollection', features: [] };

// ── addWindSource ─────────────────────────────────────────────────────────────
// Adds: glass-layer source, wind-points GeoJSON source, wind-particles source.
// Per-model raster sources are managed surgically by useWindConfig's sync fn.

export async function addWindSource(map, isDarkMode, model) {
  const raw            = model ?? localStorage.getItem('WIND_MODEL');
  const primaryModel   = resolveParticleModel(raw);
  const particleTileset = primaryModel ? getParticleTileset(primaryModel) : null;
  const hasData         = Boolean(particleTileset);

  console.log(`[WindSource] raw="${raw}" resolved="${primaryModel ?? 'none'}" hasData=${hasData}`);

  const windData = hasData
    ? await fetchLatestGeoJSON({ model: primaryModel.toLowerCase(), product: 'wind', date: 'today' }) ?? EMPTY_GEOJSON
    : EMPTY_GEOJSON;

  console.log(`[WindSource] GeoJSON features: ${windData.features?.length ?? 0}`);

  // Glass overlay (shared with wave layer)
  if (!map.getSource('glass-layer')) {
    map.addSource('glass-layer', {
      type: 'vector',
      url: 'mapbox://votewave.a1s6vck4',
    });
  }

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

// ── addWindLayer ──────────────────────────────────────────────────────────────
// Adds: glass layers, particles layer, arrows layer, popup.
// Does NOT add per-model raster layers — those are managed by useWindConfig.

export async function addWindLayer(map, isDarkMode) {
  console.log(`[WindLayer] addWindLayer WIND_ENABLED=${localStorage.getItem('WIND_ENABLED')}`);
  if (localStorage.getItem('WIND_ENABLED') !== 'true') return;

  addGlassLayers(map);
  addWindParticlesLayer(map);
  addWindArrowsLayer(map);
  setupPopup(map, isDarkMode);

  console.log('[WindLayer] all non-raster layers added ✓');
}

// ── Layer helpers ─────────────────────────────────────────────────────────────

function addGlassLayers(map) {
  const isRasterVisible = localStorage.getItem('WIND_RASTER') === 'true';

  if (!map.getLayer('wind-glass-fill')) {
    map.addLayer({
      id: 'wind-glass-fill',
      type: 'fill',
      source: 'glass-layer',
      'source-layer': 'ph-bum99e',
      slot: 'top',
      paint: {
        'fill-color': 'rgba(255, 255, 255, 0.15)',
        'fill-opacity': 0.4,
        'fill-outline-color': 'rgba(255, 255, 255, 0.35)',
      },
      layout: { visibility: isRasterVisible ? 'visible' : 'none' },
    });
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
          5, 'rgba(255,255,255,0.05)',
          10, 'rgba(255,255,255,0.25)',
        ],
        'fill-opacity': 0.3,
      },
      layout: { visibility: isRasterVisible ? 'visible' : 'none' },
    });
  }
}

function addWindParticlesLayer(map) {
  const visible = localStorage.getItem('WIND_PARTICLES') === 'true';
  console.log(`[WindLayer] addWindParticlesLayer visible=${visible} source-exists=${Boolean(map.getSource('wind-particles'))}`);

  if (!map.getSource('wind-particles')) {
    console.warn('[WindLayer] wind-particles source not found — skipping');
    return;
  }

  if (!map.getLayer('wind-particles')) {
    map.addLayer({
      id: 'wind-particles',
      type: 'raster-particle',
      source: 'wind-particles',
      'source-layer': '10m_wind',
      slot: 'bottom',
      paint: {
        'raster-particle-speed-factor': 0.4,
        'raster-particle-fade-opacity-factor': 0.85,
        'raster-particle-reset-rate-factor': 0.4,
        'raster-particle-count': 36000,
        'raster-particle-max-speed': 160,
        'raster-particle-color': [
          'interpolate', ['linear'], ['raster-particle-speed'],
          0,   'rgba(255,255,255,0.2)',
          100, 'rgba(255,255,255,0.4)',
        ],
      },
      layout: { visibility: visible ? 'visible' : 'none' },
    }, 'country-boundaries');
  }
}

function addWindArrowsLayer(map) {
  const visible = localStorage.getItem('WIND_BARBS') === 'true';
  console.log(`[WindLayer] addWindArrowsLayer visible=${visible} source-exists=${Boolean(map.getSource('wind-points'))}`);

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
          2,        ['image', '5 kts'],
          3.57632,  ['image', '10kts (1)'],
          6.25856,  ['image', '15 kts'],
          8.9408,   ['image', '20 kts'],
          11.176,   ['image', '25 kts'],
          13.85824, ['image', '30 kts'],
        ],
        'icon-size': ['interpolate', ['linear'], ['get', 'windSpeed'], 0, 2.25, 16.5, 3.15],
        'icon-rotate': ['+', ['to-number', ['get', 'windDirection'], 0], 360],
        'icon-rotation-alignment': 'map',
        'icon-allow-overlap': true,
      },
      paint: { 'icon-opacity': 0.5 },
    }, 'country-boundaries');
  }
}

function setupPopup(map, isDarkMode) {
  const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });

  map.on('mousemove', 'wind-arrows', (e) => {
    if (!e.features.length) return;
    popup
      .setLngLat(e.lngLat)
      .setHTML(createWindPopup(e.features[0], isDarkMode))
      .setOffset([0, -5])
      .addTo(map);
  });

  map.on('mouseleave', 'wind-arrows', () => popup.remove());
}