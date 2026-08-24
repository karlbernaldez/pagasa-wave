import {
  WAVE_RASTER_LAYER_PREFIX,
  WAVE_RASTER_SOURCE_PREFIX,
  WAVE_RASTER_DATE,
  WW3_CONTOUR_SOURCE_ID,
  WW3_CONTOUR_LINE_LAYER_ID,
  WW3_CONTOUR_LABEL_LAYER_ID,
  OFF_ELEMENTS,
  DEFAULT_DIRECTION_STYLE,
  COLORED_ICON_COLOR,
  BLACK_ICON_COLOR,
} from '@dashboards/forecaster/components/Studio/LayerPanel/constants/layerConstants';

import {
  getSelectedModels,
  buildWaveTileUrl,
  buildWW3ContourUrl,
  buildIconSize,
} from './waveHelpers';

const MODEL_RASTER_CONFIG = {
  BMKG: { scheme: 'tms', bounds: [100, -5, 180, 50] },
  MRI3: { scheme: 'xyz', bounds: [100, -5, 180, 50] },
  WW3: { scheme: 'xyz', bounds: [100, -5, 180, 50] },
};

const getRasterConfig = (model) =>
  MODEL_RASTER_CONFIG[model] ?? { scheme: 'xyz', bounds: [100, -5, 180, 50] };

const SYMBOL_LAYER_MAP = [
  { id: 'waveDirection', prefix: 'wave-direction-', applyDirectionStyle: true },
  { id: 'wavePeriod', prefix: 'wave-period-', applyDirectionStyle: false },
  { id: 'waveHeight', prefix: 'wave-height-', applyDirectionStyle: false },
  { id: 'windDirection', prefix: 'wave-wind-direction-', applyDirectionStyle: false },
];

const rasterTileUrlBySource = new Map();
let ww3ContourUrl = null;

const removeLegacyLayers = (map) => {
  if (map.getLayer('wave-raster')) map.removeLayer('wave-raster');
  ['wave-dark', 'wave-light'].forEach((id) => {
    if (map.getSource(id)) map.removeSource(id);
  });
};

const removeStaleRasterSources = (map, targetSourceIds) => {
  Object.keys(map.getStyle()?.sources || {})
    .filter((id) => id.startsWith(WAVE_RASTER_SOURCE_PREFIX))
    .forEach((sourceId) => {
      if (targetSourceIds.has(sourceId)) return;
      const layerId = sourceId.replace(WAVE_RASTER_SOURCE_PREFIX, WAVE_RASTER_LAYER_PREFIX);
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
      rasterTileUrlBySource.delete(sourceId);
    });
};

const upsertRasterLayer = (
  map,
  { model, theme, opacity, showRaster, themeChanged, forecastDate, chartType }
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
    if (map.getLayer(layerId)) map.removeLayer(layerId);
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
          'raster-resampling': 'linear',
        },
        layout: { visibility: showRaster ? 'visible' : 'none' },
      },
      'graticules'
    );
  } else {
    map.setPaintProperty(layerId, 'raster-opacity', opacity);
    map.setLayoutProperty(layerId, 'visibility', showRaster ? 'visible' : 'none');
  }
};

export const syncWaveRasterLayers = (
  map,
  models = [],
  showRaster = false,
  isDarkMode = false,
  themeChanged = false,
  forecastPackage = {}
) => {
  if (!map) return;
  const theme = isDarkMode ? 'dark' : 'light';
  const selectedModels = getSelectedModels(models);
  const opacity = selectedModels.length > 0 ? Math.max(0.25, 1 / selectedModels.length) : 0;

  removeLegacyLayers(map);
  removeStaleRasterSources(
    map,
    new Set(selectedModels.map((model) => `${WAVE_RASTER_SOURCE_PREFIX}${model}`))
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
    })
  );

  ['wave-glass-fill', 'wave-glass-depth'].forEach((id) => {
    if (!map.getLayer(id)) return;
    map.setLayoutProperty(
      id,
      'visibility',
      showRaster && selectedModels.length > 0 ? 'visible' : 'none'
    );
  });
};

const removeWW3Contours = (map) => {
  if (map.getLayer(WW3_CONTOUR_LABEL_LAYER_ID)) map.removeLayer(WW3_CONTOUR_LABEL_LAYER_ID);
  if (map.getLayer(WW3_CONTOUR_LINE_LAYER_ID)) map.removeLayer(WW3_CONTOUR_LINE_LAYER_ID);
  if (map.getSource(WW3_CONTOUR_SOURCE_ID)) map.removeSource(WW3_CONTOUR_SOURCE_ID);
  ww3ContourUrl = null;
};

