import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, CheckCircle2, Lock, Moon, Sun, X } from "lucide-react";

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
import socket from "@/socket/socketClient";
import { savePointFeature } from "@dashboards/forecaster/utils/ToolBarUtils";
import { handleCreateProject } from "@dashboards/forecaster/utils/ProjectUtils";
import { saveMarker } from "@dashboards/forecaster/map/layers/markerLayer";

const TOOLBAR_DELAY = 1000;

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

function getDisplayName(user) {
  if (!user || typeof user === "string") return "";
  return [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.username || user.email || "";
}

function getErrorMessage(error, fallback) {
  return error?.message || fallback || "The action could not be completed.";
}

function formatNameList(names = []) {
  if (!names.length) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`;
}

function getTimeValue(value) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(date);
}

function getContextProject(context) {
  return context?.chart?.project && typeof context.chart.project === "object"
    ? context.chart.project
    : null;
}

function getRevisionFeedback({ chartContext, currentProject, isRevisionRequested }) {
  if (!isRevisionRequested) return null;

  const reviewComment = currentProject?.reviewComment || chartContext?.package?.reviewComment || "";
  const reviewedAt = currentProject?.reviewedAt || chartContext?.package?.reviewedAt || "";
  const reviewer = getDisplayName(currentProject?.rejectedBy || chartContext?.package?.rejectedBy);
  const completedAt = chartContext?.completion?.completedAt || chartContext?.chart?.readyAt || "";
  const completedBy = getDisplayName(chartContext?.completion?.completedBy || chartContext?.chart?.readyBy);
  const reviewTime = getTimeValue(reviewedAt);
  const completionTime = getTimeValue(completedAt);
  const resolved = Boolean(reviewTime && completionTime && completionTime > reviewTime);

  if (!reviewComment && !reviewedAt) return null;

  return {
    reviewComment,
    reviewedAt,
    reviewer,
    completedAt,
    completedBy,
    resolved,
  };
}

function RevisionFeedbackPanel({ feedback, isDarkMode }) {
  if (!feedback) return null;

  const panelClass = feedback.resolved
    ? isDarkMode ? "border-emerald-300/25 bg-emerald-950/80 text-emerald-100" : "border-emerald-200 bg-emerald-50 text-emerald-900"
    : isDarkMode ? "border-amber-300/30 bg-amber-950/85 text-amber-100" : "border-amber-200 bg-amber-50 text-amber-900";
  const mutedClass = isDarkMode ? "text-white/65" : "text-slate-600";

  return (
    <div className={`absolute left-1/2 top-[4.5rem] z-[125] w-[min(760px,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl ${panelClass}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.16em]">Admin feedback</p>
          <p className="mt-1 text-sm font-bold leading-5">{feedback.reviewComment || "Revision requested. Please review the chart and apply the requested changes."}</p>
          <p className={`mt-2 text-[11px] font-semibold ${mutedClass}`}>
            {feedback.reviewer ? `Requested by ${feedback.reviewer}` : "Revision requested"}
            {feedback.reviewedAt ? ` · ${formatDateTime(feedback.reviewedAt)}` : ""}
          </p>
        </div>
        <div className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-black ${isDarkMode ? "border-white/10 bg-white/10" : "border-white/80 bg-white/70"}`}>
          {feedback.resolved ? "Re-certified" : "Action required"}
          {feedback.resolved && feedback.completedAt ? (
            <p className={`mt-1 text-[10px] font-semibold ${mutedClass}`}>
              {feedback.completedBy ? `${feedback.completedBy} · ` : ""}{formatDateTime(feedback.completedAt)}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function WorkflowErrorModal({ error, isDarkMode, onClose }) {
  if (!error) return null;

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="studio-workflow-error-title">
      <div className={`w-full max-w-lg overflow-hidden rounded-3xl border shadow-2xl ${isDarkMode ? "border-red-300/20 bg-slate-950 text-slate-100" : "border-red-200 bg-white text-slate-950"}`}>
        <div className={`flex items-start justify-between gap-4 border-b p-5 ${isDarkMode ? "border-white/10" : "border-slate-100"}`}>
          <div className="flex gap-3">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${isDarkMode ? "bg-red-500/15 text-red-200" : "bg-red-50 text-red-600"}`}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <h2 id="studio-workflow-error-title" className="text-lg font-black">{error.title || "Action blocked"}</h2>
              <p className={`mt-1 text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>Please resolve this before continuing.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${isDarkMode ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10" : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"}`} aria-label="Close error dialog">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <div className={`rounded-2xl border p-4 text-sm font-bold leading-6 ${isDarkMode ? "border-red-300/20 bg-red-950/35 text-red-100" : "border-red-100 bg-red-50 text-red-800"}`}>
            {error.message}
          </div>
          {error.detail && <p className={`text-sm leading-6 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>{error.detail}</p>}
          <div className="flex justify-end">
            <Button onClick={onClose}>Got it</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReadyConfirmModal({ open, isDarkMode, chartLabel, claim, isBusy, onCancel, onConfirm }) {
  if (!open) return null;

  const readyEditors = claim?.readyEditorLabels || [];
  const participants = claim?.participantLabels || [];
  const readyText = readyEditors.length ? formatNameList(readyEditors) : "No one has marked ready yet";
  const participantText = participants.length ? formatNameList(participants) : "Only you are participating";

  return (
    <div className="fixed inset-0 z-[215] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="studio-ready-confirm-title">
      <div className={`w-full max-w-lg overflow-hidden rounded-3xl border shadow-2xl ${isDarkMode ? "border-cyan-300/20 bg-slate-950 text-slate-100" : "border-blue-100 bg-white text-slate-950"}`}>
        <div className={`border-b p-5 ${isDarkMode ? "border-white/10" : "border-slate-100"}`}>
          <p className={`text-xs font-black uppercase tracking-[0.16em] ${isDarkMode ? "text-cyan-200" : "text-blue-700"}`}>Confirm readiness</p>
          <h2 id="studio-ready-confirm-title" className="mt-2 text-xl font-black">Certify {chartLabel}?</h2>
          <p className={`mt-2 text-sm leading-6 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>Use this only after you opened the chart in Studio, applied your changes, and checked the forecast layers.</p>
        </div>
        <div className="space-y-3 p-5">
          <div className={`rounded-2xl border p-4 text-sm ${isDarkMode ? "border-white/10 bg-white/[0.04]" : "border-slate-100 bg-slate-50"}`}>
            <p className="font-black">Participants</p>
            <p className={`mt-1 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>{participantText}</p>
          </div>
          <div className={`rounded-2xl border p-4 text-sm ${isDarkMode ? "border-white/10 bg-white/[0.04]" : "border-slate-100 bg-slate-50"}`}>
            <p className="font-black">Already certified</p>
            <p className={`mt-1 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>{readyText}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={onCancel} disabled={isBusy}>Cancel</Button>
            <Button icon={CheckCircle2} onClick={onConfirm} loading={isBusy} disabled={isBusy}>Confirm ready</Button>
          </div>
        </div>
      </div>
    </div>
  );
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
  const [workflowError, setWorkflowError] = useState(null);
  const [showReadyConfirm, setShowReadyConfirm] = useState(false);

  useEffect(() => { suppressAutoJoinRef.current = false; }, [projectId]);
  useEffect(() => { setCurrentProject(latestProject || null); }, [latestProject]);

  const handleOpenCreateProject = () => { setStudioError(""); setWorkflowError(null); setShowNoProjectsModal(false); setShowCreateProjectModal(true); };
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
  const isBlockingWorkspaceModalOpen = showTitleModal || showCreateProjectModal || showNoProjectsModal || isCanvasActive || isFlagCanvasActive || Boolean(workflowError) || showReadyConfirm;
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
    const loadedStatus = currentProject?.status || latestProject?.status;
    const canAutoJoinCurrentChart = canEditProjectStatus(loadedStatus);
    const shouldAutoJoin = Boolean((autoJoin ?? !suppressAutoJoinRef.current) && canAutoJoinCurrentChart);
    if (!silent) setIsLoadingChartContext(true);
    try {
      const context = await fetchForecastPackageChartContextByProject(projectId, { signal, autoJoin: shouldAutoJoin });
      applyChartContext(context);
    } catch (error) {
      if (error?.name === "AbortError") return;
      if (isContextNotFound(error)) { setChartContext(null); return; }
      console.error("Failed to load forecast package chart context:", error);
      setStudioError(getErrorMessage(error, "Failed to load forecast package chart workflow."));
    } finally {
      if (!silent) setIsLoadingChartContext(false);
    }
  }, [projectId, applyChartContext, currentProject?.status, latestProject?.status]);

  useEffect(() => { document.title = currentProject?.name ? `${currentProject.name}` : "WaveLab - Studio"; }, [currentProject?.name]);
  useEffect(() => { setLayersRef.current = setLayers; }, [setLayers]);
  useEffect(() => {
    if (!projectId) return undefined;
    const joinRoom = () => socket.emit("forecast:join_project", projectId);
    if (socket.connected) joinRoom();
    socket.on("connect", joinRoom);
    return () => {
      socket.off("connect", joinRoom);
      socket.emit("forecast:leave_project", projectId);
    };
  }, [projectId]);
  useEffect(() => {
    setIsLoading(true); setMapLoaded(false); setShowToolbar(false); setCapturedImages({ light: null, dark: null });
    setDrawInstance(null); setLineCount(0); setDrawCounter(0); setClosedMode(false); setSelectedPoint(null); setShowTitleModal(false);
    markerTitleRef.current = ""; selectedToolRef.current = null; setStudioError(""); setWorkflowError(null); setShowReadyConfirm(false);
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

  const handleClaimChart = async () => {
    if (!projectId || isClaimingChart || !canEditProject) return;
    setIsClaimingChart(true); suppressAutoJoinRef.current = false; setStudioError(""); setWorkflowError(null);
    try { const context = await claimForecastPackageChartByProject(projectId); applyChartContext(context); }
    catch (error) { setWorkflowError({ title: "Cannot join chart", message: getErrorMessage(error, "Failed to join chart editing."), detail: "Refresh the workspace or check if another forecaster is already editing this chart." }); }
    finally { setIsClaimingChart(false); }
  };

  const handleReleaseChart = async () => {
    if (!projectId || isReleasingChart || !canEditProject) return;
    setIsReleasingChart(true); suppressAutoJoinRef.current = true; setStudioError(""); setWorkflowError(null);
    try { const context = await releaseForecastPackageChartByProject(projectId); applyChartContext(context); }
    catch (error) { suppressAutoJoinRef.current = false; setWorkflowError({ title: "Cannot release chart", message: getErrorMessage(error, "Failed to release chart editing session."), detail: "Refresh the workspace and try releasing the chart again." }); }
    finally { setIsReleasingChart(false); }
  };

  const executeCertifyChartReady = async () => {
    if (!projectId || isCertifyingChart || !canEditProject) return;
    setIsCertifyingChart(true); setStudioError(""); setWorkflowError(null);
    try { const context = await updateForecastChartCompletionByProject(projectId, true); setShowReadyConfirm(false); applyChartContext(context); }
    catch (error) { setShowReadyConfirm(false); setWorkflowError({ title: "Cannot certify chart ready", message: getErrorMessage(error, "Failed to certify chart readiness."), detail: "All active editors must release or complete their participation before this chart can be certified ready." }); }
    finally { setIsCertifyingChart(false); }
  };

  const handleCertifyChartReady = () => {
    if (!projectId || isCertifyingChart || !canEditProject) return;
    setWorkflowError(null);
    setShowReadyConfirm(true);
  };

  const handleReopenChartEdits = async () => {
    if (!projectId || isCertifyingChart || !canEditProjectStatus(projectStatus)) return;
    setIsCertifyingChart(true); setStudioError(""); setWorkflowError(null);
    try { const context = await updateForecastChartCompletionByProject(projectId, false); applyChartContext(context); }
    catch (error) { setWorkflowError({ title: "Cannot reopen chart", message: getErrorMessage(error, "Failed to reopen chart editing."), detail: "Refresh the workspace and try reopening the chart again." }); }
    finally { setIsCertifyingChart(false); }
  };

  const handleMapLoad = useMapLoader(projectId, logger, isDarkMode, setupFeaturesAndLayers, mapRef, cleanupRef, setDrawInstance, setMapLoaded, setSelectedPoint, setShowTitleModal, setLineCount, selectedToolRef, setCapturedImages, setIsLoading);
  const showMainUI = !isLoadingProject;
  const projectName = currentProject?.name || "No Project Selected";
  const isRevisionRequested = isProjectRevisionRequested(projectStatus);
  const projectStatusLabel = isRevisionRequested ? "Needs Revision" : getProjectStatusLabel(projectStatus);
  const projectStatusStyle = isRevisionRequested ? "border-amber-300 bg-amber-50 text-amber-800" : getProjectStatusStyle(projectStatus);
  const revisionFeedback = getRevisionFeedback({ chartContext, currentProject, isRevisionRequested });
  const chartType = chartContext?.chartType;
  const chartLabel = getChartLabel(chartType);
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
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">{isReadOnlyProject && <span className={`hidden items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black xl:inline-flex ${isDarkMode ? "border-white/10 bg-slate-900 text-slate-300" : "border-slate-200 bg-slate-100 text-slate-700"}`}><Lock size={13} />{isPackageReadyReadOnly ? "Ready" : projectStatusLabel || "View only"}</span>}{chartContext && <div className={`hidden items-center gap-2 rounded-2xl border px-3 py-1.5 text-xs font-black lg:flex ${headerControlGroup}`}><span className={isDarkMode ? "text-cyan-200" : "text-blue-700"}>{chartLabel}</span>{!canEditProject ? <span className={headerMutedText}>View only</span> : chartClaim?.claimedByCurrentUser ? <span className="text-emerald-300">You are editing</span> : chartClaim?.claimedByOtherUser ? <span className="text-amber-300">Editing: {activeEditorText}</span> : <span className={headerMutedText}>Available</span>}{canEditProject && chartClaim?.canRelease && <Button size="sm" variant="secondary" onClick={handleReleaseChart} loading={isReleasingChart} disabled={isChartActionBusy} className={`!h-8 !rounded-xl ${headerGhostButton}`}>Release</Button>}{canEditProject && chartClaim?.canClaim && <Button size="sm" onClick={handleClaimChart} loading={isClaimingChart} disabled={isChartActionBusy} className={`!h-8 !rounded-xl ${headerPrimaryButton}`}>Join</Button>}{canEditProject && chartClaim?.canCertify && <Button size="sm" variant="secondary" icon={CheckCircle2} onClick={handleCertifyChartReady} loading={isCertifyingChart} disabled={isChartActionBusy} className={`!h-8 !rounded-xl ${headerGhostButton}`}>Ready</Button>}{isPackageChartReady && canEditProjectStatus(projectStatus) && <Button size="sm" variant="secondary" onClick={handleReopenChartEdits} loading={isCertifyingChart} disabled={isChartActionBusy} className={`!h-8 !rounded-xl ${headerGhostButton}`}>Reopen</Button>}</div>}<NotificationBell /><button onClick={handleToggleTheme} className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 hover:scale-105 ${headerControlGroup}`} aria-label="Toggle theme">{isDarkMode ? <Sun size={16} /> : <Moon size={16} />}</button></div>
      </header>

      <RevisionFeedbackPanel feedback={revisionFeedback} isDarkMode={isDarkMode} />
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
      <ReadyConfirmModal open={showReadyConfirm} isDarkMode={isDarkMode} chartLabel={chartLabel} claim={chartClaim} isBusy={isCertifyingChart} onCancel={() => setShowReadyConfirm(false)} onConfirm={executeCertifyChartReady} />
      <WorkflowErrorModal error={workflowError} isDarkMode={isDarkMode} onClose={() => setWorkflowError(null)} />
      {isInactivityPromptVisible && <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm"><div className={`max-w-md rounded-3xl border p-6 text-center shadow-2xl ${isDarkMode ? "border-white/10 bg-slate-900 text-slate-100" : "border-slate-200 bg-white text-slate-900"}`}><h2 className="text-xl font-black">Workspace paused for inactivity</h2><p className={`mt-2 text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>Refresh the workspace to continue with the latest forecast data, or stay active if you are still editing.</p><div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center"><Button onClick={refreshWorkspace}>Refresh workspace</Button><Button variant="secondary" onClick={stayActive}>Stay active</Button></div></div></div>}
    </div>
  );
};

export default Studio;
