import { useState } from 'react';
import { AlertCircle, Check, Clock3, GitCompareArrows, MessageSquareText, Send, UserRound, X } from 'lucide-react';

import Button from '@/components/ui/Button';
import ProjectPreviewMap from '@/features/projects/components/ProjectPreviewMap';
import { normalizeFeatureCollection } from '@/features/projects/utils/normalizeFeatureCollection';
import { addReviewComment, requestProjectRevision } from '@/api/projectAPI';

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

function getCurrentFeatureSource(project) {
  return project?.features || project?.featureCollection || project?.annotations || [];
}

function getPreviousFeatureSource(project) {
  const versions = Array.isArray(project?.versions) ? project.versions : [];
  const previousVersion = versions.length > 1 ? versions[versions.length - 2] : versions[0];

  return previousVersion?.features || previousVersion?.featureCollection || previousVersion?.annotations || [];
}

function getFeatureKey(feature) {
  return feature?._id || feature?.id || feature?.properties?.id || JSON.stringify(feature?.geometry || {});
}

function getAnnotationDiff(project) {
  const previous = normalizeFeatureCollection(getPreviousFeatureSource(project)).features;
  const current = normalizeFeatureCollection(getCurrentFeatureSource(project)).features;

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
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    slate: 'bg-slate-50 text-slate-700 border-slate-100',
  }[tone];

  return (
    <div className={`rounded-xl border p-3 ${toneClass}`}>
      <p className="text-[11px] font-black uppercase tracking-[0.14em] opacity-70">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}