export const syncWW3ContourLayers = (
  map,
  models = [],
  showContours = false,
  isDarkMode = false,
  forecastPackage = {}
) => {
  if (!map) return;
  const selectedModels = getSelectedModels(models);
  const shouldShow = showContours && selectedModels.includes('WW3');

  if (!shouldShow) {
    removeWW3Contours(map);
    return;
  }

  const dataUrl = buildWW3ContourUrl({
    forecastDate: forecastPackage.forecastDate,
    chartType: forecastPackage.chartType,
  });

  if (map.getSource(WW3_CONTOUR_SOURCE_ID) && ww3ContourUrl !== dataUrl) {
    removeWW3Contours(map);
  }

  if (!map.getSource(WW3_CONTOUR_SOURCE_ID)) {
    map.addSource(WW3_CONTOUR_SOURCE_ID, {
      type: 'geojson',
      data: dataUrl,
    });
    ww3ContourUrl = dataUrl;
  }

  const colorProperty = isDarkMode ? 'color_dark' : 'color_light';
  const haloColor = isDarkMode ? 'rgba(7, 18, 28, 0.92)' : 'rgba(255, 255, 255, 0.94)';

  if (!map.getLayer(WW3_CONTOUR_LINE_LAYER_ID)) {
    map.addLayer(
      {
        id: WW3_CONTOUR_LINE_LAYER_ID,
        type: 'line',
        source: WW3_CONTOUR_SOURCE_ID,
        paint: {
          'line-color': ['get', colorProperty],
          'line-width': ['case', ['get', 'major'], 2.2, 1.35],
          'line-opacity': 0.95,
        },
      },
      'graticules'
    );
  } else {
    map.setPaintProperty(WW3_CONTOUR_LINE_LAYER_ID, 'line-color', ['get', colorProperty]);
  }

  if (!map.getLayer(WW3_CONTOUR_LABEL_LAYER_ID)) {
    map.addLayer(
      {
        id: WW3_CONTOUR_LABEL_LAYER_ID,
        type: 'symbol',
        source: WW3_CONTOUR_SOURCE_ID,
        layout: {
          'symbol-placement': 'line',
          'symbol-spacing': 260,
          'text-field': ['get', 'label'],
          'text-size': ['case', ['get', 'major'], 12, 10],
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Regular'],
          'text-keep-upright': true,
          'text-max-angle': 35,
          'text-allow-overlap': false,
          'text-ignore-placement': false,
        },
        paint: {
          'text-color': ['get', colorProperty],
          'text-halo-color': haloColor,
          'text-halo-width': 1.5,
          'text-halo-blur': 0.4,
        },
      },
      'graticules'
    );
  } else {
    map.setPaintProperty(WW3_CONTOUR_LABEL_LAYER_ID, 'text-color', ['get', colorProperty]);
    map.setPaintProperty(WW3_CONTOUR_LABEL_LAYER_ID, 'text-halo-color', haloColor);
  }
};

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
  const activeElement = SYMBOL_LAYER_MAP.find(({ id }) => Boolean(elements[id]))?.id ?? null;

  SYMBOL_LAYER_MAP.forEach(({ id: elementId, prefix, applyDirectionStyle }) => {
    const show = canShow && activeElement === elementId;
    selectedModels.forEach((model) => {
      const layerId = `${prefix}${model}`;
      if (!map.getLayer(layerId)) return;
      map.setLayoutProperty(layerId, 'visibility', show ? 'visible' : 'none');
      if (applyDirectionStyle) {
        const iconColor = directionStyle.theme === 'black' ? BLACK_ICON_COLOR : COLORED_ICON_COLOR;
        const iconSize = buildIconSize(directionStyle.size ?? 1.0);
        const iconOpacity = directionStyle.opacity ?? 1.0;
        map.setPaintProperty(layerId, 'icon-color', iconColor);
        map.setLayoutProperty(layerId, 'icon-size', iconSize);
        map.setPaintProperty(layerId, 'icon-opacity', iconOpacity);
      }
    });

    map.getStyle()?.layers?.forEach(({ id: layerId }) => {
      if (!layerId.startsWith(prefix)) return;
      const modelSuffix = layerId.slice(prefix.length);
      if (!selectedModels.includes(modelSuffix)) {
        map.setLayoutProperty(layerId, 'visibility', 'none');
      }
    });
  });

  if (map.getLayer('wave-arrows')) {
    map.setLayoutProperty('wave-arrows', 'visibility', 'none');
  }
};

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
    forecastPackage
  );

  syncWW3ContourLayers(
    map,
    models,
    enabled && Boolean(elements.waveContours),
    isDarkMode,
    forecastPackage
  );

  syncWaveSymbolLayers(map, config);
  prevThemeRef.current = nextTheme;
};
