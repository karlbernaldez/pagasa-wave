import { useState, useEffect, useCallback, useRef } from 'react';
import {
  addWindLayer,
  addWindSource,
  hasWindData,
  hasWindRaster,
  getWindRasterTileUrl,
  WIND_RASTER_LAYER_PREFIX,
  WIND_RASTER_SOURCE_PREFIX,
} from '@dashboards/forecaster/map/layers/windLayer';
import { fetchLatestGeoJSON } from '@dashboards/forecaster/utils/mapHelpers';
import { WIND_ELEMENTS, WIND_MODELS, STORAGE_KEYS } from '../constants/layerConstants';
import { parseStoredModels, readBoolStorage } from '../utils/layerPanelUtils';

const OFF_ELEMENTS = { particles: false, raster: false, barbs: false };

const normalizeModelName = (model = '') => model.trim().toUpperCase();

// ── Surgical raster sync ──────────────────────────────────────────────────────
// Exact mirror of syncWaveRasterLayers:
//   1. Model added?     → add only the new source/layer
//   2. Model removed?   → remove only the stale source/layer
//   3. Theme changed?   → remove + re-add only the affected source/layer
//   4. Opacity/visibility change? → setPaintProperty/setLayoutProperty in-place

const syncWindRasterLayers = (map, models = [], showRaster = false, isDarkMode = false, themeChanged = false) => {
  if (!map) return;

  // Only include models that actually have a raster tileset
  const selectedModels = [...new Set(models.map(normalizeModelName).filter(hasWindRaster))];
  const opacity = selectedModels.length > 0 ? Math.max(0.25, 1 / selectedModels.length) : 0;

  console.log(`[WindRaster] sync models=[${selectedModels}] showRaster=${showRaster} themeChanged=${themeChanged}`);

  // ── 1. Remove legacy single raster layer/source if still present ──────────
  if (map.getLayer('wind-raster')) map.removeLayer('wind-raster');
  ['wind-solarstorm', 'wind-darkstorm'].forEach((id) => {
    if (map.getSource(id)) map.removeSource(id);
  });

  // ── 2. Find currently existing per-model sources on the map ───────────────
  const existingSourceIds = new Set(
    Object.keys(map.getStyle()?.sources || {}).filter((id) =>
      id.startsWith(WIND_RASTER_SOURCE_PREFIX)
    )
  );

  const targetSourceIds = new Set(
    selectedModels.map((m) => `${WIND_RASTER_SOURCE_PREFIX}${m}`)
  );

  // ── 3. Remove stale models (deselected or no longer have a tileset) ────────
  existingSourceIds.forEach((sourceId) => {
    if (!targetSourceIds.has(sourceId)) {
      const layerId = sourceId.replace(WIND_RASTER_SOURCE_PREFIX, WIND_RASTER_LAYER_PREFIX);
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    }
  });

  // ── 4. Add / update each selected model ───────────────────────────────────
  selectedModels.forEach((model) => {
    const sourceId = `${WIND_RASTER_SOURCE_PREFIX}${model}`;
    const layerId = `${WIND_RASTER_LAYER_PREFIX}${model}`;
    const tileUrl = getWindRasterTileUrl(model, isDarkMode);
    const sourceExists = map.getSource(sourceId);
    const layerExists = map.getLayer(layerId);

    if (sourceExists && themeChanged) {
      // Theme flipped — swap tileset URL for this model only
      if (layerExists) map.removeLayer(layerId);
      map.removeSource(sourceId);

      map.addSource(sourceId, {
        type: 'raster',
        url: `${tileUrl}?fresh=${Date.now()}`,
        tileSize: 4096,
      });
      map.addLayer(
        {
          id: layerId,
          type: 'raster',
          source: sourceId,
          paint: { 'raster-opacity': opacity, 'raster-fade-duration': 0 },
          layout: { visibility: showRaster ? 'visible' : 'none' },
        },
        'graticules'
      );
    } else if (sourceExists && layerExists) {
      // Already correct — update in-place, no flicker
      map.setPaintProperty(layerId, 'raster-opacity', opacity);
      map.setLayoutProperty(layerId, 'visibility', showRaster ? 'visible' : 'none');
    } else {
      // New model — add from scratch
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: 'raster',
          url: `${tileUrl}?fresh=${Date.now()}`,
          tileSize: 4096,
        });
      }
      if (!map.getLayer(layerId)) {
        map.addLayer(
          {
            id: layerId,
            type: 'raster',
            source: sourceId,
            paint: { 'raster-opacity': opacity, 'raster-fade-duration': 0 },
            layout: { visibility: showRaster ? 'visible' : 'none' },
          },
          'graticules'
        );
      }
    }
  });

  // ── 5. Re-balance opacity after model count changes ───────────────────────
  selectedModels.forEach((model) => {
    const layerId = `${WIND_RASTER_LAYER_PREFIX}${model}`;
    if (map.getLayer(layerId)) {
      map.setPaintProperty(layerId, 'raster-opacity', opacity);
    }
  });

  // ── 6. Glass overlay visibility ───────────────────────────────────────────
  ['wind-glass-fill', 'wind-glass-depth'].forEach((id) => {
    if (map.getLayer(id)) {
      map.setLayoutProperty(
        id,
        'visibility',
        showRaster && selectedModels.length > 0 ? 'visible' : 'none'
      );
    }
  });
};

