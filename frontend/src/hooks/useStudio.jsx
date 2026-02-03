// hooks/useStudio.js
import { useState, useEffect, useCallback, useRef } from "react";
import { setupMap } from "@/utils/mapSetup";
import { fetchFeatures } from "@/api/featureServices";
import { fetchLatestUserProject } from "@/api/projectAPI";

// ─── Constants ───────────────────────────────────────
const INACTIVITY_TIMEOUT = 640000; // 10.67 minutes

// ─── Custom Hooks ────────────────────────────────────

/**
 * Manages project ID with localStorage persistence
 */
export const useProjectId = () => {
  const [projectId, setProjectId] = useState(() => localStorage.getItem('projectId'));

  const updateProjectId = useCallback((id) => {
    localStorage.setItem('projectId', id);
    setProjectId(id);
  }, []);

  return [projectId, updateProjectId];
};

/**
 * Reloads the page after a period of user inactivity
 */
export const useInactivityReload = (timeout = INACTIVITY_TIMEOUT) => {
  useEffect(() => {
    let inactivityTimer;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => window.location.reload(), timeout);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [timeout]);
};

/**
 * Handles project loading for project creation prompt
 * Returns modal state to be controlled by parent component
 */
export const useProjectLoader = (projectId, updateProjectId) => {
  const [latestProject, setLatestProject] = useState(null);
  const [isLoadingProject, setIsLoadingProject] = useState(true);
  const [showNoProjectsModal, setShowNoProjectsModal] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const projectData = await fetchLatestUserProject();
        setLatestProject(projectData);
        updateProjectId(projectData._id);
      } catch (error) {
        console.error('Failed to fetch the latest project:', error);
        // Show the custom modal instead of SweetAlert
        setShowNoProjectsModal(true);
      } finally {
        setIsLoadingProject(false);
      }
    };

    if (!projectId) {
      fetchProject();
    } else {
      setIsLoadingProject(false);
    }
  }, [projectId, updateProjectId]);

  return { 
    latestProject, 
    isLoadingProject,
    showNoProjectsModal,
    setShowNoProjectsModal
  };
};

/**
 * Manages map initialization and feature loading
 */
export const useMapSetup = (projectId, logger, isDarkMode) => {
  const [savedFeatures, setSavedFeatures] = useState([]);
  const [layers, setLayers] = useState([]);
  const mapRef = useRef(null);
  const cleanupRef = useRef(null);

  const setupFeaturesAndLayers = useCallback(async (map) => {
    if (!projectId) return [];

    try {
      const features = await fetchFeatures(projectId);
      const filteredFeatures = features.filter(
        f => f?.properties?.project === projectId
      );

      setSavedFeatures(filteredFeatures);

      const initialLayers = filteredFeatures.map(f => ({
        id: f.sourceId,
        name: f.name || "Untitled Feature",
        visible: true,
        locked: false,
        type: f.properties.type || 'Wave Height',
      }));

      setLayers(initialLayers);

      return filteredFeatures;
    } catch (error) {
      console.error('[MAP LOAD ERROR]', error);
      return [];
    }
  }, [projectId]);

  return {
    savedFeatures,
    layers,
    setLayers,
    mapRef,
    cleanupRef,
    setupFeaturesAndLayers,
  };
};

/**
 * Manages drawing state and canvas toggles
 */
export const useDrawingState = () => {
  const [drawInstance, setDrawInstance] = useState(null);
  const [isCanvasActive, setIsCanvasActive] = useState(false);
  const [isFlagCanvasActive, setIsFlagCanvasActive] = useState(false);
  const [lineCount, setLineCount] = useState(0);
  const [drawCounter, setDrawCounter] = useState(0);
  const [closedMode, setClosedMode] = useState(false);

  const toggleCanvas = useCallback(() => setIsCanvasActive(prev => !prev), []);
  const toggleFlagCanvas = useCallback(() => setIsFlagCanvasActive(prev => !prev), []);

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
    toggleCanvas,
    toggleFlagCanvas,
  };
};

/**
 * Manages marker creation modal state
 */
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

  const closeModal = useCallback(() => setShowTitleModal(false), []);

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
    closeModal,
  };
};

/**
 * Manages map loading and setup with feature initialization
 */
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
  const handleMapLoad = useCallback(async (map) => {
    mapRef.current = map;
    
    const filteredFeatures = await setupFeaturesAndLayers(map);

    cleanupRef.current = setupMap({
      map,
      mapRef,
      setDrawInstance,
      setMapLoaded,
      setSelectedPoint,
      setShowTitleModal,
      setLineCount,
      initialFeatures: {
        type: "FeatureCollection",
        features: filteredFeatures,
      },
      logger,
      setLoading: setIsLoading,
      selectedToolRef,
      setCapturedImages,
      isDarkMode,
    });

    // Setup style.load listener once
    if (!map._hasStyleLoadListener) {
      map.on("style.load", async () => {
        const features = await setupFeaturesAndLayers(map);
        if (cleanupRef.current) {
          cleanupRef.current = setupMap({
            map,
            mapRef,
            setDrawInstance,
            setMapLoaded,
            setSelectedPoint,
            setShowTitleModal,
            setLineCount,
            initialFeatures: {
              type: "FeatureCollection",
              features,
            },
            logger,
            setLoading: setIsLoading,
            selectedToolRef,
            setCapturedImages,
            isDarkMode,
          });
        }
      });
      map._hasStyleLoadListener = true;
    }
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

  return handleMapLoad;
};