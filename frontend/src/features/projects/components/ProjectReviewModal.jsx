import { useEffect, useMemo, useRef, useState } from 'react';
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
  getProjectType,
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

function getQueueProjectId(project) {
  return getProjectId(project);
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
      className={`inline-flex h-14 w-14 items-center justify-center rounded-full border shadow-2xl backdrop-blur-xl transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 ${
        isDarkMode
          ? 'border-cyan-300/40 bg-slate-950/95 text-cyan-100 hover:bg-cyan-500/20'
          : 'border-cyan-200 bg-white/95 text-cyan-700 hover:bg-cyan-50'
      }`}
    >
      <Icon size={30} />
    </button>
  );
}

export default function ProjectReviewModal({ project, reviewQueue = [], isDarkMode = false, onClose, onSelectProject, onApprove, onReject, onNoPublication, onPublish, onActionComplete }) {
  const lastProjectIdRef = useRef(getProjectId(project));
  const [currentProject, setCurrentProject] = useState(project);
  const [currentFeatureCollection, setCurrentFeatureCollection] = useState(() => normalizeFeatureCollection(getEmbeddedCurrentFeatureSource(project)));
  const [isLoadingCurrentFeatures, setIsLoadingCurrentFeatures] = useState(false);
  const [featureLoadError, setFeatureLoadError] = useState('');
  const [remarks, setRemarks] = useState('');
  const [mapMode, setMapMode] = useState('preview');
  const [autoReviewQueue, setAutoReviewQueue] = useState([]);

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

  useEffect(() => {
    let isMounted = true;
    const providedQueue = Array.isArray(reviewQueue) ? reviewQueue : [];

    setAutoReviewQueue([]);

    if (!projectId || providedQueue.length > 1) return undefined;

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
  }, [projectId, reviewQueue]);

  const effectiveReviewQueue = useMemo(() => {
    const providedQueue = Array.isArray(reviewQueue) ? reviewQueue : [];
    return providedQueue.length > 1 ? providedQueue : autoReviewQueue;
  }, [autoReviewQueue, reviewQueue]);

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
  const { busyAction, actionError, clearActionError, runAction } = useProjectReviewActions({
    currentProject,
    remarks,
    hasRemarks,
    setCurrentProject,
    setRemarks,
    onActionComplete,
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
  const isReviewable = isProjectReviewable(currentProject?.status);
  const isUnderReview = isProjectUnderReview(currentProject?.status);
  const isApproved = isProjectApproved(currentProject?.status);
  const timeline = getTimeline(currentProject);
  const previousRemarks = getPreviousRemarks(currentProject);
  const reviewer = getReviewer(currentProject);
  const previousFeatureSource = getPreviousFeatureSource(currentProject);
  const currentFeatureSource = currentFeatureCollection;
  const diff = buildAnnotationDiff(previousFeatureSource, currentFeatureSource);

  const surface = isDarkMode ? 'border-white/10 bg-slate-900 text-slate-100' : 'border-slate-200 bg-white text-slate-950';
  const mutedText = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const canMoveGallery = !busyAction && effectiveReviewQueue.length > 1;
  const selectGalleryProject = (targetProject) => {
    if (!targetProject || !canMoveGallery) return;
    if (onSelectProject) {
      onSelectProject(targetProject);
      return;
    }
    setCurrentProject(targetProject);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-slate-950/80 p-1 backdrop-blur-sm sm:p-4 xl:items-center xl:p-6">
      <div className="pointer-events-none fixed inset-y-0 left-4 right-4 z-[120] flex items-center justify-between sm:left-8 sm:right-8 xl:left-14 xl:right-14">
        <div className="pointer-events-auto">
          <GalleryButton direction="previous" disabled={!gallery.previousProject || !canMoveGallery} isDarkMode={isDarkMode} onClick={() => selectGalleryProject(gallery.previousProject)} />
        </div>
        <div className="pointer-events-auto">
          <GalleryButton direction="next" disabled={!gallery.nextProject || !canMoveGallery} isDarkMode={isDarkMode} onClick={() => selectGalleryProject(gallery.nextProject)} />
        </div>
      </div>

      <div className={`relative flex h-full w-full max-w-[1480px] flex-col overflow-hidden rounded-2xl border shadow-2xl ring-1 ring-white/10 sm:h-[min(94vh,940px)] sm:rounded-[28px] ${surface}`}>
        <header className={`flex shrink-0 items-start justify-between gap-3 border-b px-4 py-3 sm:gap-4 sm:px-6 sm:py-4 ${isDarkMode ? 'border-white/10 bg-slate-950' : 'border-slate-200 bg-white'}`}>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-500 sm:text-xs">Forecast Chart Review</p>
              <span className={`${isDarkMode ? 'border-blue-400/20 bg-blue-500/10 text-blue-300' : 'border-blue-100 bg-blue-50 text-blue-700'} rounded-full border px-2.5 py-1 text-[11px] font-black`}>{statusLabel}</span>
              <span className={`${isDarkMode ? 'border-white/10 bg-white/[0.05] text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-600'} rounded-full border px-2.5 py-1 text-[11px] font-black`}>Chart {gallery.currentNumber} of {gallery.total}</span>
            </div>
            <h2 className={`mt-2 truncate text-lg font-black leading-tight sm:text-2xl ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{getProjectName(currentProject)}</h2>
            <p className={`mt-1 text-xs font-semibold sm:text-sm ${mutedText}`}>{getProjectType(currentProject)} · {getOwner(currentProject)} · Forecast {formatDate(currentProject.forecastDate)}</p>
          </div>
          <button type="button" onClick={onClose} disabled={Boolean(busyAction)} className={`rounded-2xl border border-transparent p-2 transition disabled:cursor-not-allowed disabled:opacity-50 ${isDarkMode ? 'text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-white' : 'text-slate-500 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900'}`} aria-label="Close review modal"><X size={20} /></button>
        </header>

        <div className="grid min-h-0 flex-1 overflow-y-auto xl:grid-cols-[minmax(0,1.6fr)_430px] xl:overflow-hidden">
          <ReviewMapWorkspace projectId={projectId} currentFeatureSource={currentFeatureSource} diff={diff} mapMode={mapMode} onMapModeChange={setMapMode} isLoadingCurrentFeatures={isLoadingCurrentFeatures} featureLoadError={featureLoadError} isDarkMode={isDarkMode} />
          <aside className={`min-h-0 border-t xl:flex xl:flex-col xl:border-l xl:border-t-0 ${isDarkMode ? 'border-white/10 bg-slate-950' : 'border-slate-200 bg-white'}`}>
            <ReviewSidebar project={currentProject} statusLabel={statusLabel} diff={diff} remarks={remarks} onRemarksChange={setRemarks} isReviewable={isReviewable} busyAction={busyAction} reviewer={reviewer} previousRemarks={previousRemarks} timeline={timeline} isDarkMode={isDarkMode} />
            <ReviewActionsFooter isReviewable={isReviewable} isUnderReview={isUnderReview} isApproved={isApproved} hasRemarks={hasRemarks} busyAction={busyAction} actionError={actionError} onClearActionError={clearActionError} isDarkMode={isDarkMode} {...reviewActionHandlers} onClose={onClose} />
          </aside>
        </div>
      </div>
    </div>
  );
}