// ── Sync particles + barbs (separate from raster, uses primary model) ─────────
const syncWindNonRasterLayers = async (map, config, prevModelRef) => {
  if (!map) return;

  const { enabled, models = [], elements } = config;
  const vis = (v) => (v ? 'visible' : 'none');
  const safeSetLayout = (id, prop, val) => {
    if (map.getLayer(id)) map.setLayoutProperty(id, prop, val);
  };

  const selectedModels = [...new Set(models.map(normalizeModelName).filter(Boolean))];
  const primaryModel = selectedModels.find((m) => hasWindData(m)) ?? null;

  if (!enabled || !primaryModel) {
    safeSetLayout('wind-particles', 'visibility', 'none');
    safeSetLayout('wind-arrows', 'visibility', 'none');
    safeSetLayout('wind-labels', 'visibility', 'none');
    if (!primaryModel && map.getSource('wind-points')) {
      map.getSource('wind-points').setData({ type: 'FeatureCollection', features: [] });
    }
    if (!primaryModel) {
      if (map.getLayer('wind-particles')) map.removeLayer('wind-particles');
      if (map.getSource('wind-particles')) map.removeSource('wind-particles');
      prevModelRef.current = null;
    }
    return;
  }

  const modelChanged = prevModelRef.current !== primaryModel;
  // ✅ FIX: also rebuild if the source was torn down (e.g. all models were
  // temporarily invalid), regardless of what prevModelRef thinks.
  const sourceGone = !map.getSource('wind-particles');
  const layerGone = !map.getLayer('wind-particles');
  const needsRebuild = modelChanged || sourceGone || layerGone;

  if (needsRebuild) {
    console.log(
      `[WindSync] rebuild — model: "${prevModelRef.current}"→"${primaryModel}" ` +
      `sourceGone=${sourceGone} layerGone=${layerGone}`
    );
    await addWindSource(map, false, primaryModel);
    await addWindLayer(map, false);
    prevModelRef.current = primaryModel;
  }

  safeSetLayout('wind-particles', 'visibility', vis(elements.particles));
  safeSetLayout('wind-arrows', 'visibility', vis(elements.barbs));
  safeSetLayout('wind-labels', 'visibility', vis(elements.barbs));
};

// ── Hook ─────────────────────────────────────────────────────────────────────

