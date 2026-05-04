import { useEffect, useState } from 'react';
import { AlertCircle, Check, Clock3, GitCompareArrows, MessageSquareText, Send, UserRound, X } from 'lucide-react';

import Button from '@/components/ui/Button';
import ProjectPreviewMap from '@/features/projects/components/ProjectPreviewMap';
import { normalizeFeatureCollection } from '@/features/projects/utils/normalizeFeatureCollection';
import { addReviewComment, requestProjectRevision } from '@/api/projectAPI';
import { fetchProjectFeatureCollection } from '@/api/featureServices';
import {
  getProjectStatusLabel,
  isProjectApproved,
  isProjectReviewable,
  isProjectUnderReview,
} from '@/features/projects/projectStatuses';

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

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
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

  if (project?.reviewComment) {
    remarks.push({
      id: 'review-comment',
      comment: project.reviewComment,
      actor: getUserLabel(project.rejectedBy || project.approvedBy || project.reviewStartedBy),
      date: project.reviewedAt || project.updatedAt,
      action: 'review_comment',
    });
  }

  getTimeline(project)
    .filter((item) => item.comment && !['Project created', 'Submitted for review', 'Project review started'].includes(item.comment))
    .forEach((item) => remarks.push(item));

  const seen = new Set();
  return remarks.filter((item) => {
    const key = `${item.comment}-${item.date}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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

function getFeatureKey(feature) {
  return feature?._id || feature?.id || feature?.properties?.id || feature?.properties?.sourceId || JSON.stringify(feature?.geometry || {});
}

function getAnnotationDiff(previousFeatureSource, currentFeatureSource) {
  const previous = normalizeFeatureCollection(previousFeatureSource).features;
  const current = normalizeFeatureCollection(currentFeatureSource).features;

  const previousKeys = new Set(previous.map(getFeatureKey));
  const currentKeys = new Set(current.map(getFeatureKey));

  return {
    previousCount: previous.length,
    currentCount: current.length,
    added: current.filter((feature) => !previousKeys.has(getFeatureKey(feature))).length,
    removed: previous.filter((feature) => !currentKeys.has(getFeatureKey(feature))).length,
    unchanged: current.filter((feature) => previousKeys.has(getFeatureKey(feature))).length,
    hasPreviousSnapshot: previous.length > 0,
  };
}

function DiffMetric({ label, value, tone = 'slate' }) {
  const toneClass = {
    blue: 'border-blue-100 bg-blue-50 text-blue-700 ring-blue-100',
    green: 'border-emerald-100 bg-emerald-50 text-emerald-700 ring-emerald-100',
    red: 'border-red-100 bg-red-50 text-red-700 ring-red-100',
    slate: 'border-slate-100 bg-slate-50 text-slate-700 ring-slate-100',
  }[tone];

  return (
    <div className={`rounded-2xl border p-4 ring-1 ${toneClass}`}>
      <p className="text-[11px] font-black uppercase tracking-[0.14em] opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-black leading-none">{value}</p>
    </div>
  );
}

export default function ProjectReviewModal({ project, onClose, onApprove, onReject, onPublish, onActionComplete }) {
  const [currentProject, setCurrentProject] = useState(project);
  const [currentFeatureCollection, setCurrentFeatureCollection] = useState(() => normalizeFeatureCollection(getEmbeddedCurrentFeatureSource(project)));
  const [isLoadingCurrentFeatures, setIsLoadingCurrentFeatures] = useState(false);
  const [featureLoadError, setFeatureLoadError] = useState('');
  const [remarks, setRemarks] = useState('');
  const [busyAction, setBusyAction] = useState(null);
  const [mapMode, setMapMode] = useState('preview');

  useEffect(() => {
    setCurrentProject(project);
    setCurrentFeatureCollection(normalizeFeatureCollection(getEmbeddedCurrentFeatureSource(project)));
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
  const diff = getAnnotationDiff(previousFeatureSource, currentFeatureSource);
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
      if (updatedProject) setCurrentProject(updatedProject);
      await onActionComplete?.(updatedProject);
      setRemarks('');
      if (closeOnSuccess) onClose?.();
    } catch (error) {
      console.error(error);
      alert(error.message || 'Action failed. Please try again.');
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm sm:p-6">
      <div className="flex h-[min(92vh,900px)] w-full max-w-[1480px] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 shadow-2xl ring-1 ring-white/20">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Project Review</p>
              <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700">
                {statusLabel}
              </span>
            </div>
            <h2 className="mt-2 truncate text-2xl font-black leading-tight text-slate-950">{getProjectName(currentProject)}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {getProjectType(currentProject)} · {getOwner(currentProject)} · Forecast {formatDate(currentProject.forecastDate)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(busyAction)}
            className="rounded-2xl border border-transparent p-2 text-slate-500 transition hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close review modal"
          >
            <X size={20} />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[minmax(0,1.6fr)_430px]">
          <section className="min-h-0 overflow-hidden bg-slate-100 p-4">
            <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Annotation Preview</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {isLoadingCurrentFeatures ? 'Loading current annotations…' : mapMode === 'diff' ? 'Compare previous snapshot against current submission' : 'Large map review workspace'}
                  </p>
                </div>
                <div className="flex shrink-0 rounded-2xl border border-slate-200 bg-slate-50 p-1 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setMapMode('preview')}
                    className={`rounded-xl px-4 py-2 text-xs font-black transition ${mapMode === 'preview' ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapMode('diff')}
                    className={`rounded-xl px-4 py-2 text-xs font-black transition ${mapMode === 'diff' ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Diff
                  </button>
                </div>
              </div>

              {featureLoadError && (
                <div className="shrink-0 border-b border-red-200 bg-red-50 px-5 py-2 text-sm font-semibold text-red-700">
                  {featureLoadError}
                </div>
              )}

              <div className="min-h-0 flex-1 overflow-hidden p-4">
                {mapMode === 'preview' ? (
                  <ProjectPreviewMap
                    projectId={projectId}
                    features={currentFeatureSource}
                    featureScope="admin"
                    className="h-full min-h-[420px] rounded-2xl border-slate-200"
                    height="100%"
                    emptyLabel={isLoadingCurrentFeatures ? 'Loading current annotations…' : 'No current annotations yet'}
                    lazy={false}
                  />
                ) : (
                  <div className="grid h-full min-h-0 gap-4 xl:grid-cols-2">
                    <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
                      <div className="shrink-0 border-b border-slate-200 bg-white/70 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                        Previous Snapshot
                      </div>
                      <ProjectPreviewMap
                        features={previousFeatureSource}
                        featureScope="admin"
                        className="min-h-[360px] flex-1 rounded-none border-0"
                        height="100%"
                        emptyLabel="No previous snapshot"
                        lazy={false}
                      />
                    </div>
                    <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-blue-100 bg-blue-50/40 shadow-sm">
                      <div className="shrink-0 border-b border-blue-100 bg-white/80 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-blue-500">
                        Current Submission
                      </div>
                      <ProjectPreviewMap
                        projectId={projectId}
                        features={currentFeatureSource}
                        featureScope="admin"
                        className="min-h-[360px] flex-1 rounded-none border-0"
                        height="100%"
                        emptyLabel={isLoadingCurrentFeatures ? 'Loading current annotations…' : 'No current annotations yet'}
                        lazy={false}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <aside className="flex min-h-0 flex-col border-l border-slate-200 bg-white">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Review Status</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                    {statusLabel}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    Updated {formatDate(currentProject.updatedAt || currentProject.createdAt)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <DiffMetric label="Previous" value={diff.previousCount} />
                <DiffMetric label="Current" value={diff.currentCount} tone="blue" />
                <DiffMetric label="Added" value={diff.added} tone="green" />
                <DiffMetric label="Removed" value={diff.removed} tone="red" />
              </div>

              {!diff.hasPreviousSnapshot && (
                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-relaxed text-amber-800">
                  No previous annotation snapshot is available yet. Current submission annotations are shown from the live project data.
                </div>
              )}

              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  <MessageSquareText size={15} />
                  Remarks / Comments
                </label>
                <textarea
                  value={remarks}
                  onChange={(event) => setRemarks(event.target.value)}
                  disabled={!isReviewable || Boolean(busyAction)}
                  placeholder="Write review remarks. The same text is saved as the review comment."
                  className="mt-3 h-24 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold leading-relaxed text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                    <UserRound size={15} />
                    Reviewer
                  </p>
                  <p className="truncate text-sm font-black text-slate-800">{reviewer}</p>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-sm font-semibold text-slate-500">
                  <span className="inline-flex items-center gap-2"><Clock3 size={15} /> Reviewed</span>
                  <span>{formatDateTime(currentProject.reviewedAt || currentProject.reviewStartedAt)}</span>
                </div>
              </div>

              {previousRemarks.length > 0 && (
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Previous Remarks</p>
                  <div className="mt-3 space-y-3">
                    {previousRemarks.slice(0, 3).map((item) => (
                      <div key={item.id} className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                        <p className="line-clamp-3 text-sm font-semibold leading-relaxed text-slate-700">{item.comment}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-400">
                          {item.actor} · {formatDateTime(item.date)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  <GitCompareArrows size={15} />
                  Audit Timeline
                </p>
                <div className="mt-4 space-y-3">
                  {timeline.length === 0 ? (
                    <p className="text-sm font-semibold text-slate-400">No audit events yet.</p>
                  ) : (
                    timeline.slice(0, 5).map((item) => (
                      <div key={item.id} className="border-l-2 border-blue-100 pl-3">
                        <p className="text-sm font-black capitalize text-slate-800">{item.action.replaceAll('_', ' ')}</p>
                        <p className="text-xs font-semibold text-slate-500">
                          {item.actor} · {formatDateTime(item.date)}
                        </p>
                        {item.comment && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{item.comment}</p>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-slate-200 bg-white/95 p-4 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="flex flex-col gap-2">
                {isReviewable && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="secondary"
                        icon={MessageSquareText}
                        loading={busyAction === 'comment'}
                        disabled={!hasRemarks || Boolean(busyAction)}
                        onClick={() => runAction('comment', () => addReviewComment(projectId, remarks.trim()), { requireRemarks: true, closeOnSuccess: false })}
                      >
                        Add Comment
                      </Button>
                      <Button
                        variant="secondary"
                        icon={AlertCircle}
                        loading={busyAction === 'revision'}
                        disabled={!hasRemarks || !isUnderReview || Boolean(busyAction)}
                        onClick={() => runAction('revision', () => requestProjectRevision(projectId, remarks.trim()), { requireRemarks: true })}
                      >
                        Request Revision
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        icon={Check}
                        loading={busyAction === 'approve'}
                        disabled={!isUnderReview || Boolean(busyAction)}
                        onClick={() => runAction('approve', () => onApprove(currentProject))}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        icon={AlertCircle}
                        loading={busyAction === 'reject'}
                        disabled={!hasRemarks || !isUnderReview || Boolean(busyAction)}
                        onClick={() => runAction('reject', () => onReject(currentProject, remarks.trim()), { requireRemarks: true })}
                      >
                        Reject
                      </Button>
                    </div>
                  </>
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
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
