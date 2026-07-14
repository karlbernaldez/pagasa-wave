import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, X } from 'lucide-react';

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
import { fetchAdminForecastPackage } from '@/api/projectAPI';
import {
  getProjectStatusLabel,
  isProjectApproved,
  isProjectReviewable,
  isProjectUnderReview,
} from '@/features/projects/projectStatuses';

const EMPTY_REVIEW_QUEUE = Object.freeze([]);
const CHART_METADATA = {
  analysis: {
    code: 'ANL',
    label: 'Wave Analysis',
    horizon: 'Current state',
    mandate: 'Establish observed sea-state baseline and active wave systems.',
  },
  forecast_24h: {
    code: '+24H',
    label: '24h Wave Forecast',
    horizon: 'Day 1 outlook',
    mandate: 'Prepare near-term operational guidance for the next 24 hours.',
  },
  forecast_36h: {
    code: '+36H',
    label: '36h Wave Forecast',
    horizon: 'Extended outlook',
    mandate: 'Extend the forecast package through the intermediate marine window.',
  },
  forecast_48h: {
    code: '+48H',
    label: '48h Wave Forecast',
    horizon: 'Day 2 outlook',
    mandate: 'Finalize the two-day operational forecast horizon.',
  },
};

function getQueueProjectId(project) {
  return getProjectId(project);
}

function getChartType(project) {
  return project?.chartType || project?.type || '';
}

function getChartMetadata(project) {
  const chartType = getChartType(project);
  return CHART_METADATA[chartType] || {
    code: 'CHT',
    label: chartType || 'Forecast Chart',
    horizon: 'Forecast chart',
    mandate: 'Review this forecast chart before package approval.',
  };
}

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
    slate: isDarkMode ? 'border-white/10 bg-white/[0.05] text-slate-300' : 'border-slate-200/80 bg-white/65 text-slate-700',
  };

  return classes[tone] || classes.slate;
}

