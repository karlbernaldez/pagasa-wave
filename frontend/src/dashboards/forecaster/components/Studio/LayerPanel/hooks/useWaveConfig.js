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

const OFF_ELEMENTS = {
  particles: false,
  raster: false,
  waveDirection: false,
  wavePeriod: false,
};

const MRI3_TIMESTEP = '012';
const WAVE_BUCKET_BASE = 'https://storage.googleapis.com/wavelab-tiles';

// ── Helpers ──────────────────────────────────────────────────────────────────

const normalizeModelName = (model = '') => model.trim();

const buildWaveTileUrl = ({ model, theme, date }) => {
  const normalizedModel = normalizeModelName(model);

  if (normalizedModel === 'MRI3') {
    return `${WAVE_BUCKET_BASE}/${normalizedModel}/${theme}/${date}/${MRI3_TIMESTEP}/{z}/{x}/{y}.png`;
  }
  if (normalizedModel === 'WW3') {
    return `${WAVE_BUCKET_BASE}/${normalizedModel}/${theme}/${'2026011200'}/{z}/{x}/{y}.png`;
  }

  return `${WAVE_BUCKET_BASE}/${normalizedModel}/${theme}/${date}/{z}/{x}/{y}.png`;
};

// ── Wave raster tile sync (kept pure, outside React) ────────────────────────

const syncWaveRasterLayers = (map, models = [], showRaster = false, isDarkMode = false) => {
  if (!map) return;

  const theme = isDarkMode ? 'dark' : 'light';

  const selectedModels = [
    ...new Set(
      models
        .map(normalizeModelName)
        .filter(Boolean)
    ),
  ];

  const targetLayerIds = new Set(
    selectedModels.map((model) => `${WAVE_RASTER_LAYER_PREFIX}${model}`)
  );

  const targetSourceIds = new Set(
    selectedModels.map((model) => `${WAVE_RASTER_SOURCE_PREFIX}${model}`)
  );

  // Remove legacy single layer/source
  if (map.getLayer('wave-raster')) {
    map.removeLayer('wave-raster');
  }

  const legacySrc = isDarkMode ? 'wave-dark' : 'wave-light';
  if (map.getSource(legacySrc)) {
    map.removeSource(legacySrc);
  }

  // Remove stale per-model layers
  (map.getStyle()?.layers || [])
    .map((layer) => layer.id)
    .filter((id) => id.startsWith(WAVE_RASTER_LAYER_PREFIX) && !targetLayerIds.has(id))
    .forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
    });

  // Remove stale per-model sources
  Object.keys(map.getStyle()?.sources || {})
    .filter((id) => id.startsWith(WAVE_RASTER_SOURCE_PREFIX) && !targetSourceIds.has(id))
    .forEach((id) => {
      if (map.getSource(id)) map.removeSource(id);
    });

  const opacity = selectedModels.length > 0
    ? Math.max(0.25, 1 / selectedModels.length)
    : 0;

  selectedModels.forEach((model) => {
    const sourceId = `${WAVE_RASTER_SOURCE_PREFIX}${model}`;
    const layerId = `${WAVE_RASTER_LAYER_PREFIX}${model}`;

    const tileUrl = buildWaveTileUrl({
      model,
      theme,
      date: WAVE_RASTER_DATE,
    });

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: 'raster',
        tiles: [tileUrl],
        tileSize: 256,
        bounds: [100, -5, 180, 50],
        scheme: 'xyz',
      });
    }

    const visibility = showRaster ? 'visible' : 'none';

    if (!map.getLayer(layerId)) {
      map.addLayer(
        {
          id: layerId,
          type: 'raster',
          source: sourceId,
          paint: {
            'raster-opacity': opacity,
            'raster-fade-duration': 0,
          },
          layout: {
            visibility,
          },
        },
        'graticules'
      );
    } else {
      map.setPaintProperty(layerId, 'raster-opacity', opacity);
      map.setLayoutProperty(layerId, 'visibility', visibility);
    }
  });

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

const applyWaveLayers = (map, config, isDarkMode) => {
  if (!map) return;

  const showRaster = Boolean(config.enabled && config.elements?.raster);
  syncWaveRasterLayers(map, config.models || [], showRaster, isDarkMode);
};

// ── Hook ─────────────────────────────────────────────────────────────────────

export const useWaveConfig = ({ mapRef, isDarkMode }) => {
  const [waveConfig, setWaveConfig] = useState({
    enabled: false,
    models: ['WW3'],
    elements: OFF_ELEMENTS,
  });

  // ── Hydrate from localStorage ─────────────────────────────────────────────
  useEffect(() => {
    const saved = {
      enabled: readBoolStorage(STORAGE_KEYS.WAVE_ENABLED),
      models: parseStoredModels(localStorage.getItem(STORAGE_KEYS.WAVE_MODEL), 'WW3'),
      elements: {
        particles: readBoolStorage('WAVE_PARTICLES'),
        raster: readBoolStorage('WAVE_RASTER'),
        waveDirection: readBoolStorage('WAVE_DIRECTION'),
        wavePeriod: readBoolStorage('WAVE_PERIOD'),
      },
    };

    setWaveConfig(saved);
  }, []);

  // ── Toggle enabled ────────────────────────────────────────────────────────
  const toggleWaveLayer = useCallback(() => {
    setWaveConfig((prev) => {
      const next = { ...prev, enabled: !prev.enabled };

      localStorage.setItem(STORAGE_KEYS.WAVE_ENABLED, String(next.enabled));

      if (!next.enabled) {
        applyWaveLayers(
          mapRef.current,
          { ...next, elements: OFF_ELEMENTS },
          isDarkMode
        );
      } else {
        applyWaveLayers(mapRef.current, next, isDarkMode);
        addWaveLayer(mapRef.current, isDarkMode);
      }

      return next;
    });
  }, [mapRef, isDarkMode]);

  // ── Select element (single-select) ───────────────────────────────────────
  const setWaveElement = useCallback((elementId) => {
    setWaveConfig((prev) => {
      const updatedElements = WAVE_ELEMENTS.reduce(
        (acc, opt) => ({
          ...acc,
          [opt.id]: opt.id === elementId,
        }),
        {}
      );

      const next = { ...prev, elements: updatedElements };

      WAVE_ELEMENTS.forEach((opt) => {
        localStorage.setItem(opt.storageKey, String(next.elements[opt.id]));
      });

      applyWaveLayers(mapRef.current, next, isDarkMode);
      return next;
    });
  }, [mapRef, isDarkMode]);

  // ── Toggle model (multi-select) ──────────────────────────────────────────
  const toggleWaveModel = useCallback((model) => {
    setWaveConfig((prev) => {
      const normalizedIncoming = model.trim().toUpperCase();

      const models = prev.models.includes(normalizedIncoming)
        ? prev.models.filter((id) => id !== normalizedIncoming)
        : [...prev.models, normalizedIncoming];

      const next = { ...prev, models };

      localStorage.setItem(STORAGE_KEYS.WAVE_MODEL, models.join(','));
      applyWaveLayers(mapRef.current, next, isDarkMode);

      return next;
    });
  }, [mapRef, isDarkMode]);

  // ── Apply wave layers on init ─────────────────────────────────────────────
  const applyOnMapReady = useCallback((config) => {
    applyWaveLayers(mapRef.current, config, isDarkMode);
  }, [mapRef, isDarkMode]);

  return {
    waveConfig,
    toggleWaveLayer,
    setWaveElement,
    toggleWaveModel,
    applyOnMapReady,
  };
};