import { useState, useEffect, useCallback, useRef } from 'react';
import { getLatestMapInstance } from '@dashboards/forecaster/map/helpers/mapInstance';
import { addWaveLayer } from '@dashboards/forecaster/map/layers/waveLayer';
import {
  WAVE_ELEMENTS,
  WAVE_RASTER_LAYER_PREFIX,
  WAVE_RASTER_SOURCE_PREFIX,
  WAVE_RASTER_DATE,
  STORAGE_KEYS,
  OFF_ELEMENTS,
  DEFAULT_DIRECTION_STYLE,
  BASE_SIZE_STOPS,
  COLORED_ICON_COLOR,
  BLACK_ICON_COLOR
} from '../constants/layerConstants';
import { parseStoredModels, readBoolStorage } from '../utils/layerPanelUtils';

const MRI3_TIMESTEP    = '012';
const WAVE_BUCKET_BASE = 'https://storage.googleapis.com/wavelab-tiles';

// ── Helpers ───────────────────────────────────────────────────────────────────

const normalizeModelName = (model = '') => model.trim().toUpperCase();

const getSelectedModels = (models = []) =>
  [...new Set(models.map(normalizeModelName).filter(Boolean))];

const buildWaveTileUrl = ({ model, theme, date }) => {
  const m = normalizeModelName(model);
  if (m === 'MRI3') return `${WAVE_BUCKET_BASE}/${m}/${theme}/${date}/${MRI3_TIMESTEP}/{z}/{x}/{y}.png`;
  if (m === 'WW3')  return `${WAVE_BUCKET_BASE}/${m}/${theme}/2026011200/{z}/{x}/{y}.png`;
  return `${WAVE_BUCKET_BASE}/${m}/${theme}/${date}/{z}/{x}/{y}.png`;
};

/** Build the Mapbox icon-size expression from base stops × user size multiplier */
const buildIconSize = (sizeMult = 1.0) => [
  'interpolate', ['linear'], ['get', 'waveHeight'],
  ...BASE_SIZE_STOPS.flatMap(([waveH, baseSize]) => [waveH, baseSize * sizeMult]),
];

// ── Raster layer sync ─────────────────────────────────────────────────────────

const syncWaveRasterLayers = (
  map,
  models       = [],
  showRaster   = false,
  isDarkMode   = false,
  themeChanged = false,
) => {
  if (!map) return;

  const theme          = isDarkMode ? 'dark' : 'light';
  const selectedModels = getSelectedModels(models);
  const opacity        = selectedModels.length > 0
    ? Math.max(0.25, 1 / selectedModels.length)
    : 0;

  // Remove legacy single-source layers
  if (map.getLayer('wave-raster')) map.removeLayer('wave-raster');
  ['wave-dark', 'wave-light'].forEach((id) => {
    if (map.getSource(id)) map.removeSource(id);
  });

  const existingSourceIds = new Set(
    Object.keys(map.getStyle()?.sources || {}).filter((id) =>
      id.startsWith(WAVE_RASTER_SOURCE_PREFIX)
    )
  );
  const targetSourceIds = new Set(
    selectedModels.map((m) => `${WAVE_RASTER_SOURCE_PREFIX}${m}`)
  );

  // Remove stale layers
  existingSourceIds.forEach((sourceId) => {
    if (targetSourceIds.has(sourceId)) return;
    const layerId = sourceId.replace(WAVE_RASTER_SOURCE_PREFIX, WAVE_RASTER_LAYER_PREFIX);
    if (map.getLayer(layerId))   map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  });

  // Add / update
  selectedModels.forEach((model) => {
    const sourceId  = `${WAVE_RASTER_SOURCE_PREFIX}${model}`;
    const layerId   = `${WAVE_RASTER_LAYER_PREFIX}${model}`;
    const tileUrl   = buildWaveTileUrl({ model, theme, date: WAVE_RASTER_DATE });
    let   srcExists = Boolean(map.getSource(sourceId));

    if (srcExists && themeChanged) {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      map.removeSource(sourceId);
      srcExists = false;
    }

    if (!srcExists) {
      map.addSource(sourceId, {
        type: 'raster', tiles: [tileUrl], tileSize: 256,
        bounds: [100, -5, 180, 50], scheme: 'xyz',
      });
    }

    if (!map.getLayer(layerId)) {
      map.addLayer({
        id: layerId, type: 'raster', source: sourceId,
        paint: { 'raster-opacity': opacity, 'raster-fade-duration': 0 },
        layout: { visibility: showRaster ? 'visible' : 'none' },
      }, 'graticules');
    } else {
      map.setPaintProperty(layerId,  'raster-opacity', opacity);
      map.setLayoutProperty(layerId, 'visibility', showRaster ? 'visible' : 'none');
    }
  });

  // Glass overlays
  ['wave-glass-fill', 'wave-glass-depth'].forEach((id) => {
    if (map.getLayer(id)) {
      map.setLayoutProperty(id, 'visibility',
        showRaster && selectedModels.length > 0 ? 'visible' : 'none');
    }
  });
};

