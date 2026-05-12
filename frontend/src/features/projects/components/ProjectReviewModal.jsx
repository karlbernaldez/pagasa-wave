import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, MessageSquareText, Send, X } from 'lucide-react';

import Button from '@/components/ui/Button';
import ReviewMapWorkspace from '@/features/projects/components/review/ReviewMapWorkspace';
import ReviewSidebar from '@/features/projects/components/review/ReviewSidebar';
import { normalizeFeatureCollection } from '@/features/projects/utils/normalizeFeatureCollection';
import { buildAnnotationDiff } from '@/features/projects/utils/projectAnnotationDiff';
import { addReviewComment, requestProjectRevision } from '@/api/projectAPI';
import { fetchProjectFeatureCollection } from '@/api/featureServices';
import {
  getProjectStatusLabel,
  isProjectApproved,
  isProjectReviewable,
  isProjectUnderReview,
} from '@/features/projects/projectStatuses';

const SYSTEM_REMARKS = new Set([
  'Project created',
  'Submitted for review',
  'Project review started',
]);

function getProjectName(project) {
  return project?.name || project?.title || 'Untitled project';
}

function getProjectId(project) {
  return project?._id || project?.id;
}

function getProjectType(project) {
  return project?.chartType || project?.type || 'Forecast';
}

function getOwner(project) {
  if (project?.ownerDisplay) return project.ownerDisplay;
  if (!project?.owner) return 'Project Owner';
  if (typeof project.owner === 'string') return project.owner;

  const fullName = `${project.owner.firstName ?? ''} ${project.owner.lastName ?? ''}`.trim();
  return fullName || project.owner.email || 'Project Owner';
}

function getUserLabel(user) {
  if (!user) return 'System';
  if (typeof user === 'string') return user;

  const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  return fullName || user.username || user.email || 'User';
}

