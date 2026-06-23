// hooks/useStudio.js
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { setupMap, syncAnnotationFeaturesToMap } from "@dashboards/forecaster/utils/mapSetup";
import { applyAnnotationStylesToMap } from "@dashboards/forecaster/utils/layers/annotationStylePersistence";
import { fetchFeatures } from "@/api/featureServices";
import { fetchProjectById } from "@/api/projectAPI";
import socket from "@/socket/socketClient";

const INACTIVITY_TIMEOUT = 640000;
const FORECAST_REFRESH_DEBOUNCE_MS = 350;
const FORECAST_CHART_UPDATED_EVENT = "forecast-chart:updated";
export const FORECAST_CHART_BROWSER_EVENT = "wavelab:forecast-chart-updated";

const FRONT_TYPE_LABELS = { cold: "Cold Front", warm: "Warm Front", stationary: "Stationary Front", occluded: "Occluded Front" };

function getIdString(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (value._id) return String(value._id);
  if (value.id) return String(value.id);
  if (typeof value.toString === "function" && value.toString !== Object.prototype.toString) return String(value.toString());
  return "";
}

function getFeatureProjectId(feature) {
  return getIdString(feature?.properties?.project || feature?.project);
}

const resolveFeatureLayerType = (feature) => {
  const props = feature?.properties || {};
  if (props.isFront) return FRONT_TYPE_LABELS[props.frontType] || feature?.name || "Surface Front";
  return props.type || props.markerType || "Wave Height";
};

export const useProjectId = () => {
  const { projectId: paramId } = useParams();
  const navigate = useNavigate();
  const projectId = paramId || null;
  useEffect(() => { if (projectId) localStorage.setItem("projectId", projectId); }, [projectId]);
  const updateProjectId = useCallback((id, { replace = true } = {}) => { if (!id) return; localStorage.setItem("projectId", id); navigate(`/studio/${id}`, { replace }); }, [navigate]);
  return [projectId, updateProjectId];
};

export const useInactivityReload = (timeout = INACTIVITY_TIMEOUT, { disabled = false } = {}) => {
  const [isInactivityPromptVisible, setIsInactivityPromptVisible] = useState(false);
  const timerRef = useRef(null);
  const clearInactivityTimer = useCallback(() => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } }, []);
  const scheduleInactivityPrompt = useCallback(() => { clearInactivityTimer(); timerRef.current = setTimeout(() => setIsInactivityPromptVisible(true), timeout); }, [clearInactivityTimer, timeout]);
  useEffect(() => {
    if (disabled) { clearInactivityTimer(); setIsInactivityPromptVisible(false); return undefined; }
    if (isInactivityPromptVisible) { clearInactivityTimer(); return undefined; }
    const resetTimer = () => scheduleInactivityPrompt();
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));
    scheduleInactivityPrompt();
    return () => { clearInactivityTimer(); events.forEach((event) => window.removeEventListener(event, resetTimer)); };
  }, [clearInactivityTimer, disabled, isInactivityPromptVisible, scheduleInactivityPrompt]);
  return { isInactivityPromptVisible, stayActive: () => setIsInactivityPromptVisible(false), refreshWorkspace: () => window.location.reload() };
};

export const useProjectLoader = (projectId) => {
  const [latestProject, setLatestProject] = useState(null);
  const [isLoadingProject, setIsLoadingProject] = useState(Boolean(projectId));
  const [showNoProjectsModal, setShowNoProjectsModal] = useState(false);
  const [message, setMessage] = useState(null);
  useEffect(() => {
    let isMounted = true;
    const fetchProject = async () => {
      if (!projectId) { setLatestProject(null); setMessage("No project selected."); setShowNoProjectsModal(true); setIsLoadingProject(false); return; }
      setIsLoadingProject(true); setShowNoProjectsModal(false); setMessage(null);
      try {
        const projectData = await fetchProjectById(projectId);
        if (!isMounted) return;
        setLatestProject(projectData);
        localStorage.setItem("projectId", projectId);
        if (projectData?.name) localStorage.setItem("projectName", projectData.name);
        if (projectData?.chartType) localStorage.setItem("chartType", projectData.chartType);
        if (projectData?.forecastDate) localStorage.setItem("forecastDate", projectData.forecastDate);
      } catch (error) {
        if (!isMounted) return;
        console.error("Failed to fetch project:", error);
        setLatestProject(null); setShowNoProjectsModal(true); setMessage(error.message || "Failed to load project.");
      } finally { if (isMounted) setIsLoadingProject(false); }
    };
    fetchProject();
    return () => { isMounted = false; };
  }, [projectId]);
  return { latestProject, isLoadingProject, showNoProjectsModal, setShowNoProjectsModal, message };
};

