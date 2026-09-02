import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import {
  getLatestMapInstance,
  subscribeToMapInstance,
} from '@dashboards/forecaster/map/helpers/mapInstance';
import { addWaveLayer } from '@dashboards/forecaster/map/layers/waveLayer';
import { ensureEcwamFrameReady } from '@/api/ecwamFrames';
import { WAVE_ELEMENTS, OFF_ELEMENTS, DEFAULT_DIRECTION_STYLE } from '../constants/layerConstants';
import { normalizeModelName } from './waveConfig/waveHelpers';
import { getECWAMForecastHours, resolveECWAMForecastRun } from './waveConfig/ww3ForecastRuns';
import { syncAllWaveLayers } from './waveConfig/waveLayerSync';
import { useWaveStorage } from './waveConfig/useWaveStorage';
import { useProjectData } from '../../Menu/hooks/useProjectData';

const INITIAL_STATE = {
  enabled: false,
  models: ['WW3'],
  elements: OFF_ELEMENTS,
  directionStyle: DEFAULT_DIRECTION_STYLE,
};

const IDLE_ECWAM_FRAME = { state: 'idle', message: null };

const formatPackageDate = (forecastDate) => {
  const parsed = dayjs(forecastDate);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : null;
};

export const useWaveConfig = ({ mapRef, isDarkMode }) => {
  const prevThemeRef = useRef(isDarkMode ? 'dark' : 'light');
  const ecwamRequestRef = useRef(0);
  const { chartType, forecastDate } = useProjectData();
  const packageKey = `${forecastDate ?? ''}|${chartType ?? ''}`;
  const ecwamForecastHours = useMemo(() => getECWAMForecastHours(chartType), [chartType]);
  const defaultEcwamForecastHour = useMemo(
    () => resolveECWAMForecastRun({ chartType, forecastDate }).forecastHour,
    [chartType, forecastDate]
  );
  const [ecwamSelection, setEcwamSelection] = useState(() => ({
    packageKey: null,
    forecastHour: defaultEcwamForecastHour,
  }));
  const [ecwamFrameState, setEcwamFrameState] = useState(() => ({
    packageKey,
    ...IDLE_ECWAM_FRAME,
  }));
  const ecwamFrameReady = ecwamSelection.packageKey === packageKey;
  const ecwamForecastHour = ecwamFrameReady
    ? ecwamSelection.forecastHour
    : defaultEcwamForecastHour;
  const visibleEcwamFrameState =
    ecwamFrameState.packageKey === packageKey ? ecwamFrameState : IDLE_ECWAM_FRAME;
  const forecastPackage = useMemo(
    () => ({ chartType, forecastDate, ecwamForecastHour, ecwamFrameReady }),
    [chartType, forecastDate, ecwamForecastHour, ecwamFrameReady]
  );

  const { readWaveStorage, saveEnabled, saveModels, saveElements, saveDirectionStyle } =
    useWaveStorage();
  const [waveConfig, setWaveConfig] = useState(() => readWaveStorage() || INITIAL_STATE);
  const waveConfigRef = useRef(waveConfig);

  const commitWaveConfig = useCallback((nextConfig) => {
    waveConfigRef.current = nextConfig;
    setWaveConfig(nextConfig);
  }, []);

  const applyLayersToMap = useCallback(
    (map, config) => {
      if (!map) return;
      syncAllWaveLayers(map, config, isDarkMode, prevThemeRef, forecastPackage);
    },
    [forecastPackage, isDarkMode]
  );

  const applyLayers = useCallback(
    (config) => {
      applyLayersToMap(getLatestMapInstance(mapRef), config);
    },
    [applyLayersToMap, mapRef]
  );

  useEffect(() => {
    ecwamRequestRef.current += 1;
  }, [packageKey]);

  const setEcwamForecastHour = useCallback(
    async (nextValue) => {
      const nextHour = Number(nextValue);
      if (!ecwamForecastHours.includes(nextHour)) {
        const result = {
          state: 'invalid',
          message: 'This forecast hour is outside the ECWAM window for the current chart.',
        };
        setEcwamFrameState({ packageKey, ...result, requestedHour: nextHour });
        return result;
      }

      if (nextHour === ecwamForecastHour && ecwamFrameReady) {
        return { state: 'ready', forecastHour: nextHour };
      }

      const packageDate = formatPackageDate(forecastDate);
      if (!packageDate) {
        const result = { state: 'invalid', message: 'The forecast package date is not available.' };
        setEcwamFrameState({ packageKey, ...result });
        return result;
      }

      const requestId = ++ecwamRequestRef.current;
      setEcwamFrameState({
        packageKey,
        state: 'checking',
        message: null,
        requestedHour: nextHour,
      });

      try {
        const result = await ensureEcwamFrameReady(packageDate, nextHour);
        if (requestId !== ecwamRequestRef.current) return result;

        if (result.state === 'ready') {
          setEcwamSelection({ packageKey, forecastHour: nextHour });
          setEcwamFrameState({ packageKey, ...result, requestedHour: null });
          return result;
        }

        setEcwamFrameState({
          packageKey,
          ...result,
          requestedHour: nextHour,
          message: result.message || `ECWAM T+${nextHour} is not ready yet.`,
        });
        return result;
      } catch (error) {
        if (requestId !== ecwamRequestRef.current) return { state: 'cancelled' };
        const result = {
          state: 'failed',
          requestedHour: nextHour,
          message: error?.message || 'Unable to load the requested ECWAM frame.',
        };
        setEcwamFrameState({ packageKey, ...result });
        return result;
      }
    },
    [ecwamForecastHour, ecwamFrameReady, ecwamForecastHours, forecastDate, packageKey]
  );

  const ecwamActive = waveConfig.enabled && waveConfig.models.includes('ECWAM');

  useEffect(() => {
    if (!ecwamActive || ecwamFrameReady) return undefined;

    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) void setEcwamForecastHour(defaultEcwamForecastHour);
    });

    return () => {
      cancelled = true;
    };
  }, [defaultEcwamForecastHour, ecwamActive, ecwamFrameReady, setEcwamForecastHour]);

  const stepEcwamForecastHour = useCallback(
    (direction) => {
      const currentIndex = ecwamForecastHours.indexOf(ecwamForecastHour);
      if (currentIndex < 0) return Promise.resolve({ state: 'invalid' });
      const nextIndex = Math.min(
        ecwamForecastHours.length - 1,
        Math.max(0, currentIndex + Math.sign(direction))
      );
      if (nextIndex === currentIndex) {
        return Promise.resolve({ state: 'ready', forecastHour: ecwamForecastHour });
      }
      return setEcwamForecastHour(ecwamForecastHours[nextIndex]);
    },
    [ecwamForecastHour, ecwamForecastHours, setEcwamForecastHour]
  );

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

      Promise.resolve(addWaveLayer(map, isDarkMode, config.models))
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

    const unsubscribe = subscribeToMapInstance(attachToMap);
    attachToMap(getLatestMapInstance(mapRef));

    return () => {
      disposed = true;
      removeLoadListener();
      unsubscribe();
    };
  }, [applyLayersToMap, isDarkMode, mapRef]);

  const toggleWaveLayer = useCallback(() => {
    const previous = waveConfigRef.current;
    const next = { ...previous, enabled: !previous.enabled };
    commitWaveConfig(next);
    saveEnabled(next.enabled);

    const currentMap = getLatestMapInstance(mapRef);
    if (!currentMap) return;

    if (!next.enabled) {
      applyLayers({ ...next, elements: OFF_ELEMENTS });
      return;
    }

    addWaveLayer(currentMap, isDarkMode, next.models).then(() => applyLayers(next));
  }, [applyLayers, commitWaveConfig, isDarkMode, mapRef, saveEnabled]);

  const setWaveElement = useCallback(
    (elementId) => {
      const elements = WAVE_ELEMENTS.reduce(
        (acc, { id }) => ({ ...acc, [id]: id === elementId }),
        {}
      );
      const next = { ...waveConfigRef.current, elements };
      commitWaveConfig(next);
      saveElements(next.elements);
      applyLayers(next);
    },
    [applyLayers, commitWaveConfig, saveElements]
  );

  const toggleWaveModel = useCallback(
    (model) => {
      const previous = waveConfigRef.current;
      const normalized = normalizeModelName(model);
      const isAdding = !previous.models.includes(normalized);
      const models = isAdding
        ? [...previous.models, normalized]
        : previous.models.filter((id) => id !== normalized);
      const next = { ...previous, models };

      commitWaveConfig(next);
      saveModels(models);

      const currentMap = getLatestMapInstance(mapRef);
      if (!currentMap) return;

      if (isAdding && next.enabled) {
        addWaveLayer(currentMap, isDarkMode, [normalized]).then(() => applyLayers(next));
        return;
      }

      applyLayers(next);
    },
    [applyLayers, commitWaveConfig, isDarkMode, mapRef, saveModels]
  );

  const setDirectionStyle = useCallback(
    (patch) => {
      const previous = waveConfigRef.current;
      const next = {
        ...previous,
        directionStyle: { ...previous.directionStyle, ...patch },
      };
      commitWaveConfig(next);
      saveDirectionStyle(next.directionStyle);
      applyLayers(next);
    },
    [applyLayers, commitWaveConfig, saveDirectionStyle]
  );

  const waveConfigView = useMemo(
    () => ({
      ...waveConfig,
      ecwamFrame: {
        forecastHour: ecwamForecastHour,
        availableHours: ecwamForecastHours,
        minHour: ecwamForecastHours[0],
        maxHour: ecwamForecastHours[ecwamForecastHours.length - 1],
        ...visibleEcwamFrameState,
      },
      setEcwamForecastHour,
      stepEcwamForecastHour,
    }),
    [
      waveConfig,
      ecwamForecastHour,
      ecwamForecastHours,
      visibleEcwamFrameState,
      setEcwamForecastHour,
      stepEcwamForecastHour,
    ]
  );

  return {
    waveConfig: waveConfigView,
    toggleWaveLayer,
    setWaveElement,
    toggleWaveModel,
    setDirectionStyle,
  };
};