// ── Direction layer sync ──────────────────────────────────────────────────────

const syncWaveSymbolLayers = (
  map,
  elements       = {},
  enabled        = false,
  models         = [],
  directionStyle = DEFAULT_DIRECTION_STYLE,
) => {
  if (!map) return;

  const selectedModels = getSelectedModels(models);
  const showDirection  = enabled && selectedModels.length > 0 && Boolean(elements.waveDirection);

  const iconColor = directionStyle.theme === 'black' ? BLACK_ICON_COLOR : COLORED_ICON_COLOR;
  const iconSize  = buildIconSize(directionStyle.size ?? 1.0);

  selectedModels.forEach((model) => {
    const layerId = `wave-direction-${model}`;
    if (!map.getLayer(layerId)) return;

    map.setLayoutProperty(layerId, 'visibility', showDirection ? 'visible' : 'none');

    // Apply style even when hidden so it's ready when turned on
    map.setPaintProperty(layerId,  'icon-color', iconColor);
    map.setLayoutProperty(layerId, 'icon-size',  iconSize);
  });

  // Hide direction layers for removed models
  const style = map.getStyle();
  if (style?.layers) {
    style.layers.forEach(({ id }) => {
      if (!id.startsWith('wave-direction-')) return;
      const suffix = id.replace('wave-direction-', '');
      if (!selectedModels.includes(suffix)) {
        map.setLayoutProperty(id, 'visibility', 'none');
      }
    });
  }

  // Wind barbs
  if (map.getLayer('wave-arrows')) {
    map.setLayoutProperty('wave-arrows', 'visibility', showDirection ? 'visible' : 'none');
  }
};

// ── Master apply ──────────────────────────────────────────────────────────────

