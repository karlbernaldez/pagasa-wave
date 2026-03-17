import { useState, useEffect, useCallback, useRef } from 'react';
import { addWaveLayer } from '@dashboards/forecaster/map/layers/waveLayer';
import {
  WAVE_ELEMENTS,
  WAVE_RASTER_LAYER_PREFIX,
  WAVE_RASTER_SOURCE_PREFIX,
  WAVE_RASTER_DATE,
  STORAGE_KEYS,
} from '../constants/layerConstants';
import { parseStoredModels, readBoolStorage } from '../utils/layerPanelUtils';

const OFF_ELEMENTS = {
  particles: false,
  raster: false,
  waveDirection: false,
  wavePeriod: false,
};

const MRI3_TIMESTEP    = '012';
const WAVE_BUCKET_BASE = 'https://storage.googleapis.com/wavelab-tiles';

const normalizeModelName = (model = '') => model.trim().toUpperCase();

const buildWaveTileUrl = ({ model, theme, date }) => {
  const m = normalizeModelName(model);
  if (m === 'MRI3') return `${WAVE_BUCKET_BASE}/${m}/${theme}/${date}/${MRI3_TIMESTEP}/{z}/{x}/{y}.png`;
  if (m === 'WW3')  return `${WAVE_BUCKET_BASE}/${m}/${theme}/2026011200/{z}/{x}/{y}.png`;
  return `${WAVE_BUCKET_BASE}/${m}/${theme}/${date}/{z}/{x}/{y}.png`;
};

// ── Surgical raster sync ──────────────────────────────────────────────────────
//
// Strategy (no flicker):
//   1. Model added?     → add only the new source/layer
//   2. Model removed?   → remove only the stale source/layer
//   3. Theme changed?   → remove + re-add only the affected source/layer
//   4. Just opacity/visibility change? → setPaintProperty/setLayoutProperty in-place
//
// Nothing is torn down unless it actually needs to change.

