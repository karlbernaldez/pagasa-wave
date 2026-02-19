import { useState, useEffect, useRef, useMemo } from "react";

// Component imports
import MapComponent from "@/components/pages/studio/MapComponent";
import LayerPanel from "@/components/pages/studio/LayerPanel";
import WaveLegend from "@/components/pages/studio/WaveLegend";
import DrawToolBar from "@/components/pages/studio/Toolbar";
import Canvas from "@/components/pages/studio/draw/canvas";
import FlagCanvas from "@/components/pages/studio/draw/front";
import LegendBox from "@/components/pages/studio/Legend";
import ProjectMenu from "@/components/pages/studio/ProjectMenu";
import MarkerTitleModal from "@/components/ui/modals/MarkerTitleModal";
import MapLoading from "@/components/ui/modals/MapLoading";
import NoProjectAlert from "@/components/ui/modals/NoProjectAlert";
import CreateProjectModal from "@/components/ui/modals/CreateProjectModal";

// Custom Hooks
import { useProjectId, useInactivityReload, useProjectLoader, useMapSetup, useDrawingState, useMarkerModal, useMapLoader } from "@/hooks/useStudio";
import { handleCreateProject } from '@/components/pages/studio/utils/ProjectUtils'
import { useTheme } from '@/app/providers/ThemeProvider';

// Utils
import { saveMarker } from "@/components/pages/studio/map/layers/markerLayer";
import { savePointFeature } from "@/components/pages/studio/utils/ToolBarUtils";
import { addWindSource, addWindLayer } from '@/components/pages/studio/map/layers/windLayer';
import { addWaveSource, addWaveLayer } from '@/components/pages/studio/map/layers/waveLayer';

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
    setShowNoProjectsModal
  } = useProjectLoader(projectId, updateProjectId);

  const handleOpenCreateProject = () => {
    setShowNoProjectsModal(false);
    setShowCreateProjectModal(true);
  };

  const handleMaybeLater = () => {
    setShowNoProjectsModal(false);
    // Optional: You might want to redirect or show a different screen
  };

  const { savedFeatures, layers, setLayers, mapRef, cleanupRef, setupFeaturesAndLayers } = useMapSetup(projectId, logger, isDarkMode);

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

  // Marker modal
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

  const removeLayerSafe = (map, id) => {
    if (map.getLayer(id)) map.removeLayer(id);
  };

  const removeSourceSafe = (map, id) => {
    if (map.getSource(id)) map.removeSource(id);
  };

  // Set page title
  useEffect(() => {
    document.title = "WaveLab - Studio";
  }, []);

  // Keep setLayersRef in sync
  useEffect(() => {
    setLayersRef.current = setLayers;
  }, [setLayers]);

  // Inactivity reload
  useInactivityReload();

  // Delayed toolbar display
  useEffect(() => {
    const timer = setTimeout(() => setShowToolbar(true), TOOLBAR_DELAY);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const layersToRemove = [
      "wave-raster",
      "wave-glass-fill",
      "wave-glass-depth",
      "wave-arrows",
      "wind-raster",
      "wind-particles",
      "wind-arrows",
      "wind-glass-fill",
      "wind-glass-depth"
    ];

    const sourcesToRemove = [
      "wave-dark",
      "wave-light",
      "wind-darkstorm",
      "wind-solarstorm"
    ];

    layersToRemove.forEach(id => removeLayerSafe(map, id));
    sourcesToRemove.forEach(id => removeSourceSafe(map, id));

    // rebuild correctly
    (async () => {
      await addWindSource(map, isDarkMode);
      addWindLayer(map, isDarkMode);

      await addWaveSource(map, isDarkMode);
      addWaveLayer(map, isDarkMode);
    })();

  }, [isDarkMode]);

  // ─── Handlers ────────────────────────────────────────

  const handleSaveTitle = (title) => {
    markerTitleRef.current = title;
    saveMarker(selectedPoint, mapRef, setShowTitleModal, type)(title);

    const coords = [selectedPoint.lng, selectedPoint.lat];
    savePointFeature({
      coords,
      title,
      selectedType: type,
      setLayersRef
    });
  };

  // Map loader hook
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
    features: savedFeatures
  }), [savedFeatures]);

  const showMainUI = !isLoadingProject;

  // ─── Render ──────────────────────────────────────────
  return (
    <div className="relative h-screen w-full flex overflow-hidden">
      {/* Map Wrapper */}
      <div className={`flex-grow h-full relative transition-[width] duration-300 ease-in-out ${collapsed ? 'w-screen' : 'w-[calc(100vw-250px)]'}`}>
        <MapComponent
          onMapLoad={handleMapLoad}
          isDarkMode={isDarkMode}
          setMapInstance={setMapInstance}
        />
      </div>

      {/* Toolbar */}
      {showToolbar && projectId && (
        <DrawToolBar
          draw={drawInstance}
          mapRef={mapRef}
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

      {/* Marker Title Modal */}
      <MarkerTitleModal
        isOpen={showTitleModal}
        onClose={closeModal}
        onSave={handleSaveTitle}
        inputValue={markerTitle}
        onInputChange={handleTitleChange}
        isDarkMode={isDarkMode}
      />

      {/* Side Panel & UI Elements */}
      {showMainUI && (
        <>
          <div className="fixed top-20 left-3 flex flex-col gap-4 z-[100] animate-[slideInLeft_0.6s_ease-out] max-md:top-4 max-md:right-4 max-md:left-4 max-md:items-stretch">
            <ProjectMenu
              projectId={projectId}
              map={mapInstance}
              features={savedFeaturesCollection}
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
              setMapLoaded={setMapLoaded}
              isLoading={isLoading}
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

          <WaveLegend isDarkMode={isDarkMode} />

          <LegendBox isDarkMode={isDarkMode} />

          <NoProjectAlert
            visible={showNoProjectsModal}
            onCreateProject={handleOpenCreateProject}
            onClose={handleMaybeLater}
            isDarkMode={isDarkMode}
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

      {/* Animation Keyframes */}
      <style jsx>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Studio;