function formatDate(value) {
  if (!value) return '—';

  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getTimeline(project) {
  const logs = Array.isArray(project?.auditLogs) ? project.auditLogs : [];

  return logs
    .map((log, index) => ({
      id: log._id || `${log.action}-${index}`,
      action: log.action || 'updated',
      actor: getUserLabel(log.performedBy),
      previousStatus: log.previousStatus,
      newStatus: log.newStatus,
      comment: log.comment,
      date: log.createdAt || log.timestamp || project.updatedAt || project.createdAt,
    }))
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
}

function getPreviousRemarks(project) {
  const remarks = [];

  getTimeline(project)
    .filter((item) => item.comment && !SYSTEM_REMARKS.has(item.comment))
    .forEach((item) => remarks.push(item));

  const seen = new Set();

  return remarks
    .filter((item) => {
      const key = `${item.comment}-${item.date}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
}

function getReviewer(project) {
  return getUserLabel(project?.approvedBy || project?.rejectedBy || project?.reviewStartedBy);
}

function getEmbeddedCurrentFeatureSource(project) {
  return project?.features || project?.featureCollection || project?.annotations || [];
}

function getPreviousFeatureSource(project) {
  const versions = Array.isArray(project?.versions) ? project.versions : [];
  const previousVersion = versions.length > 1 ? versions[versions.length - 2] : versions[0];

  return previousVersion?.features || previousVersion?.featureCollection || previousVersion?.annotations || [];
}

function mergeProjectState(previousProject, nextProject) {
  if (!previousProject || !nextProject) return nextProject || previousProject;

  return {
    ...previousProject,
    ...nextProject,
    features: nextProject.features ?? previousProject.features,
    featureCollection: nextProject.featureCollection ?? previousProject.featureCollection,
    annotations: nextProject.annotations ?? previousProject.annotations,
    versions: nextProject.versions ?? previousProject.versions,
  };
}

export default function ProjectReviewModal({ project, isDarkMode = false, onClose, onApprove, onReject, onPublish, onActionComplete }) {
  const lastProjectIdRef = useRef(getProjectId(project));
  const [currentProject, setCurrentProject] = useState(project);
  const [currentFeatureCollection, setCurrentFeatureCollection] = useState(() => normalizeFeatureCollection(getEmbeddedCurrentFeatureSource(project)));
  const [isLoadingCurrentFeatures, setIsLoadingCurrentFeatures] = useState(false);
  const [featureLoadError, setFeatureLoadError] = useState('');
  const [remarks, setRemarks] = useState('');
  const [busyAction, setBusyAction] = useState(null);
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
  const hasRemarks = remarks.trim().length > 0;

  const runAction = async (key, action, { requireRemarks = false, closeOnSuccess = true } = {}) => {
    if (busyAction) return;
    if (requireRemarks && !hasRemarks) {
      alert('Remarks are required for this action.');
      return;
    }

    try {
      setBusyAction(key);
      const updatedProject = await action?.(currentProject, remarks.trim());
      const nextProject = updatedProject ? mergeProjectState(currentProject, updatedProject) : currentProject;

      setCurrentProject(nextProject);
      await onActionComplete?.(nextProject);
      setRemarks('');
      if (closeOnSuccess) onClose?.();
    } catch (error) {
      console.error(error);
      alert(error.message || 'Action failed. Please try again.');
    } finally {
      setBusyAction(null);
    }
  };

  const surface = isDarkMode ? 'border-white/10 bg-slate-900 text-slate-100' : 'border-slate-200 bg-white text-slate-950';
  const mutedText = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const disabledReviewButton = isDarkMode ? 'opacity-45' : 'opacity-50';

  return (
    <div className="fixed inset-0 z-[90] flex items-stretch justify-center bg-slate-950/80 p-1 backdrop-blur-sm sm:p-4 xl:items-center xl:p-6">
      <div className={`flex h-full w-full max-w-[1480px] flex-col overflow-hidden rounded-2xl border shadow-2xl ring-1 ring-white/10 sm:h-[min(94vh,940px)] sm:rounded-[28px] ${surface}`}>
        <header className={`flex shrink-0 items-start justify-between gap-3 border-b px-4 py-3 sm:gap-4 sm:px-6 sm:py-4 ${isDarkMode ? 'border-white/10 bg-slate-950' : 'border-slate-200 bg-white'}`}>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-500 sm:text-xs">Project Review</p>
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

            <div className={`mx-3 mb-3 mt-1 shrink-0 rounded-2xl border p-3 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] sm:mx-5 sm:mb-5 sm:p-4 xl:sticky xl:bottom-0 xl:mx-0 xl:mb-0 xl:mt-0 xl:rounded-none xl:border-x-0 xl:border-b-0 ${isDarkMode ? 'border-white/10 bg-slate-950/95' : 'border-slate-200 bg-white/95'}`}>
              <div className="flex flex-col gap-2">
                {isReviewable && (
                  <div className="grid grid-cols-2 gap-2 [&>button]:min-h-10 [&>button]:w-full">
                    <Button
                      variant={hasRemarks ? 'secondary' : 'ghost'}
                      icon={MessageSquareText}
                      loading={busyAction === 'comment'}
                      disabled={!hasRemarks || Boolean(busyAction)}
                      onClick={() => runAction('comment', () => addReviewComment(projectId, remarks.trim()), { requireRemarks: true, closeOnSuccess: false })}
                    >
                      Add Comment
                    </Button>
                    <Button
                      variant={hasRemarks && isUnderReview ? 'secondary' : 'ghost'}
                      icon={AlertCircle}
                      loading={busyAction === 'revision'}
                      disabled={!hasRemarks || !isUnderReview || Boolean(busyAction)}
                      onClick={() => runAction('revision', () => requestProjectRevision(projectId, remarks.trim()), { requireRemarks: true })}
                    >
                      Request Revision
                    </Button>
                    <Button
                      icon={Check}
                      loading={busyAction === 'approve'}
                      disabled={!isUnderReview || Boolean(busyAction)}
                      onClick={() => runAction('approve', () => onApprove(currentProject))}
                    >
                      Approve
                    </Button>
                    <Button
                      variant={hasRemarks && isUnderReview ? 'danger' : 'ghost'}
                      icon={AlertCircle}
                      loading={busyAction === 'reject'}
                      disabled={!hasRemarks || !isUnderReview || Boolean(busyAction)}
                      onClick={() => runAction('reject', () => onReject(currentProject, remarks.trim()), { requireRemarks: true })}
                    >
                      Reject
                    </Button>
                  </div>
                )}

                {isApproved && (
                  <Button
                    icon={Send}
                    loading={busyAction === 'publish'}
                    disabled={Boolean(busyAction)}
                    onClick={() => runAction('publish', () => onPublish(currentProject))}
                  >
                    Publish
                  </Button>
                )}

                <Button variant="ghost" disabled={Boolean(busyAction)} onClick={onClose}>
                  Close
                </Button>
              </div>
              {!hasRemarks && isReviewable && (
                <p className={`mt-2 text-center text-[11px] font-semibold ${isDarkMode ? 'text-slate-600' : 'text-slate-400'} ${disabledReviewButton}`}>
                  Add remarks to enable comment, revision, or reject actions.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
