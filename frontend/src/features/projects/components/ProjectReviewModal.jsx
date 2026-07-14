import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

import ReviewActionsFooter from '@/features/projects/components/review/ReviewActionsFooter';
import ReviewMapWorkspace from '@/features/projects/components/review/ReviewMapWorkspace';
import ReviewSidebar from '@/features/projects/components/review/ReviewSidebar';
import useProjectReviewActionHandlers from '@/features/projects/hooks/useProjectReviewActionHandlers';
import useProjectReviewActions from '@/features/projects/hooks/useProjectReviewActions';
import { normalizeFeatureCollection } from '@/features/projects/utils/normalizeFeatureCollection';
import { buildAnnotationDiff } from '@/features/projects/utils/projectAnnotationDiff';
import {
  formatDate,
  getEmbeddedCurrentFeatureSource,
  getOwner,
  getPreviousFeatureSource,
  getPreviousRemarks,
  getProjectId,
  getProjectName,
  getReviewer,
  getTimeline,
  mergeProjectState,
} from '@/features/projects/utils/projectReviewViewModel';
import { fetchProjectFeatureCollection } from '@/api/featureServices';
import { fetchAdminForecastPackage, startReviewProject } from '@/api/projectAPI';
import {
  getProjectStatusLabel,
  isProjectApproved,
  isProjectReviewable,
  isProjectUnderReview,
} from '@/features/projects/projectStatuses';

const EMPTY_REVIEW_QUEUE = Object.freeze([]);
const CHART_METADATA = {
  analysis: { code: 'ANL', label: 'Wave Analysis', horizon: 'Current state' },
  forecast_24h: { code: '+24H', label: '24h Wave Forecast', horizon: 'Day 1 outlook' },
  forecast_36h: { code: '+36H', label: '36h Wave Forecast', horizon: 'Extended outlook' },
  forecast_48h: { code: '+48H', label: '48h Wave Forecast', horizon: 'Day 2 outlook' },
};

const getChartMetadata = (project) => CHART_METADATA[project?.chartType || project?.type] || {
  code: 'CHT', label: project?.chartType || project?.type || 'Forecast Chart', horizon: 'Forecast chart',
};

function getStatusTone(status) {
  if (['Approved', 'Published'].includes(status)) return 'emerald';
  if (['Rejected', 'Revision Requested'].includes(status)) return 'rose';
  if (status === 'Under Review') return 'cyan';
  if (status === 'Submitted') return 'amber';
  return 'slate';
}

function getToneClasses(tone, isDarkMode) {
  const classes = {
    cyan: isDarkMode ? 'border-cyan-300/20 bg-cyan-300/10 text-cyan-100' : 'border-cyan-200 bg-cyan-50/85 text-cyan-700',
    amber: isDarkMode ? 'border-amber-300/20 bg-amber-300/10 text-amber-100' : 'border-amber-200 bg-amber-50/85 text-amber-700',
    emerald: isDarkMode ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100' : 'border-emerald-200 bg-emerald-50/85 text-emerald-700',
    rose: isDarkMode ? 'border-rose-300/20 bg-rose-300/10 text-rose-100' : 'border-rose-200 bg-rose-50/85 text-rose-700',
    slate: isDarkMode ? 'border-white/10 bg-white/[0.05] text-slate-300' : 'border-white/80 bg-white/65 text-slate-700',
  };
  return classes[tone] || classes.slate;
}

