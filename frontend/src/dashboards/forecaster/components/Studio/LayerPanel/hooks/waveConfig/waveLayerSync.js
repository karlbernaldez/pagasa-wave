import {
  WAVE_RASTER_LAYER_PREFIX,
  WAVE_RASTER_SOURCE_PREFIX,
  WAVE_RASTER_DATE,
  OFF_ELEMENTS,
  DEFAULT_DIRECTION_STYLE,
  COLORED_ICON_COLOR,
  BLACK_ICON_COLOR,
} from '@dashboards/forecaster/components/Studio/LayerPanel/constants/layerConstants';

import {
  getSelectedModels,
  buildWaveTileUrl,
  buildIconSize,
} from './waveHelpers';

// ─────────────────────────────────────────────────────────────────────────────
// Model-specific raster settings
// ─────────────────────────────────────────────────────────────────────────────

const MODEL_RASTER_CONFIG = {
  BMKG: {
    scheme: 'tms',
    bounds: [100, -5, 180, 50],
  },

  MRI3: {
    scheme: 'xyz',
    bounds: [100, -5, 180, 50],
  },

  WW3: {
    scheme: 'xyz',
    bounds: [100, -5, 180, 50],
  },
};

const getRasterConfig = (model) =>
  MODEL_RASTER_CONFIG[model] ?? {
    scheme: 'xyz',
    bounds: [100, -5, 180, 50],
  };

// ─────────────────────────────────────────────────────────────────────────────
// Element → layer-prefix registry
// ─────────────────────────────────────────────────────────────────────────────

const SYMBOL_LAYER_MAP = [
  {
    id: 'waveDirection',
    prefix: 'wave-direction-',
    applyDirectionStyle: true,
  },
  {
    id: 'wavePeriod',
    prefix: 'wave-period-',
    applyDirectionStyle: false,
  },
  {
    id: 'waveHeight',
    prefix: 'wave-height-',
    applyDirectionStyle: false,
  },
  {
    id: 'windDirection',
    prefix: 'wave-wind-direction-',
    applyDirectionStyle: false,
  },
];

const rasterTileUrlBySource = new Map();

// ─────────────────────────────────────────────────────────────────────────────
// Raster Layers
// ─────────────────────────────────────────────────────────────────────────────

const removeLegacyLayers = (map) => {
  if (map.getLayer('wave-raster')) {
    map.removeLayer('wave-raster');
  }

  ['wave-dark', 'wave-light'].forEach((id) => {
    if (map.getSource(id)) {
      map.removeSource(id);
    }
  });
};

const removeStaleRasterSources = (map, targetSourceIds) => {
  Object.keys(map.getStyle()?.sources || {})
    .filter((id) => id.startsWith(WAVE_RASTER_SOURCE_PREFIX))
    .forEach((sourceId) => {
      if (targetSourceIds.has(sourceId)) return;

      const layerId = sourceId.replace(
        WAVE_RASTER_SOURCE_PREFIX,
        WAVE_RASTER_LAYER_PREFIX,
      );

      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }

      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }

      rasterTileUrlBySource.delete(sourceId);
    });
};

const upsertRasterLayer = (
  map,
  {
    model,
    theme,
    opacity,
    showRaster,
    themeChanged,
    forecastDate,
    chartType,
  },
) => {
  const sourceId = `${WAVE_RASTER_SOURCE_PREFIX}${model}`;
  const layerId = `${WAVE_RASTER_LAYER_PREFIX}${model}`;
  const tileUrl = buildWaveTileUrl({
    model,
    theme,
    date: WAVE_RASTER_DATE,
    forecastDate,
    chartType,
  });

  const { scheme, bounds } = getRasterConfig(model);

  let sourceExists = Boolean(map.getSource(sourceId));
  const sourceUrlChanged = sourceExists && rasterTileUrlBySource.get(sourceId) !== tileUrl;

  if (sourceExists && (themeChanged || sourceUrlChanged)) {
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }

    map.removeSource(sourceId);
    rasterTileUrlBySource.delete(sourceId);
    sourceExists = false;
  }

  if (!sourceExists) {
    map.addSource(sourceId, {
      type: 'raster',
      tiles: [tileUrl],
      tileSize: 256,
      scheme,
      bounds,
    });
    rasterTileUrlBySource.set(sourceId, tileUrl);
  }

  if (!map.getLayer(layerId)) {
    map.addLayer(
      {
        id: layerId,
        type: 'raster',
        source: sourceId,

        paint: {
          'raster-opacity': opacity,
          'raster-fade-duration': 0,

          // smoother BMKG rendering
          'raster-resampling': 'linear',
        },

        layout: {
          visibility: showRaster ? 'visible' : 'none',
        },
      },
      'graticules',
    );
  } else {
    map.setPaintProperty(layerId, 'raster-opacity', opacity);

    map.setLayoutProperty(
      layerId,
      'visibility',
      showRaster ? 'visible' : 'none',
    );
  }
};

