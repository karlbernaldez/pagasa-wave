import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { AlertTriangle, ArrowLeft, MessageSquareText, Moon, Send, Sun } from "lucide-react";

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
import Button from "@/components/ui/Button";
import Canvas from "@dashboards/forecaster/draw/canvas";
import FlagCanvas from "@dashboards/forecaster/draw/front";
import MapStatusBar from "@dashboards/forecaster/map/MapStatusBar";

// NEW: shared normalizers
import { getLatestReviewRemarks } from "@/features/projects/projectAdapter";
import {
  PROJECT_STATUS,
  canSubmitProjectStatus,
  getProjectStatusLabel,
  getProjectStatusStyle,
  isProjectRevisionRequested,
} from "@/features/projects/projectStatuses";
import { normalizeFeatureCollection } from "@/features/projects/utils/normalizeFeatureCollection";

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

// API
import { submitProject } from "@/api/projectAPI";

// Utils
import { savePointFeature } from "@dashboards/forecaster/utils/ToolBarUtils";
import { handleCreateProject } from "@dashboards/forecaster/utils/ProjectUtils";
import { saveMarker } from "@dashboards/forecaster/map/layers/markerLayer";

// ─── Constants ───────────────────────────────────────
const TOOLBAR_DELAY = 1000;
const STUDIO_HEADER_HEIGHT = 64;

