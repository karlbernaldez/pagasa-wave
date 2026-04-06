import { useState, useEffect, useRef, useMemo, useCallback } from "react";

// Component imports
import MapComponent from "@dashboards/forecaster/map/MapComponent";
import LayerPanel from "@dashboards/forecaster/components/Studio/LayerPanel/LayerPanel";
import DrawToolBar from "@dashboards/forecaster/components/Studio/Toolbar/Toolbar";
import LegendBox from "@dashboards/forecaster/components/Studio/Legend";
import ProjectMenu from "@dashboards/forecaster/components/Studio/Menu/ProjectMenu";
import MarkerTitleModal from "@/components/ui/modals/MarkerTitleModal";
import MapLoading from "@/components/ui/modals/MapLoading";
import NoProjectAlert from "@/components/ui/modals/NoProjectAlert";
import CreateProjectModal from "@/components/ui/modals/CreateProjectModal";
import Canvas from "@dashboards/forecaster/draw/canvas";
import FlagCanvas from "@dashboards/forecaster/draw/front";
import MapStatusBar from "@dashboards/forecaster/map/MapStatusBar";

// Custom Hooks
import {
  useProjectId,
  useInactivityReload,
  useProjectLoader,
  useMapSetup,
  useDrawingState,
  useMarkerModal,
  useMapLoader,
} from "@dashboards/forecaster/hooks/useStudio";
import { useTheme } from "@/app/providers/ThemeProvider";

// Utils
import { savePointFeature } from "@dashboards/forecaster/utils/ToolBarUtils";
import { handleCreateProject } from "@dashboards/forecaster/utils/ProjectUtils";
import { saveMarker } from "@dashboards/forecaster/map/layers/markerLayer";

// ─── Constants ───────────────────────────────────────
const TOOLBAR_DELAY = 1000;

