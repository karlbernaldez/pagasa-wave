import { useState, useEffect, useCallback, useRef } from 'react';
import { getLatestMapInstance } from '@dashboards/forecaster/map/helpers/mapInstance';
import { addWaveLayer } from '@dashboards/forecaster/map/layers/waveLayer';
import { WAVE_ELEMENTS, OFF_ELEMENTS, DEFAULT_DIRECTION_STYLE } from '../constants/layerConstants';
import { normalizeModelName } from './waveConfig/waveHelpers';
import { syncAllWaveLayers } from './waveConfig/waveLayerSync';
import { useWaveStorage } from './waveConfig/useWaveStorage';

const INITIAL_STATE = {
  enabled:        false,
  models:         ['WW3'],
  elements:       OFF_ELEMENTS,
  directionStyle: DEFAULT_DIRECTION_STYLE,
};

export const useWaveConfig = ({ mapRef, isDarkMode }) => {
  const map          = getLatestMapInstance(mapRef);
  const prevThemeRef = useRef(isDarkMode ? 'dark' : 'light');

  const [waveConfig, setWaveConfig] = useState(INITIAL_STATE);
  const { readWaveStorage, saveEnabled, saveModels, saveElements, saveDirectionStyle } =
    useWaveStorage();

  // Stable apply helper — all layer sync flows through here
  const applyLayers = useCallback(
    (config) => {
      const currentMap = getLatestMapInstance(mapRef);
      if (!currentMap) return;
      syncAllWaveLayers(currentMap, config, isDarkMode, prevThemeRef);
    },
    [mapRef, isDarkMode],
  );

  // ── Hydrate ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const saved = readWaveStorage();
    setWaveConfig(saved);

    const currentMap = getLatestMapInstance(mapRef);
    if (currentMap && saved.enabled) {
      addWaveLayer(currentMap, isDarkMode, saved.models).then(() => applyLayers(saved));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Dark-mode change ────────────────────────────────────────────────────────
  useEffect(() => {
    setWaveConfig((prev) => {
      applyLayers(prev);
      return prev;
    });
  }, [isDarkMode, applyLayers]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const toggleWaveLayer = useCallback(() => {
    setWaveConfig((prev) => {
      const next = { ...prev, enabled: !prev.enabled };
      saveEnabled(next.enabled);
      const currentMap = getLatestMapInstance(mapRef);

      if (!currentMap) return next;

      if (!next.enabled) {
        applyLayers({ ...next, elements: OFF_ELEMENTS });
      } else {
        addWaveLayer(currentMap, isDarkMode, next.models).then(() => applyLayers(next));
      }
      return next;
    });
  }, [mapRef, isDarkMode, applyLayers, saveEnabled]);

  const setWaveElement = useCallback((elementId) => {
    setWaveConfig((prev) => {
      const elements = WAVE_ELEMENTS.reduce(
        (acc, { id }) => ({ ...acc, [id]: id === elementId }),
        {},
      );
      const next = { ...prev, elements };
      saveElements(next.elements);
      applyLayers(next);
      return next;
    });
  }, [applyLayers, saveElements]);

  const toggleWaveModel = useCallback((model) => {
    setWaveConfig((prev) => {
      const normalized = normalizeModelName(model);
      const isAdding   = !prev.models.includes(normalized);
      const models     = isAdding
        ? [...prev.models, normalized]
        : prev.models.filter((id) => id !== normalized);

      const next = { ...prev, models };
      saveModels(models);
      const currentMap = getLatestMapInstance(mapRef);

      if (!currentMap) return next;

      if (isAdding && next.enabled) {
        addWaveLayer(currentMap, isDarkMode, [normalized]).then(() => applyLayers(next));
      } else {
        applyLayers(next);
      }
      return next;
    });
  }, [mapRef, isDarkMode, applyLayers, saveModels]);

  const setDirectionStyle = useCallback((patch) => {
    setWaveConfig((prev) => {
      const next = {
        ...prev,
        directionStyle: { ...prev.directionStyle, ...patch },
      };
      saveDirectionStyle(next.directionStyle);
      applyLayers(next);
      return next;
    });
  }, [applyLayers, saveDirectionStyle]);

  return {
    waveConfig,
    toggleWaveLayer,
    setWaveElement,
    toggleWaveModel,
    setDirectionStyle,
  };
};