export const useMapSetup = (projectId, logger, isDarkMode) => {
  const [savedFeatures, setSavedFeatures] = useState([]);
  const [layers, setLayers] = useState([]);
  const mapRef = useRef(null);
  const cleanupRef = useRef(null);
  const requestSeqRef = useRef(0);
  useEffect(() => { setSavedFeatures([]); setLayers([]); }, [projectId]);
  const setupFeaturesAndLayers = useCallback(async ({ syncMap = true } = {}) => {
    const requestSeq = requestSeqRef.current + 1;
    requestSeqRef.current = requestSeq;
    if (!projectId) { setSavedFeatures([]); setLayers([]); return []; }

    let filteredFeatures = [];
    try {
      const features = await fetchFeatures(projectId);
      if (requestSeqRef.current !== requestSeq) return [];
      filteredFeatures = (Array.isArray(features) ? features : []).filter((feature) => getFeatureProjectId(feature) === String(projectId));
      setSavedFeatures(filteredFeatures);
      const initialLayers = filteredFeatures.map((feature) => {
        const type = resolveFeatureLayerType(feature);
        const name = feature.name || type || "Untitled Feature";
        const isMarker = ["typhoon", "low_pressure", "high_pressure", "less_1", "text_note"].includes(type);
        return {
          id: feature.sourceId || feature.properties?.sourceId || feature.properties?.stableId,
          sourceID: feature.sourceId || feature.properties?.sourceId || feature.properties?.stableId,
          name,
          visible: true,
          locked: false,
          type,
          markerType: feature.properties?.markerType || (isMarker ? type : undefined),
          mapLayerId: feature.properties?.mapLayerId || (isMarker ? `${type}_${name}` : undefined),
          owner: feature.properties?.owner,
          canEdit: feature.properties?.canEdit !== false,
          frontSymbolSide: feature.properties?.frontSymbolSide || feature.properties?.style?.frontSymbolSide,
          style: feature.properties?.style || {},
          properties: feature.properties || {},
        };
      }).filter((layer) => Boolean(layer.id));
      setLayers(initialLayers);
    } catch (error) {
      if (requestSeqRef.current !== requestSeq) return [];
      console.error("[FEATURE LOAD ERROR]", error);
      return [];
    }

    if (syncMap && mapRef.current) {
      try {
        await syncAnnotationFeaturesToMap(mapRef.current, filteredFeatures, { mapRef, isDarkMode });
        applyAnnotationStylesToMap(mapRef.current, filteredFeatures);
      } catch (error) {
        console.error("[MAP SYNC ERROR]", error);
      }
    }

    return filteredFeatures;
  }, [isDarkMode, projectId]);
  return { savedFeatures, layers, setLayers, mapRef, cleanupRef, setupFeaturesAndLayers };
};

export const useDrawingState = () => {
  const [drawInstance, setDrawInstance] = useState(null);
  const [isCanvasActive, setIsCanvasActive] = useState(false);
  const [isFlagCanvasActive, setIsFlagCanvasActive] = useState(false);
  const [lineCount, setLineCount] = useState(0);
  const [drawCounter, setDrawCounter] = useState(0);
  const [closedMode, setClosedMode] = useState(false);
  return { drawInstance, setDrawInstance, isCanvasActive, isFlagCanvasActive, lineCount, setLineCount, drawCounter, setDrawCounter, closedMode, setClosedMode, toggleCanvas: useCallback(() => setIsCanvasActive((prev) => !prev), []), toggleFlagCanvas: useCallback(() => setIsFlagCanvasActive((prev) => !prev), []) };
};

