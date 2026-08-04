import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getLatestMapInstance,
  MAP_INSTANCE_READY_EVENT,
} from '@dashboards/forecaster/map/helpers/mapInstance';
import { addWaveLayer } from '@dashboards/forecaster/map/layers/waveLayer';
import { WAVE_ELEMENTS, OFF_ELEMENTS, DEFAULT_DIRECTION_STYLE } from '../constants/layerConstants';
import { normalizeModelName } from './waveConfig/waveHelpers';
import { syncAllWaveLayers } from './waveConfig/waveLayerSync';
import { useWaveStorage } from './waveConfig/useWaveStorage';
import { useProjectData } from '../../Menu/hooks/useProjectData';

const INITIAL_STATE = {
  enabled: false,
  models: ['WW3'],
  elements: OFF_ELEMENTS,
  directionStyle: DEFAULT_DIRECTION_STYLE,
};

export const useWaveConfig = ({ mapRef, isDarkMode }) => {
  const prevThemeRef = useRef(isDarkMode ? 'dark' : 'light');
  const { chartType, forecastDate } = useProjectData();
  const forecastPackage = { chartType, forecastDate };

  const [waveConfig, setWaveConfig] = useState(INITIAL_STATE);
  const { readWaveStorage, saveEnabled, saveModels, saveElements, saveDirectionStyle } =
    useWaveStorage();

  // Stable apply helper — all layer sync flows through here
  const applyLayers = useCallback(
    (config) => {
      const currentMap = getLatestMapInstance(mapRef);
      if (!currentMap) return;
      syncAllWaveLayers(currentMap, config, isDarkMode, prevThemeRef, forecastPackage);
    },
    [mapRef, isDarkMode, chartType, forecastDate],
  );

  // ── Hydrate ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const saved = readWaveStorage();
    setWaveConfig(saved);

    const restoreSavedLayers = () => {
      const currentMap = getLatestMapInstance(mapRef);
      if (!currentMap || !saved.enabled) return;

      addWaveLayer(currentMap, isDarkMode, saved.models, forecastPackage).then(() => {
        if (!cancelled) applyLayers(saved);
      });
    };

    restoreSavedLayers();
    window.addEventListener(MAP_INSTANCE_READY_EVENT, restoreSavedLayers);

    return () => {
      cancelled = true;
      window.removeEventListener(MAP_INSTANCE_READY_EVENT, restoreSavedLayers);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Dark-mode / forecast package change ─────────────────────────────────────
  useEffect(() => {
    setWaveConfig((prev) => {
      const currentMap = getLatestMapInstance(mapRef);
      if (currentMap && prev.enabled) {
        addWaveLayer(currentMap, isDarkMode, prev.models, forecastPackage).then(() => applyLayers(prev));
      } else {
        applyLayers(prev);
      }
      return prev;
    });
  }, [isDarkMode, chartType, forecastDate, applyLayers]);

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
        addWaveLayer(currentMap, isDarkMode, next.models, forecastPackage).then(() => applyLayers(next));
      }
      return next;
    });
  }, [mapRef, isDarkMode, applyLayers, saveEnabled, chartType, forecastDate]);

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
      const isAdding = !prev.models.includes(normalized);
      const models = isAdding
        ? [...prev.models, normalized]
        : prev.models.filter((id) => id !== normalized);

      const next = { ...prev, models };
      saveModels(models);
      const currentMap = getLatestMapInstance(mapRef);

      if (!currentMap) return next;

      if (isAdding && next.enabled) {
        addWaveLayer(currentMap, isDarkMode, [normalized], forecastPackage).then(() => applyLayers(next));
      } else {
        applyLayers(next);
      }
      return next;
    });
  }, [mapRef, isDarkMode, applyLayers, saveModels, chartType, forecastDate]);

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
