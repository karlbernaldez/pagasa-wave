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

export const useWaveConfig = ({ isDarkMode }) => {
  const map          = getLatestMapInstance();
  const prevThemeRef = useRef(isDarkMode ? 'dark' : 'light');

  const [waveConfig, setWaveConfig] = useState(INITIAL_STATE);
  const { readWaveStorage, saveEnabled, saveModels, saveElements, saveDirectionStyle } =
    useWaveStorage();

  // Stable apply helper — all layer sync flows through here
  const applyLayers = useCallback(
    (config) => syncAllWaveLayers(map, config, isDarkMode, prevThemeRef),
    [map, isDarkMode],
  );

  // ── Hydrate ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const saved = readWaveStorage();
    setWaveConfig(saved);

    if (map && saved.enabled) {
      addWaveLayer(map, isDarkMode, saved.models).then(() => applyLayers(saved));
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

      if (!next.enabled) {
        applyLayers({ ...next, elements: OFF_ELEMENTS });
      } else {
        addWaveLayer(map, isDarkMode, next.models).then(() => applyLayers(next));
      }
      return next;
    });
  }, [map, isDarkMode, applyLayers, saveEnabled]);

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

      if (isAdding && next.enabled) {
        addWaveLayer(map, isDarkMode, [normalized]).then(() => applyLayers(next));
      } else {
        applyLayers(next);
      }
      return next;
    });
  }, [map, isDarkMode, applyLayers, saveModels]);

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