import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, CheckCircle2, Lock, Moon, Sun } from "lucide-react";

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
import { canEditProjectStatus, getProjectStatusLabel, getProjectStatusStyle, isProjectRevisionRequested } from "@/features/projects/projectStatuses";
import { FORECAST_CHART_BROWSER_EVENT, useProjectId, useInactivityReload, useProjectLoader, useMapSetup, useDrawingState, useMarkerModal, useMapLoader } from "@dashboards/forecaster/hooks/useStudio";
import { useTheme } from "@/app/providers/ThemeProvider";
import { claimForecastPackageChartByProject, fetchForecastPackageChartContextByProject, releaseForecastPackageChartByProject, updateForecastChartCompletionByProject } from "@/api/forecastPackageAPI";
import { savePointFeature } from "@dashboards/forecaster/utils/ToolBarUtils";
import { handleCreateProject } from "@dashboards/forecaster/utils/ProjectUtils";
import { saveMarker } from "@dashboards/forecaster/map/layers/markerLayer";

const TOOLBAR_DELAY = 1000;
const STUDIO_HEADER_HEIGHT = 64;

const FORECAST_CHART_LABELS = {
  analysis: "Wave Analysis",
  forecast_24h: "24h Wave Forecast",
  forecast_36h: "36h Wave Forecast",
  forecast_48h: "48h Wave Forecast",
};

function getChartLabel(chartType) {
  return FORECAST_CHART_LABELS[chartType] || "Forecast chart";
}

function isContextNotFound(error) {
  return /context not found|not found/i.test(error?.message || "");
}

