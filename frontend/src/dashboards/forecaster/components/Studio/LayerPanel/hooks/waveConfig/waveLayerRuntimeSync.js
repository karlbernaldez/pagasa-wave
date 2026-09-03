import {
  WAVE_RASTER_LAYER_PREFIX,
  WAVE_RASTER_SOURCE_PREFIX,
} from '@dashboards/forecaster/components/Studio/LayerPanel/constants/layerConstants';

import { buildWaveTileUrl, getSelectedModels } from './waveHelpers';
import { syncAllWaveLayers as syncBaseWaveLayers } from './waveLayerSync';
import { getWaveModelRuntimeProfile } from './waveModelRuntimeRegistry';

const BUILT_IN_RUNTIME_MODELS = new Set(['WW3', 'ECWAM']);

const ensureManagedRuntimeRasterSources = (map, config, isDarkMode, forecastPackage) => {
  if (!map || !config?.enabled || !config?.elements?.raster) return;

  const theme = isDarkMode ? 'dark' : 'light';
  getSelectedModels(config.models)
    .filter((model) => !BUILT_IN_RUNTIME_MODELS.has(model))
    .forEach((model) => {
      const profile = getWaveModelRuntimeProfile(model);
      if (!profile || profile.mode !== 'managed_timestamp') return;

      const sourceId = `${WAVE_RASTER_SOURCE_PREFIX}${model}`;
      if (map.getSource(sourceId)) return;

      const tileUrl = buildWaveTileUrl({
        model,
        theme,
        forecastDate: forecastPackage?.forecastDate,
        chartType: forecastPackage?.chartType,
      });

      map.addSource(sourceId, {
        type: 'raster',
        tiles: [tileUrl],
        tileSize: 256,
        scheme: profile.rasterScheme || 'xyz',
        bounds: profile.bounds || [100, -5, 180, 50],
      });

      // The base synchronizer creates and manages the matching raster layer.
      // Creating only the source here lets the runtime profile control source metadata
      // without duplicating the existing layer lifecycle.
      const layerId = `${WAVE_RASTER_LAYER_PREFIX}${model}`;
      if (map.getLayer(layerId)) map.removeLayer(layerId);
    });
};

export const syncAllWaveLayers = (map, config, isDarkMode, prevThemeRef, forecastPackage = {}) => {
  ensureManagedRuntimeRasterSources(map, config, isDarkMode, forecastPackage);
  syncBaseWaveLayers(map, config, isDarkMode, prevThemeRef, forecastPackage);
};