function getSubmitLabel(status) {
  if (status === PROJECT_STATUS.DRAFT) return "Submit";
  if (isProjectRevisionRequested(status)) return "Resubmit Revision";
  return "Resubmit";
}

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
  } = useProjectLoader(projectId);

  const [currentProject, setCurrentProject] = useState(null);
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);

  useEffect(() => {
    setCurrentProject(latestProject || null);
  }, [latestProject]);

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

  const isBlockingWorkspaceModalOpen =
    showTitleModal ||
    showCreateProjectModal ||
    showNoProjectsModal ||
    isCanvasActive ||
    isFlagCanvasActive;

  const {
    isInactivityPromptVisible,
    stayActive,
    refreshWorkspace,
  } = useInactivityReload(undefined, {
    disabled: isBlockingWorkspaceModalOpen,
  });

  // ─── Project menu callbacks ───────────────────────────
  const handleNewProject = useCallback((project) => {
    if (project?._id) updateProjectId(project._id);
  }, [updateProjectId]);

  const handleSaveProject = useCallback((project) => {
    if (project?._id) updateProjectId(project._id);
  }, [updateProjectId]);

  const handleBackToLibrary = useCallback(() => {
    window.location.href = "/studio";
  }, []);

  const handleToggleTheme = useCallback(() => {
    setIsDarkMode((value) => !value);
  }, [setIsDarkMode]);

  const handleSubmitProject = useCallback(async () => {
    const id = currentProject?._id || currentProject?.id || projectId;
    if (!id || isSubmittingProject || !canSubmitProjectStatus(currentProject?.status)) return;

    setIsSubmittingProject(true);
    try {
      const updatedProject = await submitProject(id);
      setCurrentProject(updatedProject);
    } catch (error) {
      window.alert(error?.message || "Failed to submit project for review.");
    } finally {
      setIsSubmittingProject(false);
    }
  }, [currentProject, isSubmittingProject, projectId]);

  // ─── Effects ─────────────────────────────────────────

  useEffect(() => {
    document.title = currentProject?.name
      ? `${currentProject.name}`
      : "WaveLab - Studio";
  }, [currentProject?.name]);

  useEffect(() => {
    setLayersRef.current = setLayers;
  }, [setLayers]);

  useEffect(() => {
    setIsLoading(true);
    setMapLoaded(false);
    setShowToolbar(false);
    setCapturedImages({ light: null, dark: null });
    setDrawInstance(null);
    setLineCount(0);
    setDrawCounter(0);
    setClosedMode(false);
    setSelectedPoint(null);
    setShowTitleModal(false);
    markerTitleRef.current = "";
    selectedToolRef.current = null;
  }, [
    projectId,
    setClosedMode,
    setDrawCounter,
    setDrawInstance,
    setLineCount,
    setSelectedPoint,
    setShowTitleModal,
    markerTitleRef,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => setShowToolbar(true), TOOLBAR_DELAY);
    return () => clearTimeout(timer);
  }, [projectId]);

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
    savePointFeature({ coords, title, selectedType: type, setLayersRef, projectId });
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

  const savedFeaturesCollection = useMemo(() => {
    return normalizeFeatureCollection(savedFeatures);
  }, [savedFeatures]);

  const showMainUI = !isLoadingProject;
  const projectName = currentProject?.name || "No Project Selected";
  const projectStatus = currentProject?.status;
  const isRevisionRequested = isProjectRevisionRequested(projectStatus);
  const projectStatusLabel = isRevisionRequested
    ? "Needs Revision"
    : getProjectStatusLabel(projectStatus);
  const projectStatusStyle = isRevisionRequested
    ? "border-amber-300 bg-amber-50 text-amber-800"
    : getProjectStatusStyle(projectStatus);
  const canSubmitProject = currentProject && canSubmitProjectStatus(projectStatus);
  const latestReviewRemarks = useMemo(
    () => getLatestReviewRemarks(currentProject),
    [currentProject]
  );
  const hasActiveReviewRemarks = isRevisionRequested && Boolean(latestReviewRemarks?.comment);

  // ─── Render ──────────────────────────────────────────
  return (
    <div className={`relative h-screen w-full overflow-hidden ${isDarkMode ? "bg-slate-950" : "bg-slate-100"}`}>
      <header className="absolute inset-x-0 top-0 z-[120] flex h-16 items-center justify-between border-b border-slate-200/70 bg-white/95 px-4 shadow-sm backdrop-blur-md dark:border-slate-800/70 dark:bg-slate-950/95">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={handleBackToLibrary}>
            Project Library
          </Button>

          <div className="min-w-0 border-l border-slate-200 pl-3 dark:border-slate-800">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              WaveLab Studio
            </p>
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate text-sm font-bold text-slate-900 dark:text-slate-50">
                {projectName}
              </h1>
              {currentProject?.status && (
                <span className={`hidden shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-black md:inline-flex ${projectStatusStyle}`}>
                  {projectStatusLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canSubmitProject && (
            <Button
              size="sm"
              icon={Send}
              loading={isSubmittingProject}
              disabled={isSubmittingProject}
              onClick={handleSubmitProject}
            >
              {isSubmittingProject ? "Submitting..." : getSubmitLabel(projectStatus)}
            </Button>
          )}
          <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 md:inline-flex dark:border-emerald-900/70 dark:bg-emerald-950/60 dark:text-emerald-300">
            Auto-save active
          </span>
          <Button
            variant="icon"
            size="sm"
            icon={isDarkMode ? Sun : Moon}
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            onClick={handleToggleTheme}
          />
        </div>
      </header>

      {hasActiveReviewRemarks && (
        <div className="absolute left-1/2 z-[115] w-[min(760px,calc(100%-32px))] -translate-x-1/2 rounded-2xl border border-amber-200 bg-amber-50/95 px-4 py-3 text-amber-950 shadow-lg backdrop-blur-md" style={{ top: STUDIO_HEADER_HEIGHT + 12 }}>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-amber-100 p-1.5 text-amber-700">
              <MessageSquareText size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">
                Admin remarks
              </p>
              <p className="mt-1 text-sm font-semibold leading-relaxed">
                {latestReviewRemarks.comment}
              </p>
            </div>
          </div>
        </div>
      )}

      <main className="relative flex w-full overflow-hidden" style={{ height: `calc(100vh - ${STUDIO_HEADER_HEIGHT}px)`, marginTop: STUDIO_HEADER_HEIGHT }}>
        {/* Map Wrapper */}
        <div className={`flex-grow h-full relative transition-[width] duration-300 ease-in-out ${collapsed ? "w-screen" : "w-[calc(100vw-250px)]"}`}>
          <MapComponent
            key={projectId || "no-project"}
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
            projectId={projectId}
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
            projectId={projectId}
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
            projectId={projectId}
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
            <div className="fixed left-3 flex flex-col gap-4 z-[100] animate-[slideInLeft_0.6s_ease-out] max-md:right-4 max-md:left-4 max-md:items-stretch" style={{ top: STUDIO_HEADER_HEIGHT + 16 }}>
              {/* <ProjectMenu
                onNew={handleNewProject}
                onSave={handleSaveProject}
                onView={() => mapRef.current?.flyTo({ zoom: 5 })}
                map={mapInstance}
                features={savedFeaturesCollection}
                isDarkMode={isDarkMode}
                setIsDarkMode={setIsDarkMode}
                setCapturedImages={setCapturedImages}
              /> */}
            </div>

            <LayerPanel
              layers={layers}
              setLayers={setLayers}
              mapRef={mapRef}
              isDarkMode={isDarkMode}
              draw={drawInstance}
            />

            {/* <LegendBox isDarkMode={isDarkMode} /> */}

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
      </main>

      {isInactivityPromptVisible && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="studio-inactivity-title"
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-amber-50 p-3 text-amber-700 ring-1 ring-amber-100 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900/70">
                <AlertTriangle size={24} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="studio-inactivity-title" className="text-lg font-black text-slate-950 dark:text-slate-50">
                  You’ve been inactive
                </h2>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600 dark:text-slate-300">
                  Refresh the Studio workspace only if you want to reload the map and project data. You can stay here to continue from your current view.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/50 dark:text-emerald-300">
              Auto-save is active, but in-progress tool selections or open dialogs may reset after refresh.
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={stayActive}>
                Stay here
              </Button>
              <Button variant="primary" onClick={refreshWorkspace}>
                Refresh workspace
              </Button>
            </div>
          </div>
        </div>
      )}

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