export const useWindConfig = ({ mapRef, isDarkMode }) => {
  const [windConfig, setWindConfig] = useState({
    enabled: false,
    models: ['ECMWF'],
    elements: OFF_ELEMENTS,
  });

  const prevThemeRef = useRef(isDarkMode ? 'dark' : 'light');
  const prevModelRef = useRef(null);
  const savedConfigRef = useRef(null);

  const applyWindLayers = useCallback((map, config, dark) => {
    if (!map) return;

    const nextTheme = dark ? 'dark' : 'light';
    const themeChanged = prevThemeRef.current !== nextTheme;
    const showRaster = Boolean(config.enabled && config.elements?.raster);

    // Raster layers — surgical sync per model (mirrors applyWaveLayers)
    syncWindRasterLayers(map, config.models || [], showRaster, dark, themeChanged);

    // Particles + barbs — driven by primary model
    syncWindNonRasterLayers(map, config, prevModelRef);

    prevThemeRef.current = nextTheme;
  }, []);

  // ── Hydrate from localStorage ───────────────────────────────────────────────
  useEffect(() => {
    const saved = {
      enabled: readBoolStorage(STORAGE_KEYS.WIND_ENABLED),
      models: parseStoredModels(localStorage.getItem(STORAGE_KEYS.WIND_MODEL), 'ECMWF'),
      elements: {
        particles: readBoolStorage('WIND_PARTICLES'),
        raster: readBoolStorage('WIND_RASTER'),
        barbs: readBoolStorage('WIND_BARBS'),
      },
    };
    savedConfigRef.current = saved;
    setWindConfig(saved);
  }, []);

  // ── Re-sync when theme flips ────────────────────────────────────────────────
  useEffect(() => {
    setWindConfig((prev) => {
      applyWindLayers(mapRef.current, prev, isDarkMode);
      return prev;
    });
  }, [isDarkMode, mapRef, applyWindLayers]);

  // ── Toggle enabled ──────────────────────────────────────────────────────────
  const toggleWindLayer = useCallback(() => {
    setWindConfig((prev) => {
      const next = { ...prev, enabled: !prev.enabled };
      localStorage.setItem(STORAGE_KEYS.WIND_ENABLED, String(next.enabled));

      if (!next.enabled) {
        applyWindLayers(mapRef.current, { ...next, elements: OFF_ELEMENTS }, isDarkMode);
      } else {
        addWindSource(mapRef.current, isDarkMode, next.models.join(',')).then(() => {
          addWindLayer(mapRef.current, isDarkMode).then(() => {
            applyWindLayers(mapRef.current, next, isDarkMode);
          });
        });
      }
      return next;
    });
  }, [mapRef, isDarkMode, applyWindLayers]);

  // ── Select element ──────────────────────────────────────────────────────────
  const setWindElement = useCallback((elementId) => {
    setWindConfig((prev) => {
      const updatedElements = WIND_ELEMENTS.reduce((acc, opt) => ({
        ...acc,
        [opt.id]: opt.id === elementId,
      }), {});

      const next = { ...prev, elements: updatedElements };
      WIND_ELEMENTS.forEach((opt) =>
        localStorage.setItem(opt.storageKey, String(next.elements[opt.id]))
      );
      applyWindLayers(mapRef.current, next, isDarkMode);
      return next;
    });
  }, [mapRef, isDarkMode, applyWindLayers]);

  // ── Toggle model ────────────────────────────────────────────────────────────
  const toggleWindModel = useCallback((model) => {
    const meta = WIND_MODELS.find((m) => m.id === normalizeModelName(model));
    if (!meta?.available) return;

    setWindConfig((prev) => {
      const normalized = normalizeModelName(model);
      const models = prev.models.includes(normalized)
        ? prev.models.filter((id) => id !== normalized)
        : [...prev.models, normalized];

      const next = { ...prev, models };
      // Store 'NONE' instead of '' so parseStoredModels won't fall back to default
      localStorage.setItem(STORAGE_KEYS.WIND_MODEL, models.length ? models.join(',') : 'NONE');
      applyWindLayers(mapRef.current, next, isDarkMode);
      return next;
    });
  }, [mapRef, isDarkMode, applyWindLayers]);

  // ── Apply on map ready ──────────────────────────────────────────────────────
  const applyOnMapReady = useCallback(async () => {
    const config = savedConfigRef.current ?? windConfig;
    if (config.enabled) {
      await addWindSource(mapRef.current, isDarkMode, config.models.join(','));
      await addWindLayer(mapRef.current, isDarkMode);
    }
    applyWindLayers(mapRef.current, config, isDarkMode);
  }, [mapRef, isDarkMode, applyWindLayers, windConfig]);

  return { windConfig, toggleWindLayer, setWindElement, toggleWindModel, applyOnMapReady };
};