export default function ProjectReviewModal({
  project,
  onClose,
  onApprove,
  onReject,
  onPublish,
  onActionComplete,
}) {
  const [remarks, setRemarks] = useState('');
  const [busyAction, setBusyAction] = useState(null);
  const [mapMode, setMapMode] = useState('preview');

  if (!project) return null;

  const projectId = getProjectId(project);
  const status = project?.status || 'Draft';
  const isReviewable = ['Submitted', 'Under Review'].includes(status);
  const isUnderReview = status === 'Under Review';
  const isApproved = status === 'Approved';
  const timeline = getTimeline(project);
  const previousRemarks = getPreviousRemarks(project);
  const reviewer = getReviewer(project);
  const diff = getAnnotationDiff(project);
  const previousFeatureSource = getPreviousFeatureSource(project);
  const currentFeatureSource = getCurrentFeatureSource(project);
  const hasRemarks = remarks.trim().length > 0;

  const runAction = async (key, action, { requireRemarks = false, closeOnSuccess = true } = {}) => {
    if (busyAction) return;
    if (requireRemarks && !hasRemarks) {
      alert('Remarks are required for this action.');
      return;
    }

    try {
      setBusyAction(key);
      await action?.(project, remarks.trim());
      await onActionComplete?.();
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
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
              Project Review
            </p>
            <h2 className="mt-1 truncate text-xl font-black text-slate-950">
              {getProjectName(project)}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {getProjectType(project)} · {getOwner(project)} · Forecast {formatDate(project.forecastDate)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(busyAction)}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close review modal"
          >
            <X size={20} />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 gap-0 overflow-y-auto lg:grid-cols-[1.55fr_0.9fr]">
          <section className="min-h-[420px] space-y-4 border-b border-slate-200 bg-slate-100 p-4 lg:border-b-0 lg:border-r">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Map Review</p>
                <h3 className="text-base font-black text-slate-900">Annotation Preview</h3>
              </div>
              <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setMapMode('preview')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-black transition ${mapMode === 'preview' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => setMapMode('diff')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-black transition ${mapMode === 'diff' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  Diff
                </button>
              </div>
            </div>

            {mapMode === 'preview' ? (
              <ProjectPreviewMap
                projectId={projectId}
                features={currentFeatureSource}
                featureScope="admin"
                height={520}
                className="rounded-2xl"
                emptyLabel="No annotations available"
              />
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-4">
                  <DiffMetric label="Previous" value={diff.previousCount} />
                  <DiffMetric label="Current" value={diff.currentCount} tone="blue" />
                  <DiffMetric label="Added" value={diff.added} tone="green" />
                  <DiffMetric label="Removed" value={diff.removed} tone="red" />
                </div>

                {!diff.hasPreviousSnapshot && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                    No previous annotation snapshot is available yet. The diff viewer is ready, but it needs saved project versions or annotation snapshots to compare against.
                  </div>
                )}

                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
                      <GitCompareArrows size={16} className="text-slate-400" />
                      <div>
                        <p className="text-sm font-black text-slate-900">Previous annotations</p>
                        <p className="text-xs text-slate-500">Latest saved snapshot before current review</p>
                      </div>
                    </div>
                    <ProjectPreviewMap
                      features={previousFeatureSource}
                      featureScope="admin"
                      height={320}
                      className="rounded-none border-0"
                      emptyLabel="No previous snapshot"
                    />
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
                      <GitCompareArrows size={16} className="text-blue-500" />
                      <div>
                        <p className="text-sm font-black text-slate-900">Current annotations</p>
                        <p className="text-xs text-slate-500">Submitted annotations under review</p>
                      </div>
                    </div>
                    <ProjectPreviewMap
                      projectId={projectId}
                      features={currentFeatureSource}
                      featureScope="admin"
                      height={320}
                      className="rounded-none border-0"
                      emptyLabel="No current annotations"
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          <aside className="space-y-5 p-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Review Status
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                  {status}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Last updated {formatDate(project.updatedAt || project.createdAt)}
                </span>
              </div>

              <div className="mt-4 grid gap-3 text-xs text-slate-600 sm:grid-cols-2">
                <div className="rounded-xl bg-white p-3">
                  <p className="flex items-center gap-1.5 font-black uppercase tracking-[0.12em] text-slate-400">
                    <UserRound size={13} /> Reviewer
                  </p>
                  <p className="mt-1 font-semibold text-slate-800">{reviewer}</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="flex items-center gap-1.5 font-black uppercase tracking-[0.12em] text-slate-400">
                    <Clock3 size={13} /> Review Time
                  </p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {formatDateTime(project.reviewStartedAt || project.reviewedAt || project.updatedAt)}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-black text-slate-900" htmlFor="review-remarks">
                Comments / Remarks
              </label>
              <p className="mt-1 text-xs text-slate-500">
                Add notes for approval, rejection, revision requests, or internal review context.
              </p>
              <textarea
                id="review-remarks"
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
                rows={6}
                disabled={Boolean(busyAction)}
                className="mt-3 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="Example: coastline annotation needs revision near northern boundary..."
              />
              <p className="mt-2 text-xs font-semibold text-slate-400">
                Request Revision and Reject require remarks. These actions are available once the project is Under Review.
              </p>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-black text-slate-900">Previous Remarks</h3>
                <MessageSquareText size={16} className="text-slate-400" />
              </div>

              {previousRemarks.length > 0 ? (
                <div className="mt-3 space-y-3">
                  {previousRemarks.slice(0, 4).map((item) => (
                    <div key={item.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                      <p className="text-slate-700">{item.comment}</p>
                      <p className="mt-2 text-xs font-semibold text-slate-400">
                        {item.actor} · {formatDateTime(item.date)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">No previous remarks yet.</p>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-black text-slate-900">Audit Timeline</h3>
              {timeline.length > 0 ? (
                <ol className="mt-4 space-y-4">
                  {timeline.slice(0, 6).map((item) => (
                    <li key={item.id} className="relative pl-6">
                      <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-blue-500 ring-4 ring-blue-50" />
                      <p className="text-sm font-bold capitalize text-slate-800">
                        {item.action.replaceAll('_', ' ')}
                      </p>
                      <p className="text-xs font-semibold text-slate-500">
                        {item.actor} · {formatDateTime(item.date)}
                      </p>
                      {(item.previousStatus || item.newStatus) && (
                        <p className="mt-1 text-xs text-slate-500">
                          {item.previousStatus || '—'} → {item.newStatus || '—'}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-3 text-sm text-slate-500">No audit events recorded yet.</p>
              )}
            </section>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <div className="flex gap-2">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <p>
                  Review the map preview and add remarks before rejecting or requesting revision. Approve only when the project is ready for publication workflow.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:flex-wrap">
              {isReviewable && (
                <>
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
                  <Button
                    icon={Check}
                    loading={busyAction === 'approve'}
                    disabled={!isUnderReview || Boolean(busyAction)}
                    onClick={() => runAction('approve', () => onApprove(project))}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="secondary"
                    icon={AlertCircle}
                    loading={busyAction === 'reject'}
                    disabled={!hasRemarks || !isUnderReview || Boolean(busyAction)}
                    onClick={() => runAction('reject', () => onReject(project, remarks.trim()), { requireRemarks: true })}
                  >
                    Reject
                  </Button>
                </>
              )}

              {isApproved && (
                <Button
                  icon={Send}
                  loading={busyAction === 'publish'}
                  disabled={Boolean(busyAction)}
                  onClick={() => runAction('publish', () => onPublish(project))}
                >
                  Publish
                </Button>
              )}

              <Button variant="ghost" disabled={Boolean(busyAction)} onClick={onClose}>
                Close
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
