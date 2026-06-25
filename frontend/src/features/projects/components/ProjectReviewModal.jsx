import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

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
import {
  getProjectStatusLabel,
  isProjectApproved,
  isProjectReviewable,
  isProjectUnderReview,
} from '@/features/projects/projectStatuses';

export default function ProjectReviewModal({ project, isDarkMode = false, onClose, onApprove, onReject, onPublish, onActionComplete }) {
  const lastProjectIdRef = useRef(getProjectId(project));
  const [currentProject, setCurrentProject] = useState(project);
  const [currentFeatureCollection, setCurrentFeatureCollection] = useState(() => normalizeFeatureCollection(getEmbeddedCurrentFeatureSource(project)));
  const [isLoadingCurrentFeatures, setIsLoadingCurrentFeatures] = useState(false);
  const [featureLoadError, setFeatureLoadError] = useState('');
  const [remarks, setRemarks] = useState('');
  const [mapMode, setMapMode] = useState('preview');

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
  }, [project]);

  const projectId = getProjectId(currentProject);

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

  return (
    <div className="fixed inset-0 z-[90] flex items-stretch justify-center bg-slate-950/80 p-1 backdrop-blur-sm sm:p-4 xl:items-center xl:p-6">
      <div className={`flex h-full w-full max-w-[1480px] flex-col overflow-hidden rounded-2xl border shadow-2xl ring-1 ring-white/10 sm:h-[min(94vh,940px)] sm:rounded-[28px] ${surface}`}>
        <header className={`flex shrink-0 items-start justify-between gap-3 border-b px-4 py-3 sm:gap-4 sm:px-6 sm:py-4 ${isDarkMode ? 'border-white/10 bg-slate-950' : 'border-slate-200 bg-white'}`}>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-500 sm:text-xs">Forecast Chart Review</p>
              <span className={`${isDarkMode ? 'border-blue-400/20 bg-blue-500/10 text-blue-300' : 'border-blue-100 bg-blue-50 text-blue-700'} rounded-full border px-2.5 py-1 text-[11px] font-black`}>
                {statusLabel}
              </span>
            </div>
            <h2 className={`mt-2 truncate text-lg font-black leading-tight sm:text-2xl ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{getProjectName(currentProject)}</h2>
            <p className={`mt-1 text-xs font-semibold sm:text-sm ${mutedText}`}>
              {getProjectType(currentProject)} · {getOwner(currentProject)} · Forecast {formatDate(currentProject.forecastDate)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(busyAction)}
            className={`rounded-2xl border border-transparent p-2 transition disabled:cursor-not-allowed disabled:opacity-50 ${isDarkMode ? 'text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-white' : 'text-slate-500 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900'}`}
            aria-label="Close review modal"
          >
            <X size={20} />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 overflow-y-auto xl:grid-cols-[minmax(0,1.6fr)_430px] xl:overflow-hidden">
          <ReviewMapWorkspace
            projectId={projectId}
            currentFeatureSource={currentFeatureSource}
            diff={diff}
            mapMode={mapMode}
            onMapModeChange={setMapMode}
            isLoadingCurrentFeatures={isLoadingCurrentFeatures}
            featureLoadError={featureLoadError}
            isDarkMode={isDarkMode}
          />

          <aside className={`min-h-0 border-t xl:flex xl:flex-col xl:border-l xl:border-t-0 ${isDarkMode ? 'border-white/10 bg-slate-950' : 'border-slate-200 bg-white'}`}>
            <ReviewSidebar
              project={currentProject}
              statusLabel={statusLabel}
              diff={diff}
              remarks={remarks}
              onRemarksChange={setRemarks}
              isReviewable={isReviewable}
              busyAction={busyAction}
              reviewer={reviewer}
              previousRemarks={previousRemarks}
              timeline={timeline}
              isDarkMode={isDarkMode}
            />

            <ReviewActionsFooter
              isReviewable={isReviewable}
              isUnderReview={isUnderReview}
              isApproved={isApproved}
              hasRemarks={hasRemarks}
              busyAction={busyAction}
              actionError={actionError}
              onClearActionError={clearActionError}
              isDarkMode={isDarkMode}
              {...reviewActionHandlers}
              onClose={onClose}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
