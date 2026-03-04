import { useState, useEffect, useCallback } from 'react';
import { addWaveLayer } from '@dashboards/forecaster/map/layers/waveLayer';
import {
  WAVE_ELEMENTS,
  WAVE_RASTER_LAYER_PREFIX,
  WAVE_RASTER_SOURCE_PREFIX,
  WAVE_RASTER_DATE,
  STORAGE_KEYS,
} from '../constants/layerConstants';
import { parseStoredModels, readBoolStorage } from '../utils/layerPanelUtils';

const OFF_ELEMENTS = { particles: false, raster: false, waveDirection: false, wavePeriod: false };

// ── Wave raster tile sync (kept pure, outside React) ───────────────────────

const syncWaveRasterLayers = (map, models = [], showRaster = false, isDarkMode = false) => {
  if (!map) return;

  const theme        = isDarkMode ? 'dark' : 'light';
  const selectedModels = [...new Set(models.map((m) => m.toUpperCase()))];
  const targetIds    = new Set(selectedModels.map((m) => `${WAVE_RASTER_LAYER_PREFIX}${m.toLowerCase()}`));

  // Remove legacy single layer/source
  if (map.getLayer('wave-raster'))                         map.removeLayer('wave-raster');
  const legacySrc = isDarkMode ? 'wave-dark' : 'wave-light';
  if (map.getSource(legacySrc))                            map.removeSource(legacySrc);

  // Remove stale per-model layers
  (map.getStyle()?.layers || [])
    .map((l) => l.id)
    .filter((id) => id.startsWith(WAVE_RASTER_LAYER_PREFIX) && !targetIds.has(id))
    .forEach((id) => map.getLayer(id) && map.removeLayer(id));

  // Remove stale per-model sources
  Object.keys(map.getStyle()?.sources || {})
    .filter((id) => id.startsWith(WAVE_RASTER_SOURCE_PREFIX))
    .forEach((id) => {
      const model = id.replace(WAVE_RASTER_SOURCE_PREFIX, '').toUpperCase();
      if (!selectedModels.includes(model) && map.getSource(id)) map.removeSource(id);
    });

  const opacity = selectedModels.length > 0 ? Math.max(0.25, 1 / selectedModels.length) : 0;

  selectedModels.forEach((model) => {
    const key      = model.toLowerCase();
    const sourceId = `${WAVE_RASTER_SOURCE_PREFIX}${key}`;
    const layerId  = `${WAVE_RASTER_LAYER_PREFIX}${key}`;

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: 'raster',
        tiles: [`http://34.45.182.236:5173/tiles/${model}/${theme}/${WAVE_RASTER_DATE}/{z}/{x}/{y}.png`],
        tileSize: 256,
        bounds: [100, -5, 180, 50],
        scheme: 'xyz',
      });
    }

    const vis = showRaster ? 'visible' : 'none';
    if (!map.getLayer(layerId)) {
      map.addLayer({
        id: layerId, type: 'raster', source: sourceId,
        paint: { 'raster-opacity': opacity, 'raster-fade-duration': 0 },
        layout: { visibility: vis },
      }, 'graticules');
    } else {
      map.setPaintProperty(layerId, 'raster-opacity', opacity);
      map.setLayoutProperty(layerId, 'visibility', vis);
    }
  });

  ['wave-glass-fill', 'wave-glass-depth'].forEach((id) => {
    if (map.getLayer(id)) {
      map.setLayoutProperty(
        id, 'visibility',
        showRaster && selectedModels.length > 0 ? 'visible' : 'none'
      );
    }
  });
};

const applyWaveLayers = (map, config, isDarkMode) => {
  if (!map) return;
  const showRaster = Boolean(config.enabled && config.elements?.raster);
  syncWaveRasterLayers(map, config.models || [], showRaster, isDarkMode);
};

// ── Hook ───────────────────────────────────────────────────────────────────

/**
 * Manages wave layer configuration state and all map side-effects.
 * Initialises from localStorage on mount.
 */
export const useWaveConfig = ({ mapRef, isDarkMode }) => {
  const [waveConfig, setWaveConfig] = useState({
    enabled:  false,
    models:   ['WW3'],
    elements: OFF_ELEMENTS,
  });

  // ── Hydrate from localStorage ───────────────────────────────────────────────
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

  // ── Toggle enabled ──────────────────────────────────────────────────────────
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
  }, [mapRef, isDarkMode]);

  // ── Select element (single-select) ─────────────────────────────────────────
  const setWaveElement = useCallback((elementId) => {
    setWaveConfig((prev) => {
      const updatedElements = WAVE_ELEMENTS.reduce((acc, opt) => ({
        ...acc,
        [opt.id]: opt.id === elementId,
      }), {});

      const next = { ...prev, elements: updatedElements };
      WAVE_ELEMENTS.forEach((opt) =>
        localStorage.setItem(opt.storageKey, String(next.elements[opt.id]))
      );
      applyWaveLayers(mapRef.current, next, isDarkMode);
      return next;
    });
  }, [mapRef, isDarkMode]);

  // ── Toggle model (multi-select) ─────────────────────────────────────────────
  const toggleWaveModel = useCallback((model) => {
    setWaveConfig((prev) => {
      const models = prev.models.includes(model)
        ? prev.models.filter((id) => id !== model)
        : [...prev.models, model];

      const next = { ...prev, models };
      localStorage.setItem(STORAGE_KEYS.WAVE_MODEL, models.join(','));
      applyWaveLayers(mapRef.current, next, isDarkMode);
      return next;
    });
  }, [mapRef, isDarkMode]);

  // ── Apply wave layers on init ───────────────────────────────────────────────
  // Called from the parent's combined map-ready effect
  const applyOnMapReady = useCallback((config) => {
    applyWaveLayers(mapRef.current, config, isDarkMode);
  }, [mapRef, isDarkMode]);

  return { waveConfig, toggleWaveLayer, setWaveElement, toggleWaveModel, applyOnMapReady };
};