const syncWaveRasterLayers = (map, models = [], showRaster = false, isDarkMode = false, themeChanged = false) => {
  if (!map) return;

  const theme = isDarkMode ? 'dark' : 'light';
  const selectedModels = [...new Set(models.map(normalizeModelName).filter(Boolean))];
  const opacity = selectedModels.length > 0 ? Math.max(0.25, 1 / selectedModels.length) : 0;

  // ── 1. Remove legacy single-source layers if still present ────────────────
  if (map.getLayer('wave-raster')) map.removeLayer('wave-raster');
  ['wave-dark', 'wave-light'].forEach((id) => {
    if (map.getSource(id)) map.removeSource(id);
  });

  // ── 2. Find currently existing per-model sources on the map ───────────────
  const existingSourceIds = new Set(
    Object.keys(map.getStyle()?.sources || {}).filter((id) =>
      id.startsWith(WAVE_RASTER_SOURCE_PREFIX)
    )
  );

  const targetSourceIds = new Set(
    selectedModels.map((m) => `${WAVE_RASTER_SOURCE_PREFIX}${m}`)
  );

  // ── 3. Remove stale models (deselected) ───────────────────────────────────
  existingSourceIds.forEach((sourceId) => {
    if (!targetSourceIds.has(sourceId)) {
      const layerId = sourceId.replace(WAVE_RASTER_SOURCE_PREFIX, WAVE_RASTER_LAYER_PREFIX);
      if (map.getLayer(layerId))   map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    }
  });

  // ── 4. Add / update each selected model ───────────────────────────────────
  selectedModels.forEach((model) => {
    const sourceId    = `${WAVE_RASTER_SOURCE_PREFIX}${model}`;
    const layerId     = `${WAVE_RASTER_LAYER_PREFIX}${model}`;
    const tileUrl     = buildWaveTileUrl({ model, theme, date: WAVE_RASTER_DATE });
    const sourceExists = map.getSource(sourceId);
    const layerExists  = map.getLayer(layerId);

    if (sourceExists && themeChanged) {
      // Theme flipped — swap tile URL for this source only, no other models touched
      if (layerExists)   map.removeLayer(layerId);
      map.removeSource(sourceId);

      map.addSource(sourceId, {
        type: 'raster',
        tiles: [tileUrl],
        tileSize: 256,
        bounds: [100, -5, 180, 50],
        scheme: 'xyz',
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
      // Already correct — update paint/layout in-place, no flicker
      map.setPaintProperty(layerId,  'raster-opacity', opacity);
      map.setLayoutProperty(layerId, 'visibility', showRaster ? 'visible' : 'none');
    } else {
      // New model — add from scratch
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: 'raster',
          tiles: [tileUrl],
          tileSize: 256,
          bounds: [100, -5, 180, 50],
          scheme: 'xyz',
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

  // ── 5. Re-balance opacity across all active layers after count changes ─────
  selectedModels.forEach((model) => {
    const layerId = `${WAVE_RASTER_LAYER_PREFIX}${model}`;
    if (map.getLayer(layerId)) {
      map.setPaintProperty(layerId, 'raster-opacity', opacity);
    }
  });

  // ── 6. Glass overlay visibility ───────────────────────────────────────────
  ['wave-glass-fill', 'wave-glass-depth'].forEach((id) => {
    if (map.getLayer(id)) {
      map.setLayoutProperty(
        id,
        'visibility',
        showRaster && selectedModels.length > 0 ? 'visible' : 'none'
      );
    }
  });
};

// ── Hook ─────────────────────────────────────────────────────────────────────

export const useWaveConfig = ({ mapRef, isDarkMode }) => {
  const [waveConfig, setWaveConfig] = useState({
    enabled:  false,
    models:   ['WW3'],
    elements: OFF_ELEMENTS,
  });

  // Track previous theme so we only trigger a source swap when it actually changes
  const prevThemeRef = useRef(isDarkMode ? 'dark' : 'light');

  const applyWaveLayers = useCallback((map, config, dark) => {
    if (!map) return;

    const nextTheme    = dark ? 'dark' : 'light';
    const themeChanged = prevThemeRef.current !== nextTheme;
    const showRaster   = Boolean(config.enabled && config.elements?.raster);

    syncWaveRasterLayers(map, config.models || [], showRaster, dark, themeChanged);

    prevThemeRef.current = nextTheme;
  }, []);

  // ── Hydrate from localStorage ─────────────────────────────────────────────
  useEffect(() => {
    const saved = {
      enabled:  readBoolStorage(STORAGE_KEYS.WAVE_ENABLED),
      models:   parseStoredModels(localStorage.getItem(STORAGE_KEYS.WAVE_MODEL), 'WW3'),
      elements: {
        particles:     readBoolStorage('WAVE_PARTICLES'),
        raster:        readBoolStorage('WAVE_RASTER'),
        waveDirection: readBoolStorage('WAVE_DIRECTION'),
        wavePeriod:    readBoolStorage('WAVE_PERIOD'),
      },
    };
    setWaveConfig(saved);
  }, []);

  // ── Re-sync only when isDarkMode flips ────────────────────────────────────
  useEffect(() => {
    setWaveConfig((prev) => {
      applyWaveLayers(mapRef.current, prev, isDarkMode);
      return prev; // no state change, just side-effect
    });
  }, [isDarkMode, mapRef, applyWaveLayers]);

  // ── Toggle enabled ────────────────────────────────────────────────────────
  const toggleWaveLayer = useCallback(() => {
    setWaveConfig((prev) => {
      const next = { ...prev, enabled: !prev.enabled };
      localStorage.setItem(STORAGE_KEYS.WAVE_ENABLED, String(next.enabled));

      if (!next.enabled) {
        applyWaveLayers(mapRef.current, { ...next, elements: OFF_ELEMENTS }, isDarkMode);
      } else {
        applyWaveLayers(mapRef.current, next, isDarkMode);
        addWaveLayer(mapRef.current, isDarkMode);
      }
      return next;
    });
  }, [mapRef, isDarkMode, applyWaveLayers]);

  // ── Select element ────────────────────────────────────────────────────────
  const setWaveElement = useCallback((elementId) => {
    setWaveConfig((prev) => {
      const updatedElements = WAVE_ELEMENTS.reduce(
        (acc, opt) => ({ ...acc, [opt.id]: opt.id === elementId }),
        {}
      );
      const next = { ...prev, elements: updatedElements };
      WAVE_ELEMENTS.forEach((opt) =>
        localStorage.setItem(opt.storageKey, String(next.elements[opt.id]))
      );
      applyWaveLayers(mapRef.current, next, isDarkMode);
      return next;
    });
  }, [mapRef, isDarkMode, applyWaveLayers]);

  // ── Toggle model ──────────────────────────────────────────────────────────
  const toggleWaveModel = useCallback((model) => {
    setWaveConfig((prev) => {
      const normalized = normalizeModelName(model);
      const models = prev.models.includes(normalized)
        ? prev.models.filter((id) => id !== normalized)
        : [...prev.models, normalized];

      const next = { ...prev, models };
      localStorage.setItem(STORAGE_KEYS.WAVE_MODEL, models.join(','));
      applyWaveLayers(mapRef.current, next, isDarkMode);
      return next;
    });
  }, [mapRef, isDarkMode, applyWaveLayers]);

  // ── Apply on map ready ────────────────────────────────────────────────────
  const applyOnMapReady = useCallback((config) => {
    applyWaveLayers(mapRef.current, config, isDarkMode);
  }, [mapRef, isDarkMode, applyWaveLayers]);

  return { waveConfig, toggleWaveLayer, setWaveElement, toggleWaveModel, applyOnMapReady };
};