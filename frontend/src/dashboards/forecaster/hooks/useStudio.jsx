// hooks/useStudio.js
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { setupMap } from "@dashboards/forecaster/utils/mapSetup";
import { fetchFeatures } from "@/api/featureServices";
import { fetchLatestUserProject, fetchProjectById } from "@/api/projectAPI";

// ─── Constants ───────────────────────────────────────
const INACTIVITY_TIMEOUT = 640000; // 10.67 minutes

// ─── Custom Hooks ────────────────────────────────────

/**
 * Manages project ID — URL param takes priority over localStorage.
 * When a project is selected via the UI, also updates the URL.
 */
export const useProjectId = () => {
  const { projectId: paramId } = useParams();
  const navigate = useNavigate();

  // Param wins; fall back to whatever was last stored
  const [projectId, setProjectId] = useState(
    () => paramId ?? localStorage.getItem("projectId")
  );

  // If the URL param changes (e.g. user navigates directly to /studio/xyz),
  // sync state without touching localStorage yet
  useEffect(() => {
    if (paramId && paramId !== projectId) {
      setProjectId(paramId);
      localStorage.setItem("projectId", paramId);
    }
  }, [paramId]);

  const updateProjectId = useCallback((id) => {
    localStorage.setItem("projectId", id);
    setProjectId(id);
    // Keep the URL in sync whenever a project is selected programmatically
    navigate(`/studio/${id}`, { replace: true });
  }, [navigate]);

  return [projectId, updateProjectId];
};

/**
 * Shows a confirmation prompt after inactivity instead of force-reloading.
 * This avoids surprise data loss in the map/drawing workspace.
 */
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
    timerRef.current = setTimeout(() => {
      setIsInactivityPromptVisible(true);
    }, timeout);
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

    const resetTimer = () => {
      scheduleInactivityPrompt();
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));
    scheduleInactivityPrompt();

    return () => {
      clearInactivityTimer();
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [clearInactivityTimer, disabled, isInactivityPromptVisible, scheduleInactivityPrompt]);

  const stayActive = useCallback(() => {
    setIsInactivityPromptVisible(false);
  }, []);

  const refreshWorkspace = useCallback(() => {
    window.location.reload();
  }, []);

  return {
    isInactivityPromptVisible,
    stayActive,
    refreshWorkspace,
  };
};

/**
 * Handles project loading.
 * - If a projectId is already known (from URL or localStorage), fetch that specific project.
 * - If no projectId exists, fetch the user's latest project.
 * - If no projects exist at all, show the "no projects" modal.
 */
export const useProjectLoader = (projectId, updateProjectId) => {
  const [latestProject, setLatestProject] = useState(null);
  const [isLoadingProject, setIsLoadingProject] = useState(true);
  const [showNoProjectsModal, setShowNoProjectsModal] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        let projectData;

        if (projectId) {
          // console.log("Fetching project by ID:", projectId);
          projectData = await fetchProjectById(projectId);
        } else {
          // console.log("No project ID found. Fetching latest user project.");
          projectData = await fetchLatestUserProject();

          updateProjectId(projectData._id);
        }

        setLatestProject(projectData);
      } catch (error) {
        console.error("Failed to fetch project:", error);
        setShowNoProjectsModal(true);
        // console.log("Error message:", error.message);
        setMessage(error.message);
      } finally {
        setIsLoadingProject(false);
      }
    };

    fetchProject();
  }, [projectId, updateProjectId]);

  return {
    latestProject,
    isLoadingProject,
    showNoProjectsModal,
    setShowNoProjectsModal,
    message,
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
        (f) => f?.properties?.project === projectId
      );

      setSavedFeatures(filteredFeatures);

      const initialLayers = filteredFeatures.map((f) => ({
        id: f.sourceId,
        name: f.name || "Untitled Feature",
        visible: true,
        locked: false,
        type: f.properties.type || "Wave Height",
      }));

      setLayers(initialLayers);

      return filteredFeatures;
    } catch (error) {
      console.error("[MAP LOAD ERROR]", error);
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

  const toggleCanvas = useCallback(() => setIsCanvasActive((prev) => !prev), []);
  const toggleFlagCanvas = useCallback(() => setIsFlagCanvasActive((prev) => !prev), []);

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
  const [markerTitle, setMarkerTitle] = useState("");
  const [type, setType] = useState(null);
  const markerTitleRef = useRef("");

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