export const syncWaveRasterLayers = (
  map,
  models = [],
  showRaster = false,
  isDarkMode = false,
  themeChanged = false,
  forecastPackage = {},
) => {
  if (!map) return;

  const theme = isDarkMode ? 'dark' : 'light';

  const selectedModels = getSelectedModels(models);

  const opacity =
    selectedModels.length > 0
      ? Math.max(0.25, 1 / selectedModels.length)
      : 0;

  removeLegacyLayers(map);

  removeStaleRasterSources(
    map,
    new Set(
      selectedModels.map(
        (model) => `${WAVE_RASTER_SOURCE_PREFIX}${model}`,
      ),
    ),
  );

  selectedModels.forEach((model) =>
    upsertRasterLayer(map, {
      model,
      theme,
      opacity,
      showRaster,
      themeChanged,
      forecastDate: forecastPackage.forecastDate,
      chartType: forecastPackage.chartType,
    }),
  );

  ['wave-glass-fill', 'wave-glass-depth'].forEach((id) => {
    if (!map.getLayer(id)) return;

    map.setLayoutProperty(
      id,
      'visibility',
      showRaster && selectedModels.length > 0
        ? 'visible'
        : 'none',
    );
  });
};

// ── Symbol layers (direction, period, height, wind direction) ─────────────────

/**
 * Single-select: exactly one element is active at a time.
 * For each entry in SYMBOL_LAYER_MAP:
 *   • show its layers only when it is the active element AND layers are enabled
 *   • hide layers belonging to deselected/removed models
 *   • apply direction-style paint/layout props when flagged (color, size, opacity)
 */
export const syncWaveSymbolLayers = (map, config) => {
  if (!map) return;

  const {
    enabled = false,
    models = [],
    elements = {},
    directionStyle = DEFAULT_DIRECTION_STYLE,
  } = config;

  const selectedModels = getSelectedModels(models);
  const canShow = enabled && selectedModels.length > 0;

  // Determine the single active element (first truthy key in SYMBOL_LAYER_MAP wins)
  const activeElement = SYMBOL_LAYER_MAP.find(({ id }) => Boolean(elements[id]))?.id ?? null;

  SYMBOL_LAYER_MAP.forEach(({ id: elementId, prefix, applyDirectionStyle }) => {
    const show = canShow && activeElement === elementId;

    selectedModels.forEach((model) => {
      const layerId = `${prefix}${model}`;
      if (!map.getLayer(layerId)) return;

      map.setLayoutProperty(layerId, 'visibility', show ? 'visible' : 'none');

      // Apply direction-style props even when hidden so they're ready on reveal
      if (applyDirectionStyle) {
        const iconColor = directionStyle.theme === 'black' ? BLACK_ICON_COLOR : COLORED_ICON_COLOR;
        const iconSize = buildIconSize(directionStyle.size ?? 1.0);
        const iconOpacity = directionStyle.opacity ?? 1.0;

        map.setPaintProperty(layerId, 'icon-color', iconColor);
        map.setLayoutProperty(layerId, 'icon-size', iconSize);
        map.setPaintProperty(layerId, 'icon-opacity', iconOpacity);
      }
    });

    // Hide orphaned layers for models removed from selection
    map.getStyle()?.layers?.forEach(({ id: layerId }) => {
      if (!layerId.startsWith(prefix)) return;
      const modelSuffix = layerId.slice(prefix.length);
      if (!selectedModels.includes(modelSuffix)) {
        map.setLayoutProperty(layerId, 'visibility', 'none');
      }
    });
  });

  // wave-arrows layer is tied specifically to the waveDirection element
  if (map.getLayer('wave-arrows')) {
    map.setLayoutProperty('wave-arrows', 'visibility',
      canShow && activeElement === 'waveDirection' ? 'visible' : 'none');
  }
};

// ── Master sync ───────────────────────────────────────────────────────────────

export const syncAllWaveLayers = (map, config, isDarkMode, prevThemeRef, forecastPackage = {}) => {
  if (!map) return;

  const nextTheme = isDarkMode ? 'dark' : 'light';
  const themeChanged = prevThemeRef.current !== nextTheme;

  const { elements = OFF_ELEMENTS, enabled = false, models = [] } = config;

  syncWaveRasterLayers(
    map,
    models,
    enabled && models.length > 0 && Boolean(elements.raster),
    isDarkMode,
    themeChanged,
    forecastPackage,
  );

  syncWaveSymbolLayers(map, config);

  prevThemeRef.current = nextTheme;
};