// ─── Main Component ──────────────────────────────────
const Studio = ({ logger }) => {
  const { isDarkMode, setIsDarkMode } = useTheme();

  const [projectId, updateProjectId] = useProjectId();

  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);

  const {
    latestProject,
    isLoadingProject,
    showNoProjectsModal,
    setShowNoProjectsModal,
    message,
  } = useProjectLoader(projectId, updateProjectId);

  const handleOpenCreateProject = () => {
    setShowNoProjectsModal(false);
    setShowCreateProjectModal(true);
  };

  const handleMaybeLater = () => {
    setShowNoProjectsModal(false);
  };

  const {
    savedFeatures,
    layers,
    setLayers,
    mapRef,
    cleanupRef,
    setupFeaturesAndLayers,
  } = useMapSetup(projectId, logger, isDarkMode);

  const {
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
  } = useDrawingState();

  const {
    selectedPoint,
    setSelectedPoint,
    showTitleModal,
    setShowTitleModal,
    markerTitle,
    type,
    setType,
    markerTitleRef,
    handleTitleChange,
    closeModal,
  } = useMarkerModal();

  // Additional state
  const [mapInstance, setMapInstance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [capturedImages, setCapturedImages] = useState({ light: null, dark: null });
  const [collapsed, setCollapsed] = useState(false);

  // Refs
  const selectedToolRef = useRef(null);
  const setLayersRef = useRef();

  const removeLayerSafe = (map, id) => { if (map.getLayer(id)) map.removeLayer(id); };
  const removeSourceSafe = (map, id) => { if (map.getSource(id)) map.removeSource(id); };

  // ─── Project menu callbacks ───────────────────────────
  const handleNewProject = useCallback((project) => {
    if (project?._id) updateProjectId(project._id);
  }, [updateProjectId]);

  const handleSaveProject = useCallback((project) => {
    if (project?._id) updateProjectId(project._id);
  }, [updateProjectId]);

  // ─── Effects ─────────────────────────────────────────

  useEffect(() => {
    document.title = latestProject?.name
      ? `${latestProject.name}`
      : "WaveLab - Studio";
  }, [latestProject?.name]);

  useEffect(() => {
    setLayersRef.current = setLayers;
  }, [setLayers]);

  useInactivityReload();

  useEffect(() => {
    const timer = setTimeout(() => setShowToolbar(true), TOOLBAR_DELAY);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const layersToRemove = [
      "wave-raster", "wave-glass-fill", "wave-glass-depth", "wave-arrows",
      "wind-raster", "wind-particles", "wind-arrows", "wind-glass-fill", "wind-glass-depth",
    ];
    const sourcesToRemove = [
      "wave-dark", "wave-light", "wind-darkstorm", "wind-solarstorm",
    ];

    layersToRemove.forEach((id) => removeLayerSafe(map, id));
    sourcesToRemove.forEach((id) => removeSourceSafe(map, id));

  }, [isDarkMode]);

  // ─── Handlers ────────────────────────────────────────

  const handleSaveTitle = (title) => {
    markerTitleRef.current = title;
    saveMarker(selectedPoint, mapRef, setShowTitleModal, type)(title);
    const coords = [selectedPoint.lng, selectedPoint.lat];
    savePointFeature({ coords, title, selectedType: type, setLayersRef });
  };

  const handleMapLoad = useMapLoader(
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
  );

  // ─── Memoized Values ─────────────────────────────────

  const savedFeaturesCollection = useMemo(() => ({
    type: "FeatureCollection",
    features: savedFeatures,
  }), [savedFeatures]);

  const showMainUI = !isLoadingProject;

  // ─── Render ──────────────────────────────────────────
  return (
    <div className="relative h-screen w-full flex overflow-hidden">

      {/* Map Wrapper */}
      <div className={`flex-grow h-full relative transition-[width] duration-300 ease-in-out ${collapsed ? "w-screen" : "w-[calc(100vw-250px)]"}`}>
        <MapComponent
          onMapLoad={handleMapLoad}
          isDarkMode={isDarkMode}
          setMapInstance={setMapInstance}
        />
      </div>

      {mapRef.current && (
        <MapStatusBar mapRef={mapRef} />
      )}

      {/* Toolbar */}
      {showToolbar && projectId && (
        <DrawToolBar
          draw={drawInstance}
          onToggleCanvas={toggleCanvas}
          onToggleFlagCanvas={toggleFlagCanvas}
          isCanvasActive={isCanvasActive}
          isFlagCanvasActive={isFlagCanvasActive}
          isDarkMode={isDarkMode}
          layers={layers}
          setLayers={setLayers}
          setLayersRef={setLayersRef}
          closedMode={closedMode}
          setClosedMode={setClosedMode}
          setType={setType}
          selectedToolRef={selectedToolRef}
          title={markerTitle}
        />
      )}

      {/* Canvas Overlays */}
      {isCanvasActive && (
        <Canvas
          mapRef={mapRef}
          drawRef={drawInstance}
          drawCounter={drawCounter}
          setDrawCounter={setDrawCounter}
          isDarkMode={isDarkMode}
          setLayersRef={setLayersRef}
          closedMode={closedMode}
          lineCount={lineCount}
        />
      )}

      {isFlagCanvasActive && (
        <FlagCanvas
          mapRef={mapRef}
          drawRef={drawInstance}
          drawCounter={drawCounter}
          setDrawCounter={setDrawCounter}
          isDarkMode={isDarkMode}
          setLayersRef={setLayersRef}
          closedMode={closedMode}
        />
      )}

      {/* Marker Title Modal — single source of truth, markerType drives accent color */}
      <MarkerTitleModal
        isOpen={showTitleModal}
        onClose={closeModal}
        onSubmit={handleSaveTitle}
        inputValue={markerTitle}
        onInputChange={handleTitleChange}
        isDarkMode={isDarkMode}
        markerType={type}
      />

      {/* Side Panel & UI Elements */}
      {showMainUI && (
        <>
          <div className="fixed top-20 left-3 flex flex-col gap-4 z-[100] animate-[slideInLeft_0.6s_ease-out] max-md:top-4 max-md:right-4 max-md:left-4 max-md:items-stretch">
            <ProjectMenu
              onNew={handleNewProject}
              onSave={handleSaveProject}
              onView={() => mapRef.current?.flyTo({ zoom: 5 })}
              map={mapInstance}
              features={savedFeaturesCollection}
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
              setCapturedImages={setCapturedImages}
            />
          </div>

          <LayerPanel
            layers={layers}
            setLayers={setLayers}
            mapRef={mapRef}
            isDarkMode={isDarkMode}
            draw={drawInstance}
          />

          <LegendBox isDarkMode={isDarkMode} />

          <NoProjectAlert
            visible={showNoProjectsModal}
            onCreateProject={handleOpenCreateProject}
            onClose={handleMaybeLater}
            isDarkMode={isDarkMode}
            message={message}
          />

          <CreateProjectModal
            visible={showCreateProjectModal}
            onClose={() => setShowCreateProjectModal(false)}
            onSubmit={handleCreateProject}
            isDarkMode={isDarkMode}
          />
        </>
      )}

      {/* Loading Overlay */}
      {isLoading && <MapLoading isDarkMode={isDarkMode} />}

      <style>{`
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default Studio;