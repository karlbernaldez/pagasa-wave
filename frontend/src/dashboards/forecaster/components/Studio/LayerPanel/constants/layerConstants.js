// ── Model options ─────────────────────────────────────────────────────────────

export const WIND_MODELS = [
  { id: 'ECMWF', label: 'ECMWF', available: true },
  { id: 'GFS', label: 'GFS', available: false },
  { id: 'NOAA', label: 'NOAA', available: false },
  { id: 'NAM', label: 'NAM', available: false },
  { id: 'HRRR', label: 'HRRR', available: false },
];

export const WIND_PARTICLE_TILESETS = {
  ECMWF: 'mapbox://votewave.ecmwf',
  // GFS:   'mapbox://votewave.gfs',
  // NAM:   'mapbox://votewave.nam',
  // HRRR:  'mapbox://votewave.hrrr',
  // NOAA:  'mapbox://votewave.noaa',
};

export const WIND_RASTER_TILESETS = {
  ECMWF: { light: 'mapbox://votewave.windtif', dark: 'mapbox://votewave.darktif' },
};

export const WAVE_MODELS = [
  { id: 'WW3', label: 'WW3' },
  { id: 'ECWAM', label: 'ECWAM' },
  { id: 'MRI3', label: 'MRI3' },
  { id: 'BMKG', label: 'BMKG' },

];

// ── Element options ───────────────────────────────────────────────────────────

export const WIND_ELEMENTS = [
  { id: 'barbs', name: 'Wind Barbs', icon: '🎐', storageKey: 'WIND_BARBS' },
  { id: 'particles', name: 'Particles', icon: '✨', storageKey: 'WIND_PARTICLES' },
  { id: 'raster', name: 'Raster Map', icon: '🗾', storageKey: 'WIND_RASTER' },
];

export const WAVE_ELEMENTS = [
  { id: 'raster', name: 'Raster Map', icon: '🗾', storageKey: 'WAVE_RASTER' },
  { id: 'waveDirection', name: 'Wave Direction', icon: '➡️', storageKey: 'WAVE_DIRECTION' },
  { id: 'wavePeriod', name: 'Mean Period', icon: '⏱️', storageKey: 'WAVE_PERIOD' },
];

// ── Domain / utility layer definitions ───────────────────────────────────────

export const DOMAIN_LAYERS = [
  { id: 'PAR', name: 'PAR', subtitle: 'Philippine Area of Responsibility' },
  { id: 'TCID', name: 'TCID', subtitle: 'Tropical Cyclone Info Domain' },
  { id: 'TCAD', name: 'TCAD', subtitle: 'Tropical Cyclone Advisory Domain' },
];

export const UTILITY_LAYERS = [
  { id: 'GRATICULES', name: 'Graticules', subtitle: 'Coordinate Grid Lines' },
  { id: 'SHIPPING_ZONE', name: 'Shipping Zones', subtitle: 'Maritime Shipping Areas' },
  { id: 'CYCLONE_TRACK', name: 'Cyclone Track', subtitle: 'PAGASA tropical cyclone track' },
];

// ── Wave raster tile config ───────────────────────────────────────────────────

export const WAVE_RASTER_LAYER_PREFIX = 'wave-raster-model-';
export const WAVE_RASTER_SOURCE_PREFIX = 'wave-source-model-';
export const WAVE_RASTER_DATE = '2026011200';

// ── localStorage key helpers ─────────────────────────────────────────────────

export const STORAGE_KEYS = {
  WIND_ENABLED: 'WIND_ENABLED',
  WIND_MODEL: 'WIND_MODEL',
  WAVE_ENABLED: 'WAVE_ENABLED',
  WAVE_MODEL: 'WAVE_MODEL',
  SATELLITE: 'SATELLITE',
};

export const OFF_ELEMENTS = {
  particles: false,
  raster: false,
  waveDirection: false,
  wavePeriod: false,
};

export const DEFAULT_DIRECTION_STYLE = {
  theme: 'colored', // 'colored' | 'black'
  size: 1.0,       // multiplier applied to all icon-size stops
  opacity: 1.0,
};

// icon-size base stops — user size is a multiplier on top of these
export const BASE_SIZE_STOPS = [
  [0.0, 0.30],
  [1.0, 0.45],
  [3.0, 0.65],
  [6.0, 0.85],
];

// Colored ramp paint expression
export const COLORED_ICON_COLOR = [
  'interpolate', ['linear'], ['get', 'waveHeight'],
  0.0, 'rgba(160, 220, 255, 0.70)',
  1.0, 'rgba( 64, 196, 180, 0.80)',
  2.5, 'rgba( 80, 200,  80, 0.85)',
  4.0, 'rgba(255, 160,  40, 0.90)',
  6.0, 'rgba(220,  40,  40, 0.95)',
];

export const BLACK_ICON_COLOR = 'rgba(20, 20, 20, 0.88)';
export const MRI3_TIMESTEP = '012';
export const WAVE_BUCKET_BASE = 'https://storage.googleapis.com/wavelab-tiles';
