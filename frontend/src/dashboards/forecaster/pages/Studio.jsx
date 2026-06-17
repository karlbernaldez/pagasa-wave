import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Lock, MessageSquareText, Moon, Send, Sun } from "lucide-react";

// Component imports
import MapComponent from "@dashboards/forecaster/map/MapComponent";
import LayerPanel from "@dashboards/forecaster/components/Studio/LayerPanel/LayerPanel";
import DrawToolBar from "@dashboards/forecaster/components/Studio/Toolbar/Toolbar";
import MarkerTitleModal from "@/components/ui/modals/MarkerTitleModal";
import MapLoading from "@/components/ui/modals/MapLoading";
import NoProjectAlert from "@/components/ui/modals/NoProjectAlert";
import CreateProjectModal from "@/components/ui/modals/CreateProjectModal";
import Button from "@/components/ui/Button";
import NotificationBell from "@/shared/notifications/NotificationBell";
import Canvas from "@dashboards/forecaster/draw/canvas";
import FlagCanvas from "@dashboards/forecaster/draw/front";
import MapStatusBar from "@dashboards/forecaster/map/MapStatusBar";

// Shared project helpers
import { getLatestReviewRemarks } from "@/features/projects/projectAdapter";
import {
  PROJECT_STATUS,
  canEditProjectStatus,
  canSubmitProjectStatus,
  getProjectStatusLabel,
  getProjectStatusStyle,
  isProjectRevisionRequested,
} from "@/features/projects/projectStatuses";

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
  const navigate = useNavigate();
  const { isDarkMode, setIsDarkMode } = useTheme();
  const [projectId] = useProjectId();

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
  const [studioError, setStudioError] = useState("");

  useEffect(() => {
    setCurrentProject(latestProject || null);
  }, [latestProject]);

  const handleOpenCreateProject = () => {
    setStudioError("");
    setShowNoProjectsModal(false);
    setShowCreateProjectModal(true);
  };

  const handleMaybeLater = () => {
    setShowNoProjectsModal(false);
  };

  const {
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
  const [isLoading, setIsLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [, setCapturedImages] = useState({ light: null, dark: null });

  // Refs
  const selectedToolRef = useRef(null);
  const setLayersRef = useRef();

  const removeLayerSafe = (map, id) => { if (map.getLayer(id)) map.removeLayer(id); };
  const removeSourceSafe = (map, id) => { if (map.getSource(id)) map.removeSource(id); };

  const projectStatus = currentProject?.status;
  const canEditProject = currentProject && canEditProjectStatus(projectStatus);
  const isReadOnlyProject = Boolean(currentProject && !canEditProject);

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

  const handleBackToLibrary = useCallback(() => {
    navigate("/studio");
  }, [navigate]);

  const handleToggleTheme = useCallback(() => {
    setIsDarkMode((value) => !value);
  }, [setIsDarkMode]);

  const handleSubmitProject = useCallback(async () => {
    const id = currentProject?._id || currentProject?.id || projectId;
    if (!id || isSubmittingProject || !canSubmitProjectStatus(currentProject?.status)) return;

    setIsSubmittingProject(true);
    setStudioError("");
    try {
      const updatedProject = await submitProject(id);
      setCurrentProject(updatedProject);
    } catch (error) {
      setStudioError(error?.message || "Failed to submit project for review.");
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
    setStudioError("");
  }, [
    projectId,
    setClosedMode,
    setDrawCounter,
    setDrawInstance,
    setLineCount,
    setSelectedPoint,
    setShowTitleModal,
    markerTitleRef,
    setCapturedImages,
  ]);

  useEffect(() => {
    if (!isReadOnlyProject) return;
    if (isCanvasActive) toggleCanvas();
    if (isFlagCanvasActive) toggleFlagCanvas();
    setShowTitleModal(false);
    selectedToolRef.current = null;
  }, [isReadOnlyProject, isCanvasActive, isFlagCanvasActive, toggleCanvas, toggleFlagCanvas, setShowTitleModal]);

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
    if (isReadOnlyProject) return;
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

  const showMainUI = !isLoadingProject;
  const projectName = currentProject?.name || "No Project Selected";
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

  const headerClass = isDarkMode
    ? "border-white/10 bg-slate-950/95 text-slate-100"
    : "border-slate-200/70 bg-white/95 text-slate-950";
  const headerMutedText = isDarkMode ? "text-slate-400" : "text-slate-500";
  const headerStrongText = isDarkMode ? "text-slate-50" : "text-slate-900";
  const headerDivider = isDarkMode ? "border-white/10" : "border-slate-200";
  const headerControlGroup = isDarkMode
    ? "border-white/10 bg-white/[0.05]"
    : "border-black/6 bg-black/[0.03]";

  // ─── Render ──────────────────────────────────────────
  return (
    <div className={`relative h-screen w-full overflow-hidden ${isDarkMode ? "bg-slate-950" : "bg-slate-100"}`}>
      <header className={`absolute inset-x-0 top-0 z-[120] flex h-16 items-center justify-between gap-2 border-b px-2 shadow-sm backdrop-blur-md sm:px-4 ${headerClass}`}>
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={handleBackToLibrary}>
            <span className="hidden sm:inline">Project Library</span>
            <span className="sm:hidden">Library</span>
          </Button>

          <div className={`min-w-0 border-l pl-2 sm:pl-3 ${headerDivider}`}>
            <p className={`hidden text-xs font-semibold uppercase tracking-[0.18em] sm:block ${headerMutedText}`}>
              WaveLab Studio
            </p>
            <div className="flex min-w-0 items-center gap-2">
              <h1 className={`max-w-[32vw] truncate text-xs font-bold sm:max-w-[42vw] sm:text-sm ${headerStrongText}`}>
                {projectName}
              </h1>
              {currentProject?.status && (
                <span className={`hidden shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-black lg:inline-flex ${projectStatusStyle}`}>
                  {projectStatusLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {isReadOnlyProject && (
            <span className={`hidden items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black xl:inline-flex ${isDarkMode ? "border-white/10 bg-slate-900 text-slate-300" : "border-slate-200 bg-slate-100 text-slate-600"}`}>
              <Lock size={13} />
              Read-only
            </span>
          )}
          {canSubmitProject && (
            <Button
              size="sm"
              icon={Send}
              loading={isSubmittingProject}
              disabled={isSubmittingProject}
              onClick={handleSubmitProject}
            >
              <span className="hidden sm:inline">{isSubmittingProject ? "Submitting..." : getSubmitLabel(projectStatus)}</span>
            </Button>
          )}
          <span className={`hidden rounded-full border px-3 py-1 text-xs font-semibold xl:inline-flex ${isDarkMode ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
            Auto-save active
          </span>
          <div className={`flex items-center gap-0.5 rounded-2xl border px-0.5 py-1 sm:px-1 ${headerControlGroup}`}>
            <NotificationBell isDarkMode={isDarkMode} />
            <div className={`mx-0.5 hidden h-5 w-px sm:block ${isDarkMode ? "bg-white/10" : "bg-black/8"}`} />
            <Button
              variant="icon"
              size="sm"
              icon={isDarkMode ? Sun : Moon}
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              onClick={handleToggleTheme}
            />
          </div>
        </div>
      </header>

      {studioError && (
        <div className={`absolute left-1/2 z-[117] w-[min(760px,calc(100%-32px))] -translate-x-1/2 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-md ${isDarkMode ? "border-red-500/30 bg-red-950/90 text-red-200" : "border-red-200 bg-red-50/95 text-red-800"}`} style={{ top: STUDIO_HEADER_HEIGHT + 12 }} role="alert">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className={`mt-0.5 rounded-lg p-1.5 ${isDarkMode ? "bg-red-500/10 text-red-300" : "bg-red-100 text-red-700"}`}>
                <AlertTriangle size={16} />
              </div>
              <p className="text-sm font-semibold leading-relaxed">{studioError}</p>
            </div>
            <button
              type="button"
              className={`shrink-0 text-xs font-black uppercase tracking-wide ${isDarkMode ? "text-red-200 hover:text-white" : "text-red-700 hover:text-red-900"}`}
              onClick={() => setStudioError("")}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {isReadOnlyProject && (
        <div className={`absolute left-1/2 z-[116] w-[min(760px,calc(100%-32px))] -translate-x-1/2 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-md ${isDarkMode ? "border-white/10 bg-slate-950/95 text-slate-200" : "border-slate-200 bg-white/95 text-slate-700"}`} style={{ top: STUDIO_HEADER_HEIGHT + (studioError ? 92 : 12) }}>
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 rounded-lg p-1.5 ${isDarkMode ? "bg-slate-900 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
              <Lock size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-black uppercase tracking-[0.14em] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                Editing locked
              </p>
              <p className="mt-1 text-sm font-semibold leading-relaxed">
                This project is already {projectStatusLabel}. You can view it, but markers, drawings, uploads, deletes, and edits are disabled until Admin requests a revision.
              </p>
            </div>
          </div>
        </div>
      )}

      {hasActiveReviewRemarks && (
        <div className={`absolute left-1/2 z-[115] w-[min(760px,calc(100%-32px))] -translate-x-1/2 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-md ${isDarkMode ? "border-amber-400/30 bg-amber-950/80 text-amber-100" : "border-amber-200 bg-amber-50/95 text-amber-950"}`} style={{ top: STUDIO_HEADER_HEIGHT + (studioError ? 92 : 0) + (isReadOnlyProject ? 104 : 12) }}>
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 rounded-lg p-1.5 ${isDarkMode ? "bg-amber-500/10 text-amber-300" : "bg-amber-100 text-amber-700"}`}>
              <MessageSquareText size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-black uppercase tracking-[0.14em] ${isDarkMode ? "text-amber-300" : "text-amber-700"}`}>
                Admin remarks
              </p>
              <p className="mt-1 text-sm font-semibold leading-relaxed">
                {latestReviewRemarks.comment}
              </p>
            </div>
          </div>
        </div>
      )}

      <main className="absolute inset-0 w-full overflow-hidden">
        {/* Map Wrapper */}
        <div className="absolute inset-0 h-full w-full">
          <MapComponent
            key={projectId || "no-project"}
            onMapLoad={handleMapLoad}
            isDarkMode={isDarkMode}
          />
        </div>

        {mapRef.current && (
          <MapStatusBar mapRef={mapRef} />
        )}

        {/* Toolbar */}
        {showToolbar && projectId && canEditProject && (
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
        {isCanvasActive && canEditProject && (
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

        {isFlagCanvasActive && canEditProject && (
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
          isOpen={showTitleModal && canEditProject}
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
            <LayerPanel
              layers={layers}
              setLayers={setLayers}
              mapRef={mapRef}
              isDarkMode={isDarkMode}
              draw={drawInstance}
              readOnly={isReadOnlyProject}
            />

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
            className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl ${isDarkMode ? "border-white/10 bg-slate-950 text-slate-100" : "border-slate-200 bg-white text-slate-950"}`}
          >
            <div className="flex items-start gap-4">
              <div className={`${isDarkMode ? "bg-amber-500/10 text-amber-300 ring-amber-400/20" : "bg-amber-50 text-amber-700 ring-amber-100"} rounded-2xl p-3 ring-1`}>
                <AlertTriangle size={24} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="studio-inactivity-title" className={`text-lg font-black ${isDarkMode ? "text-slate-50" : "text-slate-950"}`}>
                  You’ve been inactive
                </h2>
                <p className={`mt-2 text-sm font-semibold leading-relaxed ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                  Refresh the Studio workspace only if you want to reload the map and project data. You can stay here to continue from your current view.
                </p>
              </div>
            </div>

            <div className={`${isDarkMode ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300" : "border-emerald-200 bg-emerald-50 text-emerald-800"} mt-5 rounded-2xl border px-4 py-3 text-sm font-semibold`}>
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
