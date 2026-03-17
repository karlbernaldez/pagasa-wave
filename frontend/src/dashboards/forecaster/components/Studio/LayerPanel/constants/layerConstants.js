// ── Model options ─────────────────────────────────────────────────────────────

export const WIND_MODELS = [
  { id: 'ECMWF', label: 'ECMWF', available: true },
  { id: 'GFS', label: 'GFS', available: false },
  { id: 'NOAA', label: 'NOAA', available: false },
  { id: 'NAM', label: 'NAM', available: false },
  { id: 'HRRR', label: 'HRRR', available: false },
];

export const WAVE_MODELS = [
  { id: 'WW3', label: 'WW3' },
  { id: 'ECWAM', label: 'ECWAM' },
  { id: 'MRI3', label: 'MRI3' },
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