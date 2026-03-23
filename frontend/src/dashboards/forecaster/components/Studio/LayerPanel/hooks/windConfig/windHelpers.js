import {
  WIND_RASTER_TILESETS,
  WIND_PARTICLE_TILESETS,
} from '@dashboards/forecaster/components/Studio/LayerPanel/constants/layerConstants';
// ── Model helpers ─────────────────────────────────────────────────────────────

export const normalizeModel = (model = '') => model.trim().toUpperCase();

export const getSelectedWindModels = (models = []) =>
  [...new Set(models.map(normalizeModel).filter(Boolean))];

// ── Tileset lookups ───────────────────────────────────────────────────────────

export const getWindRasterTileUrl = (model, isDarkMode) => {
  const tilesets = WIND_RASTER_TILESETS[normalizeModel(model)];
  if (!tilesets) return null;
  return isDarkMode ? tilesets.dark : tilesets.light;
};

export const hasWindRaster = (model) =>
  Boolean(WIND_RASTER_TILESETS[normalizeModel(model)]);

export const hasWindData = (model) =>
  Boolean(WIND_PARTICLE_TILESETS[normalizeModel(model)]);

// Resolve a raw model string/array → first model that has particle data
export const resolveParticleModel = (raw) => {
  if (!raw) return null;
  const candidates = Array.isArray(raw) ? raw : String(raw).split(',');
  return candidates.map(normalizeModel).find(hasWindData) ?? null;
};

// ── Misc ──────────────────────────────────────────────────────────────────────

export const bustCache = (url) => `${url}?fresh=${Date.now()}`;