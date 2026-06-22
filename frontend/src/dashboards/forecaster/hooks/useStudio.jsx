// hooks/useStudio.js
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { setupMap } from "@dashboards/forecaster/utils/mapSetup";
import { fetchFeatures } from "@/api/featureServices";
import { fetchProjectById } from "@/api/projectAPI";
import socket from "@/socket/socketClient";

const INACTIVITY_TIMEOUT = 640000;
const FORECAST_CHART_UPDATED_EVENT = "forecast-chart:updated";
export const FORECAST_CHART_BROWSER_EVENT = "wavelab:forecast-chart-updated";

export const useProjectId = () => {
  const { projectId: paramId } = useParams();
  const navigate = useNavigate();
  const projectId = paramId || null;

  useEffect(() => {
    if (!projectId) return;
    localStorage.setItem("projectId", projectId);
  }, [projectId]);

  const updateProjectId = useCallback((id, { replace = true } = {}) => {
    if (!id) return;
    localStorage.setItem("projectId", id);
    navigate(`/studio/${id}`, { replace });
  }, [navigate]);

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
  const setupFeaturesAndLayers = useCallback(async () => {
    const requestSeq = requestSeqRef.current + 1;
    requestSeqRef.current = requestSeq;
    if (!projectId) { setSavedFeatures([]); setLayers([]); return []; }
    try {
      const features = await fetchFeatures(projectId);
      if (requestSeqRef.current !== requestSeq) return [];
      const filteredFeatures = (Array.isArray(features) ? features : []).filter((f) => String(f?.properties?.project || "") === String(projectId));
      setSavedFeatures(filteredFeatures);
      const initialLayers = filteredFeatures.map((f) => {
        const type = f.properties?.type || "Wave Height";
        const name = f.name || "Untitled Feature";
        const isMarker = ["typhoon", "low_pressure", "high_pressure", "less_1", "text_note"].includes(type);
        return { id: f.sourceId, name, visible: true, locked: false, type, markerType: f.properties?.markerType || (isMarker ? type : undefined), mapLayerId: f.properties?.mapLayerId || (isMarker ? `${type}_${name}` : undefined), owner: f.properties?.owner, canEdit: Boolean(f.properties?.canEdit) };
      });
      setLayers(initialLayers);
      return filteredFeatures;
    } catch (error) {
      if (requestSeqRef.current !== requestSeq) return [];
      console.error("[MAP LOAD ERROR]", error); setSavedFeatures([]); setLayers([]); return [];
    }
  }, [projectId]);
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
  const applyFeaturesToMap = useCallback(async () => {
    const map = mapRef.current;
    if (!map || !projectId) return;
    const filteredFeatures = await setupFeaturesAndLayers();
    cleanupRef.current?.();
    cleanupRef.current = await setupMap({ map, mapRef, setDrawInstance, setMapLoaded, setSelectedPoint, setShowTitleModal, setLineCount, initialFeatures: { type: "FeatureCollection", features: filteredFeatures }, logger, setLoading: setIsLoading, selectedToolRef, setCapturedImages, isDarkMode });
  }, [cleanupRef, isDarkMode, logger, mapRef, projectId, selectedToolRef, setCapturedImages, setDrawInstance, setIsLoading, setLineCount, setMapLoaded, setSelectedPoint, setShowTitleModal, setupFeaturesAndLayers]);

  useEffect(() => {
    if (!projectId) return undefined;
    if (!socket.connected) socket.connect();
    socket.emit("forecast:join_project", projectId);
    const handleForecastChartUpdate = (payload = {}) => {
      if (String(payload.projectId || "") !== String(projectId)) return;
      applyFeaturesToMap();
      window.dispatchEvent(new CustomEvent(FORECAST_CHART_BROWSER_EVENT, { detail: payload }));
    };
    socket.on(FORECAST_CHART_UPDATED_EVENT, handleForecastChartUpdate);
    return () => { socket.emit("forecast:leave_project", projectId); socket.off(FORECAST_CHART_UPDATED_EVENT, handleForecastChartUpdate); };
  }, [applyFeaturesToMap, projectId]);

  const handleMapLoad = useCallback(async (map) => {
    mapRef.current = map;
    const filteredFeatures = await setupFeaturesAndLayers();
    cleanupRef.current?.();
    cleanupRef.current = await setupMap({ map, mapRef, setDrawInstance, setMapLoaded, setSelectedPoint, setShowTitleModal, setLineCount, initialFeatures: { type: "FeatureCollection", features: filteredFeatures }, logger, setLoading: setIsLoading, selectedToolRef, setCapturedImages, isDarkMode });
    if (!map._hasStyleLoadListener) {
      map.on("style.load", async () => {
        const features = await setupFeaturesAndLayers();
        cleanupRef.current?.();
        cleanupRef.current = await setupMap({ map, mapRef, setDrawInstance, setMapLoaded, setSelectedPoint, setShowTitleModal, setLineCount, initialFeatures: { type: "FeatureCollection", features }, logger, setLoading: setIsLoading, selectedToolRef, setCapturedImages, isDarkMode });
      });
      map._hasStyleLoadListener = true;
    }
  }, [setupFeaturesAndLayers, logger, isDarkMode, mapRef, cleanupRef, setDrawInstance, setMapLoaded, setSelectedPoint, setShowTitleModal, setLineCount, selectedToolRef, setCapturedImages, setIsLoading]);
  return handleMapLoad;
};
