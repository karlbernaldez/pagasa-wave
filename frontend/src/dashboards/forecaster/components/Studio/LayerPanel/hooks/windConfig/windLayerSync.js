import {
  addWindSource,
  addWindLayer,
  buildIconSizeExpression,
  WIND_RASTER_LAYER_PREFIX,
  WIND_RASTER_SOURCE_PREFIX,
} from '@dashboards/forecaster/map/layers/windLayer';
import {
  getSelectedWindModels,
  hasWindRaster,
  hasWindData,
  getWindRasterTileUrl,
  bustCache,
} from './windHelpers';

const EMPTY_GEOJSON = { type: 'FeatureCollection', features: [] };
const vis = (v) => (v ? 'visible' : 'none');

const safeSetLayout = (map, id, prop, val) => {
  if (map.getLayer(id)) map.setLayoutProperty(id, prop, val);
};

const safeSetPaint = (map, id, prop, val) => {
  if (map.getLayer(id)) map.setPaintProperty(id, prop, val);
};

// ── Raster layers ─────────────────────────────────────────────────────────────

const removeLegacyWindLayers = (map) => {
  if (map.getLayer('wind-raster')) map.removeLayer('wind-raster');
  ['wind-solarstorm', 'wind-darkstorm'].forEach((id) => {
    if (map.getSource(id)) map.removeSource(id);
  });
};

const removeStaleWindSources = (map, targetSourceIds) => {
  Object.keys(map.getStyle()?.sources || {})
    .filter((id) => id.startsWith(WIND_RASTER_SOURCE_PREFIX))
    .forEach((sourceId) => {
      if (targetSourceIds.has(sourceId)) return;
      const layerId = sourceId.replace(WIND_RASTER_SOURCE_PREFIX, WIND_RASTER_LAYER_PREFIX);
      if (map.getLayer(layerId))   map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    });
};

const upsertWindRasterLayer = (map, { model, isDarkMode, opacity, showRaster, themeChanged }) => {
  const sourceId    = `${WIND_RASTER_SOURCE_PREFIX}${model}`;
  const layerId     = `${WIND_RASTER_LAYER_PREFIX}${model}`;
  const tileUrl     = bustCache(getWindRasterTileUrl(model, isDarkMode));
  const srcExists   = Boolean(map.getSource(sourceId));
  const layerExists = Boolean(map.getLayer(layerId));

  const layerDef = () => ({
    id: layerId, type: 'raster', source: sourceId,
    paint: { 'raster-opacity': opacity, 'raster-fade-duration': 0 },
    layout: { visibility: showRaster ? 'visible' : 'none' },
  });

  if (srcExists && themeChanged) {
    if (layerExists) map.removeLayer(layerId);
    map.removeSource(sourceId);
    map.addSource(sourceId, { type: 'raster', url: tileUrl, tileSize: 4096 });
    map.addLayer(layerDef(), 'graticules');
  } else if (srcExists && layerExists) {
    map.setPaintProperty(layerId, 'raster-opacity', opacity);
    map.setLayoutProperty(layerId, 'visibility', showRaster ? 'visible' : 'none');
  } else {
    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, { type: 'raster', url: tileUrl, tileSize: 4096 });
    }
    if (!map.getLayer(layerId)) {
      map.addLayer(layerDef(), 'graticules');
    }
  }
};

export const syncWindRasterLayers = (
  map,
  models       = [],
  showRaster   = false,
  isDarkMode   = false,
  themeChanged = false,
) => {
  if (!map) return;

  const selectedModels = getSelectedWindModels(models).filter(hasWindRaster);
  const opacity        = selectedModels.length > 0
    ? Math.max(0.25, 1 / selectedModels.length)
    : 0;

  removeLegacyWindLayers(map);
  removeStaleWindSources(map, new Set(selectedModels.map((m) => `${WIND_RASTER_SOURCE_PREFIX}${m}`)));

  selectedModels.forEach((model) =>
    upsertWindRasterLayer(map, { model, isDarkMode, opacity, showRaster, themeChanged })
  );

  ['wind-glass-fill', 'wind-glass-depth'].forEach((id) => {
    if (map.getLayer(id)) {
      map.setLayoutProperty(id, 'visibility',
        showRaster && selectedModels.length > 0 ? 'visible' : 'none');
    }
  });
};

// ── Barb style ────────────────────────────────────────────────────────────────

const syncWindBarbStyle = (map, barbStyle) => {
  if (!barbStyle) return;
  const { size = 1.0, opacity = 0.5 } = barbStyle;

  // Scale the data-driven expression — imported from windLayer so stops stay in sync
  safeSetLayout(map, 'wind-arrows', 'icon-size',    buildIconSizeExpression(size));
  safeSetPaint (map, 'wind-arrows', 'icon-opacity', opacity);
};

// ── Particles + barbs (non-raster) ───────────────────────────────────────────

const teardownParticles = (map) => {
  if (map.getLayer('wind-particles'))  map.removeLayer('wind-particles');
  if (map.getSource('wind-particles')) map.removeSource('wind-particles');
};

const hideNonRasterLayers = (map) => {
  ['wind-particles', 'wind-arrows', 'wind-labels'].forEach((id) =>
    safeSetLayout(map, id, 'visibility', 'none')
  );
};

export const syncWindNonRasterLayers = async (map, config, prevModelRef) => {
  if (!map) return;

  const { enabled, models = [], elements, barbStyle } = config;
  const selectedModels = getSelectedWindModels(models);
  const primaryModel   = selectedModels.find(hasWindData) ?? null;

  if (!enabled || !primaryModel) {
    hideNonRasterLayers(map);
    if (!primaryModel) {
      if (map.getSource('wind-points')) {
        map.getSource('wind-points').setData(EMPTY_GEOJSON);
      }
      teardownParticles(map);
      prevModelRef.current = null;
    }
    return;
  }

  const modelChanged = prevModelRef.current !== primaryModel;
  const sourceGone   = !map.getSource('wind-particles');
  const layerGone    = !map.getLayer('wind-particles');

  if (modelChanged || sourceGone || layerGone) {
    await addWindSource(map, false, primaryModel);
    await addWindLayer(map, false);
    prevModelRef.current = primaryModel;
  }

  safeSetLayout(map, 'wind-particles', 'visibility', vis(elements.particles));
  safeSetLayout(map, 'wind-arrows',    'visibility', vis(elements.barbs));
  safeSetLayout(map, 'wind-labels',    'visibility', vis(elements.barbs));

  // Always sync style when barbs are active
  if (elements.barbs) {
    syncWindBarbStyle(map, barbStyle);
  }
};

// ── Master sync ───────────────────────────────────────────────────────────────

export const syncAllWindLayers = (map, config, isDarkMode, prevThemeRef, prevModelRef) => {
  if (!map) return;

  const nextTheme    = isDarkMode ? 'dark' : 'light';
  const themeChanged = prevThemeRef.current !== nextTheme;

  const { enabled = false, models = [], elements = {} } = config;
  const showRaster = enabled && models.length > 0 && Boolean(elements.raster);

  syncWindRasterLayers(map, models, showRaster, isDarkMode, themeChanged);
  syncWindNonRasterLayers(map, config, prevModelRef);   // async, fire-and-forget intentional

  prevThemeRef.current = nextTheme;
};