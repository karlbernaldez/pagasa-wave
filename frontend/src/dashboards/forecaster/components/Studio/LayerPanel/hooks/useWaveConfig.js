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
  particles:     false,
  raster:        false,
  waveDirection: false,
  wavePeriod:    false,
};

const MRI3_TIMESTEP    = '012';
const WAVE_BUCKET_BASE = 'https://storage.googleapis.com/wavelab-tiles';

const normalizeModelName = (model = '') => model.trim().toUpperCase();

const buildWaveTileUrl = ({ model, theme, date }) => {
  const m = normalizeModelName(model);
  if (m === 'MRI3')  return `${WAVE_BUCKET_BASE}/${m}/${theme}/${date}/${MRI3_TIMESTEP}/{z}/{x}/{y}.png`;
  if (m === 'WW3')   return `${WAVE_BUCKET_BASE}/${m}/${theme}/2026011200/{z}/{x}/{y}.png`;
  return `${WAVE_BUCKET_BASE}/${m}/${theme}/${date}/{z}/{x}/{y}.png`;
};

// ── Element → layer visibility map ───────────────────────────────────────────
//
// Each element key maps to which map layers should be visible.
// Layers not listed for an element are hidden.
//
const ELEMENT_LAYER_MAP = {
  raster:        ['wave-raster'],      // handled by syncWaveRasterLayers; listed for clarity
  waveDirection: ['wave-direction'],
  wavePeriod:    [],                   // period is raster-only — set the right tile URL instead
  particles:     [],                   // particles handled separately if you add that layer
};

// Symbol layers that this hook controls (toggled exclusively)
const SYMBOL_LAYERS = ['wave-direction', 'wave-arrows'];

// ── Sync symbol layers based on active element ────────────────────────────────
const syncWaveSymbolLayers = (map, elements = {}, enabled = false) => {
  if (!map) return;

  SYMBOL_LAYERS.forEach((layerId) => {
    if (!map.getLayer(layerId)) return;

    let show = false;
    if (enabled) {
      if (layerId === 'wave-direction') show = Boolean(elements.waveDirection);
      if (layerId === 'wave-arrows')    show = Boolean(elements.waveDirection); // wind barbs follow same toggle
    }

    map.setLayoutProperty(layerId, 'visibility', show ? 'visible' : 'none');
  });
};

// ── Surgical raster sync ──────────────────────────────────────────────────────
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

  // ── 3. Remove stale (deselected) model layers ─────────────────────────────
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
      if (layerExists)   map.removeLayer(layerId);
      map.removeSource(sourceId);
      map.addSource(sourceId, { type: 'raster', tiles: [tileUrl], tileSize: 256, bounds: [100, -5, 180, 50], scheme: 'xyz' });
      map.addLayer({ id: layerId, type: 'raster', source: sourceId,
        paint: { 'raster-opacity': opacity, 'raster-fade-duration': 0 },
        layout: { visibility: showRaster ? 'visible' : 'none' } }, 'graticules');
    } else if (sourceExists && layerExists) {
      map.setPaintProperty(layerId,  'raster-opacity', opacity);
      map.setLayoutProperty(layerId, 'visibility', showRaster ? 'visible' : 'none');
    } else {
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, { type: 'raster', tiles: [tileUrl], tileSize: 256, bounds: [100, -5, 180, 50], scheme: 'xyz' });
      }
      if (!map.getLayer(layerId)) {
        map.addLayer({ id: layerId, type: 'raster', source: sourceId,
          paint: { 'raster-opacity': opacity, 'raster-fade-duration': 0 },
          layout: { visibility: showRaster ? 'visible' : 'none' } }, 'graticules');
      }
    }
  });

  // ── 5. Re-balance opacity ─────────────────────────────────────────────────
  selectedModels.forEach((model) => {
    const layerId = `${WAVE_RASTER_LAYER_PREFIX}${model}`;
    if (map.getLayer(layerId)) map.setPaintProperty(layerId, 'raster-opacity', opacity);
  });

  // ── 6. Glass overlay visibility ───────────────────────────────────────────
  ['wave-glass-fill', 'wave-glass-depth'].forEach((id) => {
    if (map.getLayer(id)) {
      map.setLayoutProperty(id, 'visibility',
        showRaster && selectedModels.length > 0 ? 'visible' : 'none');
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

  const prevThemeRef = useRef(isDarkMode ? 'dark' : 'light');

  const applyWaveLayers = useCallback((map, config, dark) => {
    if (!map) return;

    const nextTheme    = dark ? 'dark' : 'light';
    const themeChanged = prevThemeRef.current !== nextTheme;

    const elements  = config.elements || OFF_ELEMENTS;
    const enabled   = Boolean(config.enabled);

    // Raster: only visible when element === 'raster' AND layer is enabled
    const showRaster = enabled && Boolean(elements.raster);
    syncWaveRasterLayers(map, config.models || [], showRaster, dark, themeChanged);

    // Symbol layers: only visible for their specific element, mutually exclusive
    syncWaveSymbolLayers(map, elements, enabled);

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

  // ── Re-sync when isDarkMode flips ─────────────────────────────────────────
  useEffect(() => {
    setWaveConfig((prev) => {
      applyWaveLayers(mapRef.current, prev, isDarkMode);
      return prev;
    });
  }, [isDarkMode, mapRef, applyWaveLayers]);

  // ── Toggle enabled ────────────────────────────────────────────────────────
  const toggleWaveLayer = useCallback(() => {
    setWaveConfig((prev) => {
      const next = { ...prev, enabled: !prev.enabled };
      localStorage.setItem(STORAGE_KEYS.WAVE_ENABLED, String(next.enabled));

      if (!next.enabled) {
        // Turned off — hide everything
        applyWaveLayers(mapRef.current, { ...next, elements: OFF_ELEMENTS }, isDarkMode);
      } else {
        applyWaveLayers(mapRef.current, next, isDarkMode);
        addWaveLayer(mapRef.current, isDarkMode);
      }
      return next;
    });
  }, [mapRef, isDarkMode, applyWaveLayers]);

  // ── Select element (mutually exclusive) ───────────────────────────────────
  const setWaveElement = useCallback((elementId) => {
    setWaveConfig((prev) => {
      // Turn off all elements, then activate only the selected one
      const updatedElements = WAVE_ELEMENTS.reduce(
        (acc, opt) => ({ ...acc, [opt.id]: opt.id === elementId }),
        {}
      );
      const next = { ...prev, elements: updatedElements };

      // Persist
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