function GalleryButton({ direction, disabled, isDarkMode, onClick }) {
  const Icon = direction === 'previous' ? ChevronLeft : ChevronRight;
  const label = direction === 'previous' ? 'Previous chart' : 'Next chart';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border shadow-2xl backdrop-blur-2xl transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100 sm:h-14 sm:w-14 ${
        isDarkMode
          ? 'border-cyan-200/20 bg-slate-950/65 text-cyan-100 shadow-black/30 ring-1 ring-white/[0.04] hover:border-cyan-200/40 hover:bg-cyan-400/15'
          : 'border-white/80 bg-white/72 text-cyan-700 shadow-slate-900/15 ring-1 ring-slate-900/[0.04] hover:border-cyan-200 hover:bg-cyan-50/90'
      }`}
    >
      <Icon size={26} />
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

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const incomingProjectId = getProjectId(project);
    const isSameProject = lastProjectIdRef.current === incomingProjectId;
    const embeddedFeatureCollection = normalizeFeatureCollection(getEmbeddedCurrentFeatureSource(project));
    const hasEmbeddedFeatures = embeddedFeatureCollection.features.length > 0;

    setCurrentProject((previousProject) => (
      isSameProject ? mergeProjectState(previousProject, project) : project
    ));

    if (!isSameProject || hasEmbeddedFeatures) {
      setCurrentFeatureCollection(embeddedFeatureCollection);
    }

    lastProjectIdRef.current = incomingProjectId;
    setFeatureLoadError('');
    setRemarks('');
  }, [project]);

  const projectId = getProjectId(currentProject);
  const providedReviewQueue = Array.isArray(reviewQueue) ? reviewQueue : EMPTY_REVIEW_QUEUE;
  const providedReviewQueueKey = providedReviewQueue.map((candidate) => getQueueProjectId(candidate)).filter(Boolean).join('|');

  useEffect(() => {
    let isMounted = true;

    setAutoReviewQueue([]);

    if (!projectId || providedReviewQueue.length > 1) return undefined;

    fetchAdminForecastPackage(projectId)
      .then((packageResponse) => {
        if (!isMounted) return;
        const packageProjects = Array.isArray(packageResponse?.projects) ? packageResponse.projects : [];
        if (packageProjects.length > 1) setAutoReviewQueue(packageProjects);
      })
      .catch((error) => {
        if (isMounted) console.error('[ProjectReviewModal] Failed to load review package queue:', error);
      });

    return () => {
      isMounted = false;
    };
  }, [projectId, providedReviewQueueKey]);

  const effectiveReviewQueue = useMemo(() => (
    providedReviewQueue.length > 1 ? providedReviewQueue : autoReviewQueue
  ), [autoReviewQueue, providedReviewQueueKey]);

  const gallery = useMemo(() => {
    const queue = Array.isArray(effectiveReviewQueue) ? effectiveReviewQueue : [];
    const index = queue.findIndex((candidate) => getQueueProjectId(candidate) === projectId);

    return {
      previousProject: index > 0 ? queue[index - 1] : null,
      nextProject: index >= 0 && index < queue.length - 1 ? queue[index + 1] : null,
      currentNumber: index >= 0 ? index + 1 : 1,
      total: Math.max(queue.length, 1),
    };
  }, [projectId, effectiveReviewQueue]);

  const canMoveGallery = Boolean(effectiveReviewQueue.length > 1);
  const selectGalleryProject = (targetProject) => {
    if (!targetProject || !canMoveGallery) return;
    if (onSelectProject) {
      onSelectProject(targetProject);
      return;
    }
    setCurrentProject(targetProject);
  };

  useEffect(() => {
    let isMounted = true;

    if (!projectId) return undefined;

    setIsLoadingCurrentFeatures(true);
    setFeatureLoadError('');

    fetchProjectFeatureCollection(projectId)
      .then((featureCollection) => {
        if (!isMounted) return;
        setCurrentFeatureCollection(normalizeFeatureCollection(featureCollection));
      })
      .catch((error) => {
        if (!isMounted) return;
        console.error('[ProjectReviewModal] Failed to load current annotations:', error);
        setFeatureLoadError(error?.message || 'Failed to load current annotations.');
      })
      .finally(() => {
        if (isMounted) setIsLoadingCurrentFeatures(false);
      });

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  const hasRemarks = remarks.trim().length > 0;
  const handleActionSuccess = ({ key }) => {
    if (key !== 'approve') return true;
    if (gallery.nextProject) selectGalleryProject(gallery.nextProject);
    return false;
  };
  const { busyAction, actionError, clearActionError, runAction } = useProjectReviewActions({
    currentProject,
    remarks,
    hasRemarks,
    setCurrentProject,
    setRemarks,
    onActionComplete,
    onActionSuccess: handleActionSuccess,
    onClose,
  });
  const reviewActionHandlers = useProjectReviewActionHandlers({
    projectId,
    currentProject,
    remarks,
    runAction,
    onApprove,
    onReject,
    onNoPublication,
    onPublish,
  });

  if (!currentProject) return null;

  const statusLabel = getProjectStatusLabel(currentProject?.status);
  const chartMetadata = getChartMetadata(currentProject);
  const statusTone = getStatusTone(currentProject?.status);
  const isReviewable = isProjectReviewable(currentProject?.status);
  const isUnderReview = isProjectUnderReview(currentProject?.status);
  const isApproved = isProjectApproved(currentProject?.status);
  const timeline = getTimeline(currentProject);
  const previousRemarks = getPreviousRemarks(currentProject);
  const reviewer = getReviewer(currentProject);
  const previousFeatureSource = getPreviousFeatureSource(currentProject);
  const currentFeatureSource = currentFeatureCollection;
  const diff = buildAnnotationDiff(previousFeatureSource, currentFeatureSource);

  const surface = isDarkMode
    ? 'border-cyan-200/15 bg-[#06182b]/88 text-slate-100 shadow-black/50 ring-white/[0.06]'
    : 'border-white/80 bg-white/76 text-slate-950 shadow-slate-900/20 ring-slate-900/[0.05]';
  const mutedText = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const canUseGalleryControls = !busyAction && canMoveGallery;

  const modal = (
    <div
      className={`fixed inset-0 z-[200] flex items-stretch justify-center overflow-hidden p-2 backdrop-blur-xl sm:p-4 xl:items-center xl:p-6 ${
        isDarkMode
          ? 'bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,.14),transparent_38%),rgba(1,10,24,.78)]'
          : 'bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,.16),transparent_40%),rgba(226,240,248,.72)]'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Forecast chart review"
    >
      <div className="pointer-events-none fixed inset-y-0 left-3 right-3 z-[220] flex items-center justify-between sm:left-6 sm:right-6 xl:left-10 xl:right-10">
        <div className="pointer-events-auto">
          <GalleryButton direction="previous" disabled={!gallery.previousProject || !canUseGalleryControls} isDarkMode={isDarkMode} onClick={() => selectGalleryProject(gallery.previousProject)} />
        </div>
        <div className="pointer-events-auto">
          <GalleryButton direction="next" disabled={!gallery.nextProject || !canUseGalleryControls} isDarkMode={isDarkMode} onClick={() => selectGalleryProject(gallery.nextProject)} />
        </div>
      </div>

      <div className={`relative z-[210] flex h-full w-full max-w-[1480px] flex-col overflow-hidden rounded-2xl border shadow-2xl ring-1 backdrop-blur-3xl sm:h-[min(94vh,940px)] ${surface}`}>
        <div className={`pointer-events-none absolute inset-x-0 top-0 h-32 ${isDarkMode ? 'bg-gradient-to-b from-cyan-300/[0.06] to-transparent' : 'bg-gradient-to-b from-white/80 to-transparent'}`} aria-hidden="true" />

        <header className={`relative flex shrink-0 items-start justify-between gap-3 border-b px-4 py-3 backdrop-blur-2xl sm:gap-4 sm:px-6 sm:py-4 ${
          isDarkMode ? 'border-white/10 bg-slate-950/38' : 'border-white/70 bg-white/46'
        }`}>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className={`text-[10px] font-black uppercase tracking-[0.18em] sm:text-xs ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>Forecast Chart Review</p>
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${getToneClasses(statusTone, isDarkMode)}`}>{statusLabel}</span>
              <span className={`${isDarkMode ? 'border-white/10 bg-white/[0.05] text-slate-300' : 'border-white/80 bg-white/65 text-slate-600'} rounded-full border px-2.5 py-1 text-[11px] font-black`}>Chart {gallery.currentNumber} of {gallery.total}</span>
            </div>

            <div className={`mt-3 rounded-xl border p-3 shadow-inner backdrop-blur-xl ${
              isDarkMode ? 'border-white/10 bg-white/[0.035] shadow-white/[0.02]' : 'border-white/80 bg-white/54 shadow-white'
            }`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-black tracking-[0.14em] ${isDarkMode ? 'bg-slate-950/60 text-cyan-200 ring-1 ring-white/10' : 'bg-cyan-50/80 text-cyan-700 ring-1 ring-cyan-100'}`}>{chartMetadata.code}</span>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${getToneClasses(statusTone, isDarkMode)}`}>{statusLabel}</span>
              </div>
              <h2 className={`mt-3 truncate text-lg font-black leading-tight sm:text-2xl ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{chartMetadata.label}</h2>
              <p className={`mt-1 text-xs font-black uppercase tracking-[0.14em] ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{chartMetadata.horizon}</p>
              <p className={`mt-2 line-clamp-2 text-xs font-semibold sm:text-sm ${mutedText}`}>{chartMetadata.mandate}</p>
              <p className={`mt-2 truncate text-xs font-semibold ${mutedText}`} title={getProjectName(currentProject)}>{getProjectName(currentProject)} · {getOwner(currentProject)} · Forecast {formatDate(currentProject.forecastDate)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(busyAction)}
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition disabled:cursor-not-allowed disabled:opacity-50 ${
              isDarkMode
                ? 'border-white/10 bg-white/[0.04] text-slate-400 hover:border-cyan-200/20 hover:bg-white/[0.08] hover:text-white'
                : 'border-white/80 bg-white/62 text-slate-500 shadow-sm hover:border-cyan-200 hover:bg-white/90 hover:text-slate-900'
            }`}
            aria-label="Close review modal"
          >
            <X size={20} />
          </button>
        </header>

        <div className="relative grid min-h-0 flex-1 overflow-y-auto xl:grid-cols-[minmax(0,1.6fr)_410px] xl:overflow-hidden">
          <ReviewMapWorkspace projectId={projectId} currentFeatureSource={currentFeatureSource} diff={diff} mapMode={mapMode} onMapModeChange={setMapMode} isLoadingCurrentFeatures={isLoadingCurrentFeatures} featureLoadError={featureLoadError} isDarkMode={isDarkMode} />
          <aside className={`min-h-0 border-t backdrop-blur-2xl xl:flex xl:flex-col xl:border-l xl:border-t-0 ${
            isDarkMode ? 'border-white/10 bg-slate-950/36' : 'border-white/70 bg-white/42'
          }`}>
            <ReviewSidebar project={currentProject} statusLabel={statusLabel} diff={diff} remarks={remarks} onRemarksChange={setRemarks} isReviewable={isReviewable} busyAction={busyAction} reviewer={reviewer} previousRemarks={previousRemarks} timeline={timeline} isDarkMode={isDarkMode} />
            <ReviewActionsFooter isReviewable={isReviewable} isUnderReview={isUnderReview} isApproved={isApproved} hasRemarks={hasRemarks} busyAction={busyAction} actionError={actionError} onClearActionError={clearActionError} isDarkMode={isDarkMode} {...reviewActionHandlers} onClose={onClose} />
          </aside>
        </div>
      </div>
    </div>
  );

  return typeof document === 'undefined' ? modal : createPortal(modal, document.body);
}