const syncAllWaveLayers = (map, config, dark, prevThemeRef) => {
  if (!map) return;

  const nextTheme    = dark ? 'dark' : 'light';
  const themeChanged = prevThemeRef.current !== nextTheme;

  const elements       = config.elements       || OFF_ELEMENTS;
  const enabled        = Boolean(config.enabled);
  const models         = config.models         || [];
  const directionStyle = config.directionStyle || DEFAULT_DIRECTION_STYLE;

  const showRaster    = enabled && models.length > 0 && Boolean(elements.raster);
  const showDirection = enabled && models.length > 0 && Boolean(elements.waveDirection);

  syncWaveRasterLayers(map, models, showRaster, dark, themeChanged);
  syncWaveSymbolLayers(map, elements, showDirection, models, directionStyle);

  prevThemeRef.current = nextTheme;
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export const useWaveConfig = ({ isDarkMode }) => {
  const map = getLatestMapInstance();
  const [waveConfig, setWaveConfig] = useState({
    enabled:        false,
    models:         ['WW3'],
    elements:       OFF_ELEMENTS,
    directionStyle: DEFAULT_DIRECTION_STYLE,
  });

  const prevThemeRef = useRef(isDarkMode ? 'dark' : 'light');

  const applyWaveLayers = useCallback((map, config, dark) => {
    syncAllWaveLayers(map, config, dark, prevThemeRef);
  }, []);

  // ── Hydrate from localStorage ───────────────────────────────────────────────
  useEffect(() => {
    const saved = {
      enabled: readBoolStorage(STORAGE_KEYS.WAVE_ENABLED),
      models:  parseStoredModels(localStorage.getItem(STORAGE_KEYS.WAVE_MODEL), 'WW3'),
      elements: {
        particles:     readBoolStorage('WAVE_PARTICLES'),
        raster:        readBoolStorage('WAVE_RASTER'),
        waveDirection: readBoolStorage('WAVE_DIRECTION'),
        wavePeriod:    readBoolStorage('WAVE_PERIOD'),
      },
      directionStyle: (() => {
        try {
          return JSON.parse(localStorage.getItem('WAVE_DIRECTION_STYLE') || 'null')
            || DEFAULT_DIRECTION_STYLE;
        } catch {
          return DEFAULT_DIRECTION_STYLE;
        }
      })(),
    };

    setWaveConfig(saved);

    if (map && saved.enabled) {
      addWaveLayer(map, isDarkMode, saved.models);
      applyWaveLayers(map, saved, isDarkMode);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Re-sync on dark mode change ─────────────────────────────────────────────
  useEffect(() => {
    setWaveConfig((prev) => {
      applyWaveLayers(map, prev, isDarkMode);
      return prev;
    });
  }, [isDarkMode, map, applyWaveLayers]);

  // ── Toggle wave on / off ────────────────────────────────────────────────────
  const toggleWaveLayer = useCallback(() => {
    setWaveConfig((prev) => {
      const next = { ...prev, enabled: !prev.enabled };
      localStorage.setItem(STORAGE_KEYS.WAVE_ENABLED, String(next.enabled));

      if (!next.enabled) {
        applyWaveLayers(map, { ...next, elements: OFF_ELEMENTS }, isDarkMode);
      } else {
        addWaveLayer(map, isDarkMode, next.models);
        applyWaveLayers(map, next, isDarkMode);
      }
      return next;
    });
  }, [map, isDarkMode, applyWaveLayers]);

  // ── Select element (single-select, exclusive) ───────────────────────────────
  const setWaveElement = useCallback((elementId) => {
    setWaveConfig((prev) => {
      const updatedElements = WAVE_ELEMENTS.reduce(
        (acc, opt) => ({ ...acc, [opt.id]: opt.id === elementId }),
        {},
      );
      const next = { ...prev, elements: updatedElements };
      WAVE_ELEMENTS.forEach((opt) =>
        localStorage.setItem(opt.storageKey, String(next.elements[opt.id]))
      );
      applyWaveLayers(map, next, isDarkMode);
      return next;
    });
  }, [map, isDarkMode, applyWaveLayers]);

  // ── Toggle model (multi-select) ─────────────────────────────────────────────
  const toggleWaveModel = useCallback((model) => {
    setWaveConfig((prev) => {
      const normalized = normalizeModelName(model);
      const isAdding   = !prev.models.includes(normalized);
      const models     = isAdding
        ? [...prev.models, normalized]
        : prev.models.filter((id) => id !== normalized);

      const next = { ...prev, models };
      localStorage.setItem(STORAGE_KEYS.WAVE_MODEL, models.join(','));

      if (isAdding && next.enabled) {
        addWaveLayer(map, isDarkMode, [normalized]);
      }
      applyWaveLayers(map, next, isDarkMode);
      return next;
    });
  }, [map, isDarkMode, applyWaveLayers]);

  // ── Set direction style (theme + size) ─────────────────────────────────────
  const setDirectionStyle = useCallback((patch) => {
    setWaveConfig((prev) => {
      const next = {
        ...prev,
        directionStyle: { ...prev.directionStyle, ...patch },
      };
      localStorage.setItem('WAVE_DIRECTION_STYLE', JSON.stringify(next.directionStyle));
      applyWaveLayers(map, next, isDarkMode);
      return next;
    });
  }, [map, isDarkMode, applyWaveLayers]);

  return {
    waveConfig,
    toggleWaveLayer,
    setWaveElement,
    toggleWaveModel,
    setDirectionStyle,
  };
};