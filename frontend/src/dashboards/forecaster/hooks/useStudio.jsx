// hooks/useStudio.js
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { setupMap, syncAnnotationFeaturesToMap } from '@dashboards/forecaster/utils/mapSetup';
import { applyAnnotationStylesToMap } from '@dashboards/forecaster/utils/layers/annotationStylePersistence';
import { fetchFeatures } from '@/api/featureServices';
import { fetchProjectById } from '@/api/projectAPI';
import socket from '@/socket/socketClient';

const INACTIVITY_TIMEOUT = 640000;
const FORECAST_REFRESH_DEBOUNCE_MS = 350;
const FORECAST_CHART_UPDATED_EVENT = 'forecast-chart:updated';
export const FORECAST_CHART_BROWSER_EVENT = 'wavelab:forecast-chart-updated';

const FRONT_TYPE_LABELS = {
  cold: 'Cold Front',
  warm: 'Warm Front',
  stationary: 'Stationary Front',
  occluded: 'Occluded Front',
};
const MARKER_DISPLAY_NAMES = {
  less_1: 'Low Wave (<1 m)',
  text_note: 'Text Note',
  low_pressure: 'Low Pressure Area',
  high_pressure: 'High Pressure Area',
  typhoon: 'Tropical Cyclone',
};

function getIdString(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (value._id) return String(value._id);
  if (value.id) return String(value.id);
  if (
    typeof value.toString === 'function' &&
    value.toString !== Object.prototype.toString
  ) {
    return String(value.toString());
  }
  return '';
}

function getFeatureProjectId(feature) {
  return getIdString(feature?.properties?.project || feature?.project);
}

function getShortLayerSuffix(feature) {
  const raw = getIdString(
    feature?.sourceId ||
      feature?.properties?.sourceId ||
      feature?.properties?.stableId ||
      feature?._id ||
      feature?.id
  );
  const suffix = raw.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
  return suffix || '0000';
}

function cleanLegacyMarkerName(name = '') {
  return String(name)
    .replace(/^(Less 1|Low Wave)[_\s-]*[0-9a-f-]{8,}$/i, '')
    .replace(/^(Text)[_\s-]*[0-9a-f-]{8,}$/i, '')
    .trim();
}

function getLayerDisplayName(feature, type) {
  const props = feature?.properties || {};
  const rawName = props.displayName || feature?.name || props.name || props.title || '';

  if (type === 'less_1') {
    const cleanName = cleanLegacyMarkerName(rawName);
    if (cleanName && !/^less\s*1$/i.test(cleanName) && !/^<1$/i.test(cleanName)) {
      return cleanName;
    }
    return `${MARKER_DISPLAY_NAMES.less_1} #${getShortLayerSuffix(feature)}`;
  }

  if (type === 'text_note') {
    const cleanName = cleanLegacyMarkerName(rawName);
    return cleanName || MARKER_DISPLAY_NAMES.text_note;
  }

  return rawName || MARKER_DISPLAY_NAMES[type] || type || 'Untitled Feature';
}

const resolveFeatureLayerType = (feature) => {
  const props = feature?.properties || {};
  if (props.isFront) {
    return FRONT_TYPE_LABELS[props.frontType] || feature?.name || 'Surface Front';
  }
  return props.type || props.markerType || 'Wave Height';
};

export const useProjectId = () => {
  const { projectId: paramId } = useParams();
  const navigate = useNavigate();
  const projectId = paramId || null;

  useEffect(() => {
    if (projectId) localStorage.setItem('projectId', projectId);
  }, [projectId]);

  const updateProjectId = useCallback(
    (id, { replace = true } = {}) => {
      if (!id) return;
      localStorage.setItem('projectId', id);
      navigate(`/studio/${id}`, { replace });
    },
    [navigate]
  );

  return [projectId, updateProjectId];
};

export const useInactivityReload = (
  timeout = INACTIVITY_TIMEOUT,
  { disabled = false } = {}
) => {
  const [isInactivityPromptVisible, setIsInactivityPromptVisible] = useState(false);
  const timerRef = useRef(null);

  const clearInactivityTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleInactivityPrompt = useCallback(() => {
    clearInactivityTimer();
    timerRef.current = setTimeout(() => setIsInactivityPromptVisible(true), timeout);
  }, [clearInactivityTimer, timeout]);

  useEffect(() => {
    if (disabled) {
      clearInactivityTimer();
      setIsInactivityPromptVisible(false);
      return undefined;
    }
    if (isInactivityPromptVisible) {
      clearInactivityTimer();
      return undefined;
    }

    const resetTimer = () => scheduleInactivityPrompt();
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((event) =>
      window.addEventListener(event, resetTimer, { passive: true })
    );
    scheduleInactivityPrompt();

    return () => {
      clearInactivityTimer();
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [clearInactivityTimer, disabled, isInactivityPromptVisible, scheduleInactivityPrompt]);

  return {
    isInactivityPromptVisible,
    stayActive: () => setIsInactivityPromptVisible(false),
    refreshWorkspace: () => window.location.reload(),
  };
};

export const useProjectLoader = (projectId) => {
  const [latestProject, setLatestProject] = useState(null);
  const [isLoadingProject, setIsLoadingProject] = useState(Boolean(projectId));
  const [showNoProjectsModal, setShowNoProjectsModal] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchProject = async () => {
      if (!projectId) {
        setLatestProject(null);
        setMessage('No project selected.');
        setShowNoProjectsModal(true);
        setIsLoadingProject(false);
        return;
      }

      setIsLoadingProject(true);
      setShowNoProjectsModal(false);
      setMessage(null);

      try {
        const projectData = await fetchProjectById(projectId);
        if (!isMounted) return;

        setLatestProject(projectData);
        localStorage.setItem('projectId', projectId);
        if (projectData?.name) localStorage.setItem('projectName', projectData.name);
        if (projectData?.chartType) localStorage.setItem('chartType', projectData.chartType);
        if (projectData?.forecastDate) {
          localStorage.setItem('forecastDate', projectData.forecastDate);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Failed to fetch project:', error);
        setLatestProject(null);
        setShowNoProjectsModal(true);
        setMessage(error.message || 'Failed to load project.');
      } finally {
        if (isMounted) setIsLoadingProject(false);
      }
    };

    fetchProject();
    return () => {
      isMounted = false;
    };
  }, [projectId]);

  return {
    latestProject,
    isLoadingProject,
    showNoProjectsModal,
    setShowNoProjectsModal,
    message,
  };
};

export const useMapSetup = (projectId, logger, isDarkMode) => {
  const [savedFeatures, setSavedFeatures] = useState([]);
  const [layers, setLayers] = useState([]);
  const mapRef = useRef(null);
  const cleanupRef = useRef(null);
  const requestSeqRef = useRef(0);

  useEffect(() => {
    requestSeqRef.current += 1;
    setSavedFeatures([]);
    setLayers([]);
  }, [projectId]);

  const setupFeaturesAndLayers = useCallback(
    async ({ syncMap = true } = {}) => {
      const requestSeq = requestSeqRef.current + 1;
      requestSeqRef.current = requestSeq;

      if (!projectId) {
        setSavedFeatures([]);
        setLayers([]);
        return [];
      }

      let filteredFeatures = [];
      try {
        const features = await fetchFeatures(projectId);

        // A newer request already started. This result is stale and must not be
        // interpreted as an empty project, otherwise the map sync will prune
        // annotations that a newer request has just restored.
        if (requestSeqRef.current !== requestSeq) return null;

        filteredFeatures = (Array.isArray(features) ? features : []).filter(
          (feature) => getFeatureProjectId(feature) === String(projectId)
        );
        setSavedFeatures(filteredFeatures);

        const initialLayers = filteredFeatures
          .map((feature) => {
            const type = resolveFeatureLayerType(feature);
            const name = getLayerDisplayName(feature, type);
            const isMarker = [
              'typhoon',
              'low_pressure',
              'high_pressure',
              'less_1',
              'text_note',
            ].includes(type);

            return {
              id:
                feature.sourceId ||
                feature.properties?.sourceId ||
                feature.properties?.stableId,
              sourceID:
                feature.sourceId ||
                feature.properties?.sourceId ||
                feature.properties?.stableId,
              name,
              visible: true,
              locked: false,
              type,
              markerType: feature.properties?.markerType || (isMarker ? type : undefined),
              mapLayerId:
                feature.properties?.mapLayerId || (isMarker ? `${type}_${name}` : undefined),
              owner: feature.properties?.owner,
              canEdit: feature.properties?.canEdit !== false,
              frontSymbolSide:
                feature.properties?.frontSymbolSide ||
                feature.properties?.style?.frontSymbolSide,
              style: feature.properties?.style || {},
              properties: { ...(feature.properties || {}), displayName: name },
            };
          })
          .filter((layer) => Boolean(layer.id));

        setLayers(initialLayers);
      } catch (error) {
        if (requestSeqRef.current !== requestSeq) return null;
        console.error('[FEATURE LOAD ERROR]', error);

        // Keep the last successfully rendered map state on transient fetch
        // failures rather than clearing it as though the project were empty.
        return null;
      }

      if (requestSeqRef.current !== requestSeq) return null;

      if (syncMap && mapRef.current) {
        try {
          await syncAnnotationFeaturesToMap(mapRef.current, filteredFeatures, {
            mapRef,
            isDarkMode,
          });

          if (requestSeqRef.current !== requestSeq) return null;
          applyAnnotationStylesToMap(mapRef.current, filteredFeatures);
        } catch (error) {
          console.error('[MAP SYNC ERROR]', error);
        }
      }

      return filteredFeatures;
    },
    [isDarkMode, projectId]
  );

  return { savedFeatures, layers, setLayers, mapRef, cleanupRef, setupFeaturesAndLayers };
};

export const useDrawingState = () => {
  const [drawInstance, setDrawInstance] = useState(null);
  const [isCanvasActive, setIsCanvasActive] = useState(false);
  const [isFlagCanvasActive, setIsFlagCanvasActive] = useState(false);
  const [lineCount, setLineCount] = useState(0);
  const [drawCounter, setDrawCounter] = useState(0);
  const [closedMode, setClosedMode] = useState(false);

  return {
    drawInstance,
    setDrawInstance,
    isCanvasActive,
    isFlagCanvasActive,
    lineCount,
    setLineCount,
    drawCounter,
    setDrawCounter,
    closedMode,
    setClosedMode,
    toggleCanvas: useCallback(() => setIsCanvasActive((prev) => !prev), []),
    toggleFlagCanvas: useCallback(() => setIsFlagCanvasActive((prev) => !prev), []),
  };
};

export const useMarkerModal = () => {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [markerTitle, setMarkerTitle] = useState('');
  const [type, setType] = useState(null);
  const markerTitleRef = useRef('');

  const handleTitleChange = useCallback((value) => {
    markerTitleRef.current = value;
    setMarkerTitle(value);
  }, []);

  return {
    selectedPoint,
    setSelectedPoint,
    showTitleModal,
    setShowTitleModal,
    markerTitle,
    setMarkerTitle,
    type,
    setType,
    markerTitleRef,
    handleTitleChange,
    closeModal: useCallback(() => setShowTitleModal(false), []),
  };
};

export const useMapLoader = (
  projectId,
  logger,
  isDarkMode,
  setupFeaturesAndLayers,
  mapRef,
  cleanupRef,
  setDrawInstance,
  setMapLoaded,
  setSelectedPoint,
  setShowTitleModal,
  setLineCount,
  selectedToolRef,
  setCapturedImages,
  setIsLoading
) => {
  const refreshTimerRef = useRef(null);
  const refreshInFlightRef = useRef(false);
  const queuedRefreshRef = useRef(false);
  const styleLoadListenerRef = useRef(null);

  const applyFeaturesToMap = useCallback(async () => {
    const map = mapRef.current;
    if (!map || !projectId) return;

    if (refreshInFlightRef.current) {
      queuedRefreshRef.current = true;
      return;
    }

    refreshInFlightRef.current = true;
    try {
      await setupFeaturesAndLayers({ syncMap: true });
    } finally {
      refreshInFlightRef.current = false;
      if (queuedRefreshRef.current) {
        queuedRefreshRef.current = false;
        window.setTimeout(applyFeaturesToMap, FORECAST_REFRESH_DEBOUNCE_MS);
      }
    }
  }, [mapRef, projectId, setupFeaturesAndLayers]);

  const scheduleFeatureRefresh = useCallback(() => {
    if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = window.setTimeout(() => {
      refreshTimerRef.current = null;
      applyFeaturesToMap();
    }, FORECAST_REFRESH_DEBOUNCE_MS);
  }, [applyFeaturesToMap]);

  useEffect(() => {
    if (!projectId) return undefined;
    if (!socket.connected) socket.connect();

    socket.emit('forecast:join_project', projectId);
    const handleForecastChartUpdate = (payload = {}) => {
      if (String(payload.projectId || '') !== String(projectId)) return;
      scheduleFeatureRefresh();
      window.dispatchEvent(
        new CustomEvent(FORECAST_CHART_BROWSER_EVENT, {
          detail: { ...payload, source: 'socket' },
        })
      );
    };

    socket.on(FORECAST_CHART_UPDATED_EVENT, handleForecastChartUpdate);
    return () => {
      if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
      socket.emit('forecast:leave_project', projectId);
      socket.off(FORECAST_CHART_UPDATED_EVENT, handleForecastChartUpdate);
    };
  }, [projectId, scheduleFeatureRefresh]);

  const handleStyleLoad = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;

    const features = await setupFeaturesAndLayers({ syncMap: false });
    if (!Array.isArray(features)) return;

    cleanupRef.current?.();
    cleanupRef.current = await setupMap({
      map,
      mapRef,
      setDrawInstance,
      setMapLoaded,
      setSelectedPoint,
      setShowTitleModal,
      setLineCount,
      initialFeatures: { type: 'FeatureCollection', features },
      logger,
      setLoading: setIsLoading,
      selectedToolRef,
      setCapturedImages,
      isDarkMode,
    });
    applyAnnotationStylesToMap(map, features);
  }, [
    setupFeaturesAndLayers,
    logger,
    isDarkMode,
    mapRef,
    cleanupRef,
    setDrawInstance,
    setMapLoaded,
    setSelectedPoint,
    setShowTitleModal,
    setLineCount,
    selectedToolRef,
    setCapturedImages,
    setIsLoading,
  ]);

  const bindStyleLoadListener = useCallback(
    (map) => {
      const previous = styleLoadListenerRef.current;
      if (previous) map.off('style.load', previous);
      map.on('style.load', handleStyleLoad);
      styleLoadListenerRef.current = handleStyleLoad;
    },
    [handleStyleLoad]
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;

    bindStyleLoadListener(map);
    return () => {
      if (styleLoadListenerRef.current === handleStyleLoad) {
        map.off('style.load', handleStyleLoad);
        styleLoadListenerRef.current = null;
      }
    };
  }, [bindStyleLoadListener, handleStyleLoad, mapRef, projectId]);

  const handleMapLoad = useCallback(
    async (map) => {
      mapRef.current = map;
      const filteredFeatures = await setupFeaturesAndLayers({ syncMap: false });

      if (!Array.isArray(filteredFeatures)) {
        bindStyleLoadListener(map);
        return;
      }

      cleanupRef.current?.();
      cleanupRef.current = await setupMap({
        map,
        mapRef,
        setDrawInstance,
        setMapLoaded,
        setSelectedPoint,
        setShowTitleModal,
        setLineCount,
        initialFeatures: { type: 'FeatureCollection', features: filteredFeatures },
        logger,
        setLoading: setIsLoading,
        selectedToolRef,
        setCapturedImages,
        isDarkMode,
      });
      applyAnnotationStylesToMap(map, filteredFeatures);
      bindStyleLoadListener(map);
    },
    [
      setupFeaturesAndLayers,
      logger,
      isDarkMode,
      mapRef,
      cleanupRef,
      setDrawInstance,
      setMapLoaded,
      setSelectedPoint,
      setShowTitleModal,
      setLineCount,
      selectedToolRef,
      setCapturedImages,
      setIsLoading,
      bindStyleLoadListener,
    ]
  );

  return handleMapLoad;
};