export const useMarkerModal = () => {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [markerTitle, setMarkerTitle] = useState("");
  const [type, setType] = useState(null);
  const markerTitleRef = useRef("");
  const handleTitleChange = useCallback((value) => { markerTitleRef.current = value; setMarkerTitle(value); }, []);
  return { selectedPoint, setSelectedPoint, showTitleModal, setShowTitleModal, markerTitle, setMarkerTitle, type, setType, markerTitleRef, handleTitleChange, closeModal: useCallback(() => setShowTitleModal(false), []) };
};

export const useMapLoader = (projectId, logger, isDarkMode, setupFeaturesAndLayers, mapRef, cleanupRef, setDrawInstance, setMapLoaded, setSelectedPoint, setShowTitleModal, setLineCount, selectedToolRef, setCapturedImages, setIsLoading) => {
  const refreshTimerRef = useRef(null);
  const refreshInFlightRef = useRef(false);
  const queuedRefreshRef = useRef(false);
  const applyFeaturesToMap = useCallback(async () => {
    const map = mapRef.current;
    if (!map || !projectId) return;
    if (refreshInFlightRef.current) { queuedRefreshRef.current = true; return; }
    refreshInFlightRef.current = true;
    try { await setupFeaturesAndLayers({ syncMap: true }); }
    finally { refreshInFlightRef.current = false; if (queuedRefreshRef.current) { queuedRefreshRef.current = false; window.setTimeout(applyFeaturesToMap, FORECAST_REFRESH_DEBOUNCE_MS); } }
  }, [mapRef, projectId, setupFeaturesAndLayers]);
  const scheduleFeatureRefresh = useCallback(() => {
    if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = window.setTimeout(() => { refreshTimerRef.current = null; applyFeaturesToMap(); }, FORECAST_REFRESH_DEBOUNCE_MS);
  }, [applyFeaturesToMap]);
  useEffect(() => {
    if (!projectId) return undefined;
    if (!socket.connected) socket.connect();
    socket.emit("forecast:join_project", projectId);
    const handleForecastChartUpdate = (payload = {}) => { if (String(payload.projectId || "") !== String(projectId)) return; scheduleFeatureRefresh(); window.dispatchEvent(new CustomEvent(FORECAST_CHART_BROWSER_EVENT, { detail: { ...payload, source: "socket" } })); };
    socket.on(FORECAST_CHART_UPDATED_EVENT, handleForecastChartUpdate);
    return () => { if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current); socket.emit("forecast:leave_project", projectId); socket.off(FORECAST_CHART_UPDATED_EVENT, handleForecastChartUpdate); };
  }, [projectId, scheduleFeatureRefresh]);
  const handleMapLoad = useCallback(async (map) => {
    mapRef.current = map;
    const filteredFeatures = await setupFeaturesAndLayers({ syncMap: false });
    cleanupRef.current?.();
    cleanupRef.current = await setupMap({ map, mapRef, setDrawInstance, setMapLoaded, setSelectedPoint, setShowTitleModal, setLineCount, initialFeatures: { type: "FeatureCollection", features: filteredFeatures }, logger, setLoading: setIsLoading, selectedToolRef, setCapturedImages, isDarkMode });
    applyAnnotationStylesToMap(map, filteredFeatures);
    if (!map._hasStyleLoadListener) {
      map.on("style.load", async () => {
        const features = await setupFeaturesAndLayers({ syncMap: false });
        cleanupRef.current?.();
        cleanupRef.current = await setupMap({ map, mapRef, setDrawInstance, setMapLoaded, setSelectedPoint, setShowTitleModal, setLineCount, initialFeatures: { type: "FeatureCollection", features }, logger, setLoading: setIsLoading, selectedToolRef, setCapturedImages, isDarkMode });
        applyAnnotationStylesToMap(map, features);
      });
      map._hasStyleLoadListener = true;
    }
  }, [setupFeaturesAndLayers, logger, isDarkMode, mapRef, cleanupRef, setDrawInstance, setMapLoaded, setSelectedPoint, setShowTitleModal, setLineCount, selectedToolRef, setCapturedImages, setIsLoading]);
  return handleMapLoad;
};