function GalleryButton({ direction, disabled, isDarkMode, onClick }) {
  const Icon = direction === 'previous' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`${direction === 'previous' ? 'Previous' : 'Next'} chart`}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border shadow-2xl backdrop-blur-2xl transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:scale-100 ${isDarkMode ? 'border-cyan-200/20 bg-slate-950/60 text-cyan-100 shadow-black/30 hover:bg-cyan-400/15' : 'border-white/80 bg-white/72 text-cyan-700 shadow-slate-900/15 hover:bg-cyan-50/90'}`}
    >
      <Icon size={24} />
    </button>
  );
}

export default function ProjectReviewModal({ project, reviewQueue = EMPTY_REVIEW_QUEUE, isDarkMode = false, onClose, onSelectProject, onApprove, onReject, onNoPublication, onPublish, onActionComplete }) {
  const lastProjectIdRef = useRef(getProjectId(project));
  const [currentProject, setCurrentProject] = useState(project);
  const [currentFeatureCollection, setCurrentFeatureCollection] = useState(() => normalizeFeatureCollection(getEmbeddedCurrentFeatureSource(project)));
  const [isLoadingCurrentFeatures, setIsLoadingCurrentFeatures] = useState(false);
  const [featureLoadError, setFeatureLoadError] = useState('');
  const [remarks, setRemarks] = useState('');
  const [mapMode, setMapMode] = useState('preview');
  const [autoReviewQueue, setAutoReviewQueue] = useState([]);
  const [isSwitchingProject, setIsSwitchingProject] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  useEffect(() => {
    const incomingProjectId = getProjectId(project);
    const sameProject = lastProjectIdRef.current === incomingProjectId;
    const embedded = normalizeFeatureCollection(getEmbeddedCurrentFeatureSource(project));
    setCurrentProject((previous) => sameProject ? mergeProjectState(previous, project) : project);
    if (!sameProject || embedded.features.length > 0) setCurrentFeatureCollection(embedded);
    lastProjectIdRef.current = incomingProjectId;
    setFeatureLoadError('');
    setRemarks('');
  }, [project]);

  const projectId = getProjectId(currentProject);
  const providedQueue = Array.isArray(reviewQueue) ? reviewQueue : EMPTY_REVIEW_QUEUE;
  const providedQueueKey = providedQueue.map(getProjectId).filter(Boolean).join('|');

  useEffect(() => {
    let mounted = true;
    setAutoReviewQueue([]);
    if (!projectId || providedQueue.length > 1) return undefined;
    fetchAdminForecastPackage(projectId)
      .then((response) => {
        const packageProjects = Array.isArray(response?.projects) ? response.projects : [];
        if (mounted && packageProjects.length > 1) setAutoReviewQueue(packageProjects);
      })
      .catch((error) => mounted && console.error('[ProjectReviewModal] Failed to load review package queue:', error));
    return () => { mounted = false; };
  }, [projectId, providedQueueKey]);

  const effectiveQueue = useMemo(() => providedQueue.length > 1 ? providedQueue : autoReviewQueue, [autoReviewQueue, providedQueueKey]);
  const gallery = useMemo(() => {
    const index = effectiveQueue.findIndex((candidate) => getProjectId(candidate) === projectId);
    return {
      previousProject: index > 0 ? effectiveQueue[index - 1] : null,
      nextProject: index >= 0 && index < effectiveQueue.length - 1 ? effectiveQueue[index + 1] : null,
      currentNumber: index >= 0 ? index + 1 : 1,
      total: Math.max(effectiveQueue.length, 1),
    };
  }, [projectId, effectiveQueue]);

  const canMoveGallery = effectiveQueue.length > 1;
  const selectGalleryProject = async (targetProject) => {
    if (!targetProject || !canMoveGallery || isSwitchingProject) return;
    setIsSwitchingProject(true);
    try {
      const targetId = getProjectId(targetProject);
      const startedProject = targetProject?.status === 'Submitted' && targetId
        ? await startReviewProject(targetId)
        : targetProject;
      const nextProject = {
        ...targetProject,
        ...startedProject,
        status: startedProject?.status || (targetProject.status === 'Submitted' ? 'Under Review' : targetProject.status),
      };
      if (onSelectProject) onSelectProject(nextProject);
      else setCurrentProject(nextProject);
    } catch (error) {
      console.error('[ProjectReviewModal] Failed to open chart for review:', error);
      setFeatureLoadError(error?.message || 'Failed to start review for this chart.');
    } finally {
      setIsSwitchingProject(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    if (!projectId) return undefined;
    setIsLoadingCurrentFeatures(true);
    setFeatureLoadError('');
    fetchProjectFeatureCollection(projectId)
      .then((collection) => mounted && setCurrentFeatureCollection(normalizeFeatureCollection(collection)))
      .catch((error) => {
        if (!mounted) return;
        console.error('[ProjectReviewModal] Failed to load current annotations:', error);
        setFeatureLoadError(error?.message || 'Failed to load current annotations.');
      })
      .finally(() => mounted && setIsLoadingCurrentFeatures(false));
    return () => { mounted = false; };
  }, [projectId]);

  const hasRemarks = remarks.trim().length > 0;
  const statusLabel = getProjectStatusLabel(currentProject?.status);
  const chartMetadata = getChartMetadata(currentProject);
  const statusTone = getStatusTone(currentProject?.status);
  const isReviewable = isProjectReviewable(currentProject?.status);
  const isUnderReview = isProjectUnderReview(currentProject?.status);
  const isApproved = isProjectApproved(currentProject?.status);
  const currentFeatureSource = currentFeatureCollection;
  const diff = buildAnnotationDiff(getPreviousFeatureSource(currentProject), currentFeatureSource);

  const { busyAction, actionError, clearActionError, runAction } = useProjectReviewActions({
    currentProject, remarks, hasRemarks, setCurrentProject, setRemarks, onActionComplete,
    onActionSuccess: ({ key }) => {
      if (key !== 'approve') return true;
      if (gallery.nextProject) void selectGalleryProject(gallery.nextProject);
      return false;
    },
    onClose,
  });
  const handlers = useProjectReviewActionHandlers({ projectId, currentProject, remarks, runAction, onApprove, onReject, onNoPublication, onPublish });
  const canUseGallery = !busyAction && !isSwitchingProject && canMoveGallery;
  const isPackageReview = gallery.total > 1;
  const muted = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  if (!currentProject) return null;

  const modal = (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center overflow-hidden p-2 backdrop-blur-xl sm:p-4 ${isDarkMode ? 'bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,.13),transparent_38%),rgba(1,10,24,.80)]' : 'bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,.16),transparent_40%),rgba(226,240,248,.74)]'}`} role="dialog" aria-modal="true" aria-label="Forecast chart review">
      <div className="pointer-events-none fixed inset-y-0 left-3 right-3 z-[220] flex items-center justify-between sm:left-6 sm:right-6">
        <div className="pointer-events-auto"><GalleryButton direction="previous" disabled={!gallery.previousProject || !canUseGallery} isDarkMode={isDarkMode} onClick={() => void selectGalleryProject(gallery.previousProject)} /></div>
        <div className="pointer-events-auto"><GalleryButton direction="next" disabled={!gallery.nextProject || !canUseGallery} isDarkMode={isDarkMode} onClick={() => void selectGalleryProject(gallery.nextProject)} /></div>
      </div>

      <div className={`relative z-[210] flex h-[min(94vh,940px)] w-full max-w-[1480px] flex-col overflow-hidden rounded-2xl border shadow-2xl ring-1 backdrop-blur-3xl ${isDarkMode ? 'border-cyan-200/15 bg-[#06182b]/88 text-slate-100 shadow-black/50 ring-white/[0.06]' : 'border-white/80 bg-white/76 text-slate-950 shadow-slate-900/20 ring-slate-900/[0.05]'}`}>
        <header className={`relative flex shrink-0 items-center justify-between gap-4 border-b px-4 py-3 backdrop-blur-2xl sm:px-5 ${isDarkMode ? 'border-white/10 bg-slate-950/32' : 'border-white/70 bg-white/44'}`}>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-black tracking-[0.14em] ${isDarkMode ? 'bg-slate-950/55 text-cyan-200 ring-1 ring-white/10' : 'bg-cyan-50/80 text-cyan-700 ring-1 ring-cyan-100'}`}>{chartMetadata.code}</span>
              <h2 className={`truncate text-lg font-black sm:text-xl ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{chartMetadata.label}</h2>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${getToneClasses(statusTone, isDarkMode)}`}>{statusLabel}</span>
              <span className={`${isDarkMode ? 'border-white/10 bg-white/[0.05] text-slate-300' : 'border-white/80 bg-white/65 text-slate-600'} rounded-full border px-2.5 py-1 text-[10px] font-black`}>Chart {gallery.currentNumber} of {gallery.total}</span>
            </div>
            <p className={`mt-1 truncate text-xs font-semibold ${muted}`} title={getProjectName(currentProject)}>
              {chartMetadata.horizon} · {getProjectName(currentProject)} · {getOwner(currentProject)} · Forecast {formatDate(currentProject.forecastDate)}
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={Boolean(busyAction) || isSwitchingProject} className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition disabled:opacity-50 ${isDarkMode ? 'border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white' : 'border-white/80 bg-white/62 text-slate-500 hover:bg-white/90 hover:text-slate-900'}`} aria-label="Close review modal"><X size={20} /></button>
        </header>

        <div className="relative grid min-h-0 flex-1 overflow-y-auto xl:grid-cols-[minmax(0,1fr)_360px] xl:overflow-hidden">
          <ReviewMapWorkspace projectId={projectId} currentFeatureSource={currentFeatureSource} diff={diff} mapMode={mapMode} onMapModeChange={setMapMode} isLoadingCurrentFeatures={isLoadingCurrentFeatures || isSwitchingProject} featureLoadError={featureLoadError} isDarkMode={isDarkMode} />
          <aside className={`min-h-0 border-t backdrop-blur-2xl xl:flex xl:flex-col xl:border-l xl:border-t-0 ${isDarkMode ? 'border-white/10 bg-slate-950/30' : 'border-white/70 bg-white/38'}`}>
            <ReviewSidebar project={currentProject} statusLabel={statusLabel} diff={diff} remarks={remarks} onRemarksChange={setRemarks} isReviewable={isReviewable} busyAction={busyAction || isSwitchingProject} reviewer={getReviewer(currentProject)} previousRemarks={getPreviousRemarks(currentProject)} timeline={getTimeline(currentProject)} isDarkMode={isDarkMode} />
            <ReviewActionsFooter isReviewable={isReviewable} isUnderReview={isUnderReview} isApproved={isApproved} hasRemarks={hasRemarks} busyAction={busyAction || (isSwitchingProject ? 'switching' : null)} actionError={actionError} onClearActionError={clearActionError} isDarkMode={isDarkMode} {...handlers} onPublish={isPackageReview ? undefined : handlers.onPublish} onClose={onClose} />
          </aside>
        </div>
      </div>
    </div>
  );

  return typeof document === 'undefined' ? modal : createPortal(modal, document.body);
}
