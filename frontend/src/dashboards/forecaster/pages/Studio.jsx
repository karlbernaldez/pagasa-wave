import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, CheckCircle2, Lock, MessageSquareText, Moon, Send, Sun } from "lucide-react";

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
import { getLatestReviewRemarks } from "@/features/projects/projectAdapter";
import { canEditProjectStatus, getProjectStatusLabel, getProjectStatusStyle, isProjectRevisionRequested } from "@/features/projects/projectStatuses";
import { FORECAST_CHART_BROWSER_EVENT, useProjectId, useInactivityReload, useProjectLoader, useMapSetup, useDrawingState, useMarkerModal, useMapLoader } from "@dashboards/forecaster/hooks/useStudio";
import { useTheme } from "@/app/providers/ThemeProvider";
import { claimForecastPackageChartByProject, fetchForecastPackageChartContextByProject, releaseForecastPackageChartByProject, updateForecastChartCompletionByProject } from "@/api/forecastPackageAPI";
import { savePointFeature } from "@dashboards/forecaster/utils/ToolBarUtils";
import { handleCreateProject } from "@dashboards/forecaster/utils/ProjectUtils";
import { saveMarker } from "@dashboards/forecaster/map/layers/markerLayer";

const TOOLBAR_DELAY = 1000;
const STUDIO_HEADER_HEIGHT = 64;
const FORECAST_CHART_LABELS = { analysis: "Wave Analysis", forecast_24h: "24h Wave Forecast", forecast_36h: "36h Wave Forecast", forecast_48h: "48h Wave Forecast" };
function getChartLabel(chartType) { return FORECAST_CHART_LABELS[chartType] || "Forecast chart"; }
function isContextNotFound(error) { return /context not found|not found/i.test(error?.message || ""); }
function formatNameList(names = []) { if (!names.length) return ""; if (names.length === 1) return names[0]; if (names.length === 2) return `${names[0]} and ${names[1]}`; return `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`; }

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
  const removeLayerSafe = (map, id) => { if (map.getLayer(id)) map.removeLayer(id); };
  const removeSourceSafe = (map, id) => { if (map.getSource(id)) map.removeSource(id); };
  const projectStatus = currentProject?.status;
  const isPackageChartReady = Boolean(chartContext?.completion?.isComplete);
  const canEditProject = Boolean(currentProject && canEditProjectStatus(projectStatus) && !isPackageChartReady);
  const isReadOnlyProject = Boolean(currentProject && !canEditProject);
  const isPackageReadyReadOnly = Boolean(currentProject && isPackageChartReady);
  const isBlockingWorkspaceModalOpen = showTitleModal || showCreateProjectModal || showNoProjectsModal || isCanvasActive || isFlagCanvasActive;
  const { isInactivityPromptVisible, stayActive, refreshWorkspace } = useInactivityReload(undefined, { disabled: isBlockingWorkspaceModalOpen });
  const handleBackToLibrary = useCallback(() => { navigate("/studio"); }, [navigate]);
  const handleToggleTheme = useCallback(() => { setIsDarkMode((value) => !value); }, [setIsDarkMode]);

  const loadChartContext = useCallback(async ({ signal, silent = false, autoJoin } = {}) => {
    if (!projectId) { setChartContext(null); setIsLoadingChartContext(false); return; }
    const shouldAutoJoin = autoJoin ?? !suppressAutoJoinRef.current;
    if (!silent) setIsLoadingChartContext(true);
    try { setChartContext(await fetchForecastPackageChartContextByProject(projectId, { signal, autoJoin: shouldAutoJoin })); }
    catch (error) { if (error?.name === "AbortError") return; if (isContextNotFound(error)) { setChartContext(null); return; } setStudioError(error?.message || "Failed to load forecast package chart workflow."); }
    finally { if (!silent) setIsLoadingChartContext(false); }
  }, [projectId]);

  useEffect(() => { document.title = currentProject?.name ? `${currentProject.name}` : "WaveLab - Studio"; }, [currentProject?.name]);
  useEffect(() => { setLayersRef.current = setLayers; }, [setLayers]);
  useEffect(() => { setIsLoading(true); setMapLoaded(false); setShowToolbar(false); setCapturedImages({ light: null, dark: null }); setDrawInstance(null); setLineCount(0); setDrawCounter(0); setClosedMode(false); setSelectedPoint(null); setShowTitleModal(false); markerTitleRef.current = ""; selectedToolRef.current = null; setStudioError(""); }, [projectId, setClosedMode, setDrawCounter, setDrawInstance, setLineCount, setSelectedPoint, setShowTitleModal, markerTitleRef, setCapturedImages]);
  useEffect(() => { const controller = new AbortController(); loadChartContext({ signal: controller.signal, autoJoin: true }); return () => controller.abort(); }, [loadChartContext]);
  useEffect(() => { const handler = (event) => { if (String(event.detail?.projectId || "") === String(projectId)) loadChartContext({ silent: true }); }; window.addEventListener(FORECAST_CHART_BROWSER_EVENT, handler); return () => window.removeEventListener(FORECAST_CHART_BROWSER_EVENT, handler); }, [loadChartContext, projectId]);
  useEffect(() => { if (!isReadOnlyProject) return; if (isCanvasActive) toggleCanvas(); if (isFlagCanvasActive) toggleFlagCanvas(); setShowTitleModal(false); selectedToolRef.current = null; }, [isReadOnlyProject, isCanvasActive, isFlagCanvasActive, toggleCanvas, toggleFlagCanvas, setShowTitleModal]);
  useEffect(() => { const timer = setTimeout(() => setShowToolbar(true), TOOLBAR_DELAY); return () => clearTimeout(timer); }, [projectId]);
  useEffect(() => { const map = mapRef.current; if (!map || !map.isStyleLoaded()) return; ["wave-raster", "wave-glass-fill", "wave-glass-depth", "wave-arrows", "wind-raster", "wind-particles", "wind-arrows", "wind-glass-fill", "wind-glass-depth"].forEach((id) => removeLayerSafe(map, id)); ["wave-dark", "wave-light", "wind-darkstorm", "wind-solarstorm"].forEach((id) => removeSourceSafe(map, id)); }, [isDarkMode]);
  const handleSaveTitle = (title) => { if (isReadOnlyProject) return; markerTitleRef.current = title; saveMarker(selectedPoint, mapRef, setShowTitleModal, type)(title); savePointFeature({ coords: [selectedPoint.lng, selectedPoint.lat], title, selectedType: type, setLayersRef, projectId }); };
  const handleClaimChart = async () => { if (!projectId || isClaimingChart) return; setIsClaimingChart(true); suppressAutoJoinRef.current = false; setStudioError(""); try { setChartContext(await claimForecastPackageChartByProject(projectId)); } catch (error) { setStudioError(error?.message || "Failed to join chart editing."); } finally { setIsClaimingChart(false); } };
  const handleReleaseChart = async () => { if (!projectId || isReleasingChart) return; setIsReleasingChart(true); suppressAutoJoinRef.current = true; setStudioError(""); try { setChartContext(await releaseForecastPackageChartByProject(projectId)); } catch (error) { suppressAutoJoinRef.current = false; setStudioError(error?.message || "Failed to release chart editing session."); } finally { setIsReleasingChart(false); } };
  const handleCertifyChartReady = async () => { if (!projectId || isCertifyingChart) return; setIsCertifyingChart(true); setStudioError(""); try { setChartContext(await updateForecastChartCompletionByProject(projectId, true)); } catch (error) { setStudioError(error?.message || "Failed to certify chart readiness."); } finally { setIsCertifyingChart(false); } };
  const handleReopenChartEdits = async () => { if (!projectId || isCertifyingChart) return; setIsCertifyingChart(true); setStudioError(""); try { setChartContext(await updateForecastChartCompletionByProject(projectId, false)); } catch (error) { setStudioError(error?.message || "Failed to reopen chart editing."); } finally { setIsCertifyingChart(false); } };

  const handleMapLoad = useMapLoader(projectId, logger, isDarkMode, setupFeaturesAndLayers, mapRef, cleanupRef, setDrawInstance, setMapLoaded, setSelectedPoint, setShowTitleModal, setLineCount, selectedToolRef, setCapturedImages, setIsLoading);
  const showMainUI = !isLoadingProject;
  const projectName = currentProject?.name || "No Project Selected";
  const isRevisionRequested = isProjectRevisionRequested(projectStatus);
  const projectStatusLabel = isRevisionRequested ? "Needs Revision" : getProjectStatusLabel(projectStatus);
  const projectStatusStyle = isRevisionRequested ? "border-amber-300 bg-amber-50 text-amber-800" : getProjectStatusStyle(projectStatus);
  const latestReviewRemarks = useMemo(() => getLatestReviewRemarks(currentProject), [currentProject]);
  const hasActiveReviewRemarks = isRevisionRequested && Boolean(latestReviewRemarks?.comment);
  const chartClaim = chartContext?.claim;
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

  return <div className={`relative h-screen w-full overflow-hidden ${isDarkMode ? "bg-slate-950" : "bg-slate-100"}`}><header className={`studio-liquid-panel absolute left-2 right-2 top-2 z-[120] flex h-14 items-center justify-between gap-2 rounded-2xl border px-2 shadow-2xl backdrop-blur-2xl sm:left-3 sm:right-3 sm:px-3 ${headerClass}`}><div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3"><Button variant="secondary" size="sm" icon={ArrowLeft} onClick={handleBackToLibrary} className={`!rounded-xl ${headerGhostButton}`}><span className="hidden sm:inline">Forecast Package</span><span className="sm:hidden">Package</span></Button><div className={`min-w-0 border-l pl-2 sm:pl-3 ${headerDivider}`}><p className={`hidden text-xs font-semibold uppercase tracking-[0.18em] sm:block ${headerMutedText}`}>WaveLab Studio</p><div className="flex min-w-0 items-center gap-2"><h1 className={`max-w-[32vw] truncate text-xs font-bold sm:max-w-[42vw] sm:text-sm ${headerStrongText}`}>{projectName}</h1>{currentProject?.status && <span className={`hidden shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-black lg:inline-flex ${projectStatusStyle}`}>{projectStatusLabel}</span>}</div></div></div><div className="flex shrink-0 items-center gap-1 sm:gap-2">{isReadOnlyProject && <span className={`hidden items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black xl:inline-flex ${isDarkMode ? "border-white/10 bg-slate-900 text-slate-300" : "border-slate-200 bg-slate-100 text-slate-600"}`}><Lock size={13} />{isPackageReadyReadOnly ? "Chart ready" : "Read-only"}</span>}{chartContext && !isLoadingChartContext && !chartContext.blockingChartType && isPackageChartReady && <span className={`studio-liquid-control hidden items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black xl:inline-flex ${isDarkMode ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200" : "border-emerald-200/80 bg-emerald-50/80 text-emerald-700"}`}><CheckCircle2 size={13} />Certified ready</span>}{chartContext && !isPackageChartReady && chartContext.blockingChartType && <span className={`studio-liquid-control hidden rounded-full border px-3 py-1 text-xs font-black xl:inline-flex ${isDarkMode ? "border-slate-700 bg-slate-900 text-slate-400" : "border-slate-200 bg-slate-100 text-slate-600"}`}>{blockingChartLabel} must be ready first</span>}{chartContext && !isPackageChartReady && !chartContext.blockingChartType && <div className={`studio-liquid-control hidden items-center gap-1 rounded-2xl border p-1 md:flex ${headerControlGroup}`}><span className={`px-2 text-[11px] font-black uppercase tracking-wide ${headerMutedText}`}>{chartLabel}</span>{chartClaim?.claimedByCurrentUser ? <><span className={`rounded-xl px-2 py-1 text-xs font-black ${isDarkMode ? "bg-emerald-400/12 text-emerald-200" : "bg-emerald-50 text-emerald-700"}`}>You are editing</span><Button variant="secondary" size="sm" onClick={handleReleaseChart} disabled={isChartActionBusy} className={`!rounded-xl ${headerGhostButton}`}>{isReleasingChart ? "Releasing…" : "Release"}</Button></> : chartClaim?.claimedByOtherUser ? <><span className={`rounded-xl px-2 py-1 text-xs font-black ${isDarkMode ? "bg-cyan-400/10 text-cyan-200" : "bg-blue-50 text-blue-700"}`}>{activeEditorText || "Others editing"}</span><Button variant="secondary" size="sm" onClick={handleClaimChart} disabled={isChartActionBusy || !chartClaim?.canClaim} className={`!rounded-xl ${headerGhostButton}`}>{isClaimingChart ? "Joining…" : "Join editing"}</Button></> : <Button variant="secondary" size="sm" onClick={handleClaimChart} disabled={isChartActionBusy || !chartClaim?.canClaim} className={`!rounded-xl ${headerPrimaryButton}`}>{isClaimingChart ? "Joining…" : "Join editing"}</Button>}<Button variant="secondary" size="sm" icon={CheckCircle2} onClick={handleCertifyChartReady} disabled={isChartActionBusy || !chartClaim?.canCertify} className={`!rounded-xl ${headerGhostButton}`}>Ready</Button></div>}{chartContext && isPackageChartReady && <Button variant="secondary" size="sm" onClick={handleReopenChartEdits} disabled={isChartActionBusy} className={`hidden !rounded-xl md:inline-flex ${headerGhostButton}`}>Reopen</Button>}<NotificationBell isDarkMode={isDarkMode} /><Button variant="secondary" size="sm" icon={isDarkMode ? Sun : Moon} onClick={handleToggleTheme} className={`!rounded-xl !px-2 ${headerGhostButton}`} aria-label="Toggle theme" /></div></header>{studioError && <div className="absolute left-1/2 top-[72px] z-[130] flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 shadow-xl"><AlertTriangle size={16} />{studioError}</div>}<div className="absolute inset-x-0 bottom-0 z-[2]" style={{ top: STUDIO_HEADER_HEIGHT }}><MapComponent onMapLoad={handleMapLoad} isDarkMode={isDarkMode} /></div>{showMainUI && <><DrawToolBar drawInstance={drawInstance} mapRef={mapRef} setType={setType} isCanvasActive={isCanvasActive} toggleCanvas={toggleCanvas} isFlagCanvasActive={isFlagCanvasActive} toggleFlagCanvas={toggleFlagCanvas} lineCount={lineCount} setLineCount={setLineCount} drawCounter={drawCounter} setDrawCounter={setDrawCounter} setClosedMode={setClosedMode} closedMode={closedMode} selectedToolRef={selectedToolRef} disabled={isReadOnlyProject} /><LayerPanel layers={layers} setLayers={setLayers} mapRef={mapRef} isDarkMode={isDarkMode} disabled={isReadOnlyProject} /><MapStatusBar mapRef={mapRef} isDarkMode={isDarkMode} /></>}{isLoading && <MapLoading isLoading message="Finalizing setup" />}{showTitleModal && <MarkerTitleModal markerTitle={markerTitle} handleTitleChange={handleTitleChange} handleSaveTitle={handleSaveTitle} closeModal={closeModal} markerType={type} />}{isCanvasActive && <Canvas mapRef={mapRef} isDarkMode={isDarkMode} />}{isFlagCanvasActive && <FlagCanvas mapRef={mapRef} isDarkMode={isDarkMode} />}{showNoProjectsModal && <NoProjectAlert message={message} onCreate={handleOpenCreateProject} onMaybeLater={handleMaybeLater} />}{showCreateProjectModal && <CreateProjectModal closeModal={() => setShowCreateProjectModal(false)} onCreate={(projectName) => handleCreateProject(projectName, (project) => { setCurrentProject(project); setShowCreateProjectModal(false); navigate(`/studio/${project._id || project.id}`); })} />}{isInactivityPromptVisible && <div className="absolute inset-0 z-[240] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"><div className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl ${isDarkMode ? "border-white/10 bg-slate-950 text-slate-100" : "border-white bg-white text-slate-900"}`}><p className="text-lg font-black">Workspace refresh needed</p><p className={`mt-2 text-sm font-semibold ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>We paused the automatic reload because a drawing panel or modal is open. Continue your work or refresh now to sync the latest project data.</p><div className="mt-5 flex justify-end gap-2"><Button variant="secondary" onClick={stayActive}>Keep working</Button><Button variant="primary" onClick={refreshWorkspace}>Refresh now</Button></div></div></div>}</div>;
};

export default Studio;
