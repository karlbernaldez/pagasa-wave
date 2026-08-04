import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getLatestMapInstance,
  subscribeToMapInstance,
} from '@dashboards/forecaster/map/helpers/mapInstance';
import { addWaveLayer } from '@dashboards/forecaster/map/layers/waveLayer';
import {
  WAVE_ELEMENTS,
  OFF_ELEMENTS,
  DEFAULT_DIRECTION_STYLE,
} from '../constants/layerConstants';
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
  const forecastPackage = useMemo(
    () => ({ chartType, forecastDate }),
    [chartType, forecastDate],
  );

  const {
    readWaveStorage,
    saveEnabled,
    saveModels,
    saveElements,
    saveDirectionStyle,
  } = useWaveStorage();
  const [waveConfig, setWaveConfig] = useState(
    () => readWaveStorage() || INITIAL_STATE,
  );
  const waveConfigRef = useRef(waveConfig);
  waveConfigRef.current = waveConfig;

  const applyLayersToMap = useCallback(
    (map, config) => {
      if (!map) return;
      syncAllWaveLayers(
        map,
        config,
        isDarkMode,
        prevThemeRef,
        forecastPackage,
      );
    },
    [forecastPackage, isDarkMode],
  );

  const applyLayers = useCallback(
    (config) => {
      applyLayersToMap(getLatestMapInstance(mapRef), config);
    },
    [applyLayersToMap, mapRef],
  );

  // Keep the saved wave state synchronized with whichever Studio map instance
  // is currently active. This also re-applies the layers when the theme or
  // forecast package changes, without using an effect to mutate React state.
  useEffect(() => {
    let activeMap = null;
    let removeLoadListener = () => {};
    let disposed = false;

    const synchronizeWaveLayer = (map) => {
      if (!map || disposed) return;

      const config = waveConfigRef.current;
      if (!config.enabled) {
        applyLayersToMap(map, config);
        return;
      }

      Promise.resolve(
        addWaveLayer(map, isDarkMode, config.models, forecastPackage),
      )
        .then(() => {
          if (!disposed && activeMap === map) {
            applyLayersToMap(map, waveConfigRef.current);
          }
        })
        .catch((error) => {
          if (!disposed && activeMap === map) {
            console.error('[wave-layer-hydration-error]', error);
          }
        });
    };

    const attachToMap = (map) => {
      if (disposed || map === activeMap) return;

      removeLoadListener();
      removeLoadListener = () => {};
      activeMap = map;

      if (!map) return;

      if (map.isStyleLoaded?.()) {
        synchronizeWaveLayer(map);
        return;
      }

      const handleLoad = () => synchronizeWaveLayer(map);
      map.once?.('load', handleLoad);
      removeLoadListener = () => map.off?.('load', handleLoad);
    };

    attachToMap(getLatestMapInstance(mapRef));
    const unsubscribe = subscribeToMapInstance(attachToMap);

    return () => {
      disposed = true;
      removeLoadListener();
      unsubscribe();
    };
  }, [applyLayersToMap, forecastPackage, isDarkMode, mapRef]);

  const toggleWaveLayer = useCallback(() => {
    setWaveConfig((prev) => {
      const next = { ...prev, enabled: !prev.enabled };
      saveEnabled(next.enabled);
      const currentMap = getLatestMapInstance(mapRef);

      if (!currentMap) return next;

      if (!next.enabled) {
        applyLayers({ ...next, elements: OFF_ELEMENTS });
      } else {
        addWaveLayer(
          currentMap,
          isDarkMode,
          next.models,
          forecastPackage,
        ).then(() => applyLayers(next));
      }
      return next;
    });
  }, [
    applyLayers,
    forecastPackage,
    isDarkMode,
    mapRef,
    saveEnabled,
  ]);

  const setWaveElement = useCallback(
    (elementId) => {
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
    },
    [applyLayers, saveElements],
  );

  const toggleWaveModel = useCallback(
    (model) => {
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
          addWaveLayer(
            currentMap,
            isDarkMode,
            [normalized],
            forecastPackage,
          ).then(() => applyLayers(next));
        } else {
          applyLayers(next);
        }
        return next;
      });
    },
    [
      applyLayers,
      forecastPackage,
      isDarkMode,
      mapRef,
      saveModels,
    ],
  );

  const setDirectionStyle = useCallback(
    (patch) => {
      setWaveConfig((prev) => {
        const next = {
          ...prev,
          directionStyle: { ...prev.directionStyle, ...patch },
        };
        saveDirectionStyle(next.directionStyle);
        applyLayers(next);
        return next;
      });
    },
    [applyLayers, saveDirectionStyle],
  );

  return {
    waveConfig,
    toggleWaveLayer,
    setWaveElement,
    toggleWaveModel,
    setDirectionStyle,
  };
};