function formatNameList(names = []) {
  if (!names.length) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`;
}

function getContextProject(context) {
  return context?.chart?.project && typeof context.chart.project === "object"
    ? context.chart.project
    : null;
}

const Studio = ({ logger }) => {
  const navigate = useNavigate();
  const { isDarkMode, setIsDarkMode } = useTheme();
  const [projectId] = useProjectId();
  const suppressAutoJoinRef = useRef(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const { latestProject, isLoadingProject, showNoProjectsModal, setShowNoProjectsModal, message } = useProjectLoader(projectId);
  const [currentProject, setCurrentProject] = useState(null);
  const [chartContext, setChartContext] = useState(null);
  const [isLoadingChartContext, setIsLoadingChartContext] = useState(false);
  const [isClaimingChart, setIsClaimingChart] = useState(false);
  const [isReleasingChart, setIsReleasingChart] = useState(false);
  const [isCertifyingChart, setIsCertifyingChart] = useState(false);
  const [studioError, setStudioError] = useState("");

  useEffect(() => { suppressAutoJoinRef.current = false; }, [projectId]);
  useEffect(() => { setCurrentProject(latestProject || null); }, [latestProject]);

  const handleOpenCreateProject = () => { setStudioError(""); setShowNoProjectsModal(false); setShowCreateProjectModal(true); };
  const handleMaybeLater = () => setShowNoProjectsModal(false);
  const { layers, setLayers, mapRef, cleanupRef, setupFeaturesAndLayers } = useMapSetup(projectId, logger, isDarkMode);
  const { drawInstance, setDrawInstance, isCanvasActive, isFlagCanvasActive, lineCount, setLineCount, drawCounter, setDrawCounter, closedMode, setClosedMode, toggleCanvas, toggleFlagCanvas } = useDrawingState();
  const { selectedPoint, setSelectedPoint, showTitleModal, setShowTitleModal, markerTitle, type, setType, markerTitleRef, handleTitleChange, closeModal } = useMarkerModal();
  const [isLoading, setIsLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [, setCapturedImages] = useState({ light: null, dark: null });
  const selectedToolRef = useRef(null);
  const setLayersRef = useRef();

  const projectStatus = currentProject?.status;
  const chartClaim = chartContext?.claim;
  const isPackageChartReady = Boolean(chartContext?.completion?.isComplete);
  const canEditProject = Boolean(currentProject && canEditProjectStatus(projectStatus) && !isPackageChartReady);
  const canUseEditingTools = Boolean(canEditProject && chartClaim?.claimedByCurrentUser);
  const isReadOnlyProject = Boolean(currentProject && !canUseEditingTools);
  const isPackageReadyReadOnly = Boolean(currentProject && isPackageChartReady);
  const isBlockingWorkspaceModalOpen = showTitleModal || showCreateProjectModal || showNoProjectsModal || isCanvasActive || isFlagCanvasActive;
  const { isInactivityPromptVisible, stayActive, refreshWorkspace } = useInactivityReload(undefined, { disabled: isBlockingWorkspaceModalOpen });

  const handleBackToLibrary = useCallback(() => { navigate("/studio"); }, [navigate]);
  const handleToggleTheme = useCallback(() => { setIsDarkMode((value) => !value); }, [setIsDarkMode]);

  const applyChartContext = useCallback((context) => {
    setChartContext(context);
    const contextProject = getContextProject(context);
    if (contextProject) setCurrentProject(contextProject);
  }, []);

  const loadChartContext = useCallback(async ({ signal, silent = false, autoJoin } = {}) => {
    if (!projectId) { setChartContext(null); setIsLoadingChartContext(false); return; }
    const shouldAutoJoin = autoJoin ?? !suppressAutoJoinRef.current;
    if (!silent) setIsLoadingChartContext(true);
    try {
      const context = await fetchForecastPackageChartContextByProject(projectId, { signal, autoJoin: shouldAutoJoin });
      applyChartContext(context);
    } catch (error) {
      if (error?.name === "AbortError") return;
      if (isContextNotFound(error)) { setChartContext(null); return; }
      console.error("Failed to load forecast package chart context:", error);
      setStudioError(error?.message || "Failed to load forecast package chart workflow.");
    } finally {
      if (!silent) setIsLoadingChartContext(false);
    }
  }, [projectId, applyChartContext]);

  useEffect(() => { document.title = currentProject?.name ? `${currentProject.name}` : "WaveLab - Studio"; }, [currentProject?.name]);
  useEffect(() => { setLayersRef.current = setLayers; }, [setLayers]);
  useEffect(() => {
    setIsLoading(true); setMapLoaded(false); setShowToolbar(false); setCapturedImages({ light: null, dark: null });
    setDrawInstance(null); setLineCount(0); setDrawCounter(0); setClosedMode(false); setSelectedPoint(null); setShowTitleModal(false);
    markerTitleRef.current = ""; selectedToolRef.current = null; setStudioError("");
  }, [projectId, setClosedMode, setDrawCounter, setDrawInstance, setLineCount, setSelectedPoint, setShowTitleModal, markerTitleRef, setCapturedImages]);
  useEffect(() => { const controller = new AbortController(); loadChartContext({ signal: controller.signal, autoJoin: true }); return () => controller.abort(); }, [loadChartContext]);
  useEffect(() => { const handler = (event) => { if (String(event.detail?.projectId || "") === String(projectId)) loadChartContext({ silent: true, autoJoin: false }); }; window.addEventListener(FORECAST_CHART_BROWSER_EVENT, handler); return () => window.removeEventListener(FORECAST_CHART_BROWSER_EVENT, handler); }, [loadChartContext, projectId]);
  useEffect(() => { if (canUseEditingTools) return; if (isCanvasActive) toggleCanvas(); if (isFlagCanvasActive) toggleFlagCanvas(); setShowTitleModal(false); selectedToolRef.current = null; }, [canUseEditingTools, isCanvasActive, isFlagCanvasActive, toggleCanvas, toggleFlagCanvas, setShowTitleModal]);
  useEffect(() => { const timer = setTimeout(() => setShowToolbar(true), TOOLBAR_DELAY); return () => clearTimeout(timer); }, [projectId]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    ["wave-raster", "wave-glass-fill", "wave-glass-depth", "wave-arrows", "wind-raster", "wind-particles", "wind-arrows", "wind-glass-fill", "wind-glass-depth"].forEach((id) => { if (map.getLayer(id)) map.removeLayer(id); });
    ["wave-dark", "wave-light", "wind-darkstorm", "wind-solarstorm"].forEach((id) => { if (map.getSource(id)) map.removeSource(id); });
  }, [isDarkMode, mapRef]);

  const handleSaveTitle = (title) => {
    if (!canUseEditingTools) return;
    markerTitleRef.current = title;
    saveMarker(selectedPoint, mapRef, setShowTitleModal, type)(title);
    savePointFeature({ coords: [selectedPoint.lng, selectedPoint.lat], title, selectedType: type, setLayersRef, projectId });
  };

  const handleClaimChart = async () => { if (!projectId || isClaimingChart) return; setIsClaimingChart(true); suppressAutoJoinRef.current = false; setStudioError(""); try { const context = await claimForecastPackageChartByProject(projectId); applyChartContext(context); } catch (error) { setStudioError(error?.message || "Failed to join chart editing."); } finally { setIsClaimingChart(false); } };
  const handleReleaseChart = async () => { if (!projectId || isReleasingChart) return; setIsReleasingChart(true); suppressAutoJoinRef.current = true; setStudioError(""); try { const context = await releaseForecastPackageChartByProject(projectId); applyChartContext(context); } catch (error) { suppressAutoJoinRef.current = false; setStudioError(error?.message || "Failed to release chart editing session."); } finally { setIsReleasingChart(false); } };
  const handleCertifyChartReady = async () => { if (!projectId || isCertifyingChart) return; setIsCertifyingChart(true); setStudioError(""); try { const context = await updateForecastChartCompletionByProject(projectId, true); applyChartContext(context); } catch (error) { setStudioError(error?.message || "Failed to certify chart readiness."); } finally { setIsCertifyingChart(false); } };
  const handleReopenChartEdits = async () => { if (!projectId || isCertifyingChart) return; setIsCertifyingChart(true); setStudioError(""); try { const context = await updateForecastChartCompletionByProject(projectId, false); applyChartContext(context); } catch (error) { setStudioError(error?.message || "Failed to reopen chart editing."); } finally { setIsCertifyingChart(false); } };

  const handleMapLoad = useMapLoader(projectId, logger, isDarkMode, setupFeaturesAndLayers, mapRef, cleanupRef, setDrawInstance, setMapLoaded, setSelectedPoint, setShowTitleModal, setLineCount, selectedToolRef, setCapturedImages, setIsLoading);
  const showMainUI = !isLoadingProject;
  const projectName = currentProject?.name || "No Project Selected";
  const isRevisionRequested = isProjectRevisionRequested(projectStatus);
  const projectStatusLabel = isRevisionRequested ? "Needs Revision" : getProjectStatusLabel(projectStatus);
  const projectStatusStyle = isRevisionRequested ? "border-amber-300 bg-amber-50 text-amber-800" : getProjectStatusStyle(projectStatus);
  const chartType = chartContext?.chartType;
  const chartLabel = getChartLabel(chartType);
  const blockingChartLabel = getChartLabel(chartContext?.blockingChartType);
  const activeEditorLabels = chartClaim?.activeEditorLabels || [];
  const activeEditorText = formatNameList(activeEditorLabels);
  const isChartActionBusy = isLoadingChartContext || isClaimingChart || isReleasingChart || isCertifyingChart;

  const headerClass = isDarkMode ? "studio-liquid-dark border-white/[0.18] text-slate-100 shadow-black/35" : "studio-liquid-light border-white/80 text-slate-950 shadow-slate-400/25";
  const headerMutedText = isDarkMode ? "text-white/45" : "text-slate-500";
  const headerStrongText = isDarkMode ? "text-white" : "text-slate-950";
  const headerDivider = isDarkMode ? "border-white/10" : "border-white/70";
  const headerControlGroup = isDarkMode ? "border-white/10 bg-white/[0.055] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" : "border-white/80 bg-white/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]";
  const headerGhostButton = isDarkMode ? "!border-white/10 !bg-white/[0.055] !text-cyan-100 hover:!bg-white/[0.09] hover:!text-white" : "!border-white/80 !bg-white/65 !text-blue-700 hover:!bg-white hover:!text-blue-800";
  const headerPrimaryButton = isDarkMode ? "!border-cyan-300/25 !bg-cyan-400/15 !text-cyan-100 hover:!bg-cyan-400/22" : "!border-blue-200 !bg-blue-600 !text-white hover:!bg-blue-500";

  return (
    <div className={`relative h-screen w-full overflow-hidden ${isDarkMode ? "bg-slate-950" : "bg-slate-100"}`}>
      <header className={`studio-liquid-panel absolute left-2 right-2 top-2 z-[120] flex h-14 items-center justify-between gap-2 rounded-2xl border px-2 shadow-2xl backdrop-blur-2xl sm:left-3 sm:right-3 sm:px-3 ${headerClass}`}>
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3"><Button variant="secondary" size="sm" icon={ArrowLeft} onClick={handleBackToLibrary} className={`!rounded-xl ${headerGhostButton}`}><span className="hidden sm:inline">Forecast Package</span><span className="sm:hidden">Package</span></Button><div className={`min-w-0 border-l pl-2 sm:pl-3 ${headerDivider}`}><p className={`hidden text-xs font-semibold uppercase tracking-[0.18em] sm:block ${headerMutedText}`}>WaveLab Studio</p><div className="flex min-w-0 items-center gap-2"><h1 className={`max-w-[32vw] truncate text-xs font-bold sm:max-w-[42vw] sm:text-sm ${headerStrongText}`}>{projectName}</h1>{currentProject?.status && <span className={`hidden shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-black lg:inline-flex ${projectStatusStyle}`}>{projectStatusLabel}</span>}</div></div></div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">{isReadOnlyProject && <span className={`hidden items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black xl:inline-flex ${isDarkMode ? "border-white/10 bg-slate-900 text-slate-300" : "border-slate-200 bg-slate-100 text-slate-700"}`}><Lock size={13} />{isPackageReadyReadOnly ? "Ready" : projectStatusLabel || "Read only"}</span>}{chartContext && <div className={`hidden items-center gap-2 rounded-2xl border px-3 py-1.5 text-xs font-black lg:flex ${headerControlGroup}`}><span className={isDarkMode ? "text-cyan-200" : "text-blue-700"}>{chartLabel}</span>{chartClaim?.claimedByCurrentUser ? <span className="text-emerald-300">You are editing</span> : chartClaim?.claimedByOtherUser ? <span className="text-amber-300">Editing: {activeEditorText}</span> : <span className={headerMutedText}>Available</span>}{chartClaim?.canRelease && <Button size="sm" variant="secondary" onClick={handleReleaseChart} loading={isReleasingChart} disabled={isChartActionBusy} className={`!h-8 !rounded-xl ${headerGhostButton}`}>Release</Button>}{chartClaim?.canClaim && <Button size="sm" onClick={handleClaimChart} loading={isClaimingChart} disabled={isChartActionBusy} className={`!h-8 !rounded-xl ${headerPrimaryButton}`}>Join</Button>}{chartClaim?.canCertify && <Button size="sm" variant="secondary" icon={CheckCircle2} onClick={handleCertifyChartReady} loading={isCertifyingChart} disabled={isChartActionBusy} className={`!h-8 !rounded-xl ${headerGhostButton}`}>Ready</Button>}{isPackageChartReady && canEditProjectStatus(projectStatus) && <Button size="sm" variant="secondary" onClick={handleReopenChartEdits} loading={isCertifyingChart} disabled={isChartActionBusy} className={`!h-8 !rounded-xl ${headerGhostButton}`}>Reopen</Button>}</div>}<NotificationBell /><button onClick={handleToggleTheme} className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 hover:scale-105 ${headerControlGroup}`} aria-label="Toggle theme">{isDarkMode ? <Sun size={16} /> : <Moon size={16} />}</button></div>
      </header>

      {studioError && <div className={`absolute left-1/2 top-[4.5rem] z-[130] flex -translate-x-1/2 items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-bold shadow-xl ${isDarkMode ? "border-red-400/30 bg-red-950/80 text-red-200" : "border-red-200 bg-red-50 text-red-700"}`}><AlertTriangle size={16} />{studioError}</div>}

      {showMainUI && <MapComponent onMapLoad={handleMapLoad} mapRef={mapRef} isDarkMode={isDarkMode} setIsLoading={setIsLoading} logger={logger} />}
      {showMainUI && <LayerPanel mapRef={mapRef} isDarkMode={isDarkMode} layers={layers} setLayers={setLayers} draw={drawInstance} onNew={handleOpenCreateProject} onView={() => navigate("/viewer")} readOnly={isReadOnlyProject} />}
      {showMainUI && showToolbar && !isReadOnlyProject && <DrawToolBar isCanvasActive={isCanvasActive} toggleCanvas={toggleCanvas} isFlagCanvasActive={isFlagCanvasActive} toggleFlagCanvas={toggleFlagCanvas} setShowTitleModal={setShowTitleModal} setSelectedPoint={setSelectedPoint} setType={setType} mapRef={mapRef} drawInstance={drawInstance} lineCount={lineCount} setLineCount={setLineCount} setDrawCounter={setDrawCounter} drawCounter={drawCounter} closedMode={closedMode} setClosedMode={setClosedMode} selectedToolRef={selectedToolRef} disabled={!canUseEditingTools} />}
      {showMainUI && !isReadOnlyProject && <Canvas isCanvasActive={isCanvasActive} setIsCanvasActive={toggleCanvas} mapRef={mapRef} isDarkMode={isDarkMode} setLayersRef={setLayersRef} drawInstance={drawInstance} drawCounter={drawCounter} setDrawCounter={setDrawCounter} closedMode={closedMode} setClosedMode={setClosedMode} lineCount={lineCount} projectId={projectId} />}
      {showMainUI && !isReadOnlyProject && <FlagCanvas isCanvasActive={isFlagCanvasActive} setIsCanvasActive={toggleFlagCanvas} mapRef={mapRef} isDarkMode={isDarkMode} setLayersRef={setLayersRef} drawInstance={drawInstance} drawCounter={drawCounter} setDrawCounter={setDrawCounter} projectId={projectId} />}
      {showMainUI && <MapStatusBar mapLoaded={mapLoaded} isLoading={isLoading} isDarkMode={isDarkMode} activeProject={currentProject} />}

      {showTitleModal && <MarkerTitleModal isOpen={showTitleModal} onClose={closeModal} markerTitle={markerTitle} handleTitleChange={handleTitleChange} onSave={handleSaveTitle} />}
      {isLoading && <MapLoading message={isLoadingProject ? "Loading project..." : "Loading map..."} />}
      {showNoProjectsModal && <NoProjectAlert onCreate={handleOpenCreateProject} onOpenLibrary={handleBackToLibrary} onLater={handleMaybeLater} message={message} />}
      {showCreateProjectModal && <CreateProjectModal isOpen={showCreateProjectModal} onClose={() => setShowCreateProjectModal(false)} onCreate={(projectData) => handleCreateProject({ projectData, setLoading: () => { }, onSuccess: (project) => { setShowCreateProjectModal(false); navigate(`/studio/${project._id || project.id}`); } })} />}
      {isInactivityPromptVisible && <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm"><div className={`max-w-md rounded-3xl border p-6 text-center shadow-2xl ${isDarkMode ? "border-white/10 bg-slate-900 text-slate-100" : "border-slate-200 bg-white text-slate-900"}`}><h2 className="text-xl font-black">Workspace paused for inactivity</h2><p className={`mt-2 text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>Refresh the workspace to continue with the latest forecast data, or stay active if you are still editing.</p><div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center"><Button onClick={refreshWorkspace}>Refresh workspace</Button><Button variant="secondary" onClick={stayActive}>Stay active</Button></div></div></div>}
    </div>
  );
};

export default Studio;
