import { useState, useEffect, useRef, useMemo } from "react";

// Component imports
import MapComponent from "@/components/pages/studio/MapComponent";
import LayerPanel from "@/components/pages/studio/LayerPanel";
import DrawToolBar from "@/components/pages/studio/Toolbar";
import Canvas from "@/components/pages/studio/draw/canvas";
import FlagCanvas from "@/components/pages/studio/draw/front";
import LegendBox from "@/components/pages/studio/Legend";
import ProjectMenu from "@/components/pages/studio/ProjectMenu";
import MarkerTitleModal from "@/components/ui/modals/MarkerTitleModal";
import MapLoading from "@/components/ui/modals/MapLoading";

// Custom Hooks
import { useProjectId, useInactivityReload, useProjectLoader, useMapSetup, useDrawingState, useMarkerModal, useMapLoader } from "@/hooks/useStudio";

// Utils
import { saveMarker } from "@/utils/mapUtils";
import { savePointFeature } from "@/components/pages/studio/utils/ToolBarUtils";

// ─── Constants ───────────────────────────────────────
const TOOLBAR_DELAY = 1000;

// ─── Main Component ──────────────────────────────────
const Studio = ({ isDarkMode, setIsDarkMode, logger }) => {
  // Project management
  const [projectId, updateProjectId] = useProjectId();
  const { latestProject, isLoadingProject, blink } = useProjectLoader(projectId, updateProjectId);

  // Map setup
  const { savedFeatures, layers, setLayers, mapRef, cleanupRef, setupFeaturesAndLayers } = useMapSetup(projectId, logger, isDarkMode);

  // Drawing state
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        // cleanupRef.current();
      }
    };
  }, [cleanupRef]);

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
      />

      {/* Side Panel & UI Elements */}
      {showMainUI && (
        <>
          <div className="fixed top-20 left-3 flex flex-col gap-4 z-[100] animate-[slideInLeft_0.6s_ease-out] max-md:top-4 max-md:right-4 max-md:left-4 max-md:items-stretch">
            <ProjectMenu
              blink={blink}
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

          <LegendBox isDarkMode={isDarkMode} />
        </>
      )}

      {/* Loading Overlay */}
      {isLoading && <MapLoading />}

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