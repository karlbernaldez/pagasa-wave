import { useState } from 'react';
import { AlertCircle, Check, Send, X } from 'lucide-react';

import Button from '@/components/ui/Button';
import ProjectPreviewMap from '@/features/projects/components/ProjectPreviewMap';

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

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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

  if (!project) return null;

  const projectId = getProjectId(project);
  const status = project?.status || 'Draft';
  const isReviewable = ['Submitted', 'Under Review'].includes(status);
  const isApproved = status === 'Approved';

  const runAction = async (key, action) => {
    try {
      setBusyAction(key);
      await action?.(project, remarks.trim());
      await onActionComplete?.();
      onClose?.();
    } catch (error) {
      console.error(error);
      alert(error.message || 'Action failed. Please try again.');
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
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
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close review modal"
          >
            <X size={20} />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 gap-0 overflow-y-auto lg:grid-cols-[1.5fr_0.9fr]">
          <section className="min-h-[420px] border-b border-slate-200 bg-slate-100 p-4 lg:border-b-0 lg:border-r">
            <ProjectPreviewMap
              projectId={projectId}
              featureScope="admin"
              height="100%"
              className="h-full min-h-[420px] rounded-2xl"
              emptyLabel="No annotations available"
            />
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
            </div>

            <div>
              <label className="text-sm font-black text-slate-900" htmlFor="review-remarks">
                Comments / Remarks
              </label>
              <p className="mt-1 text-xs text-slate-500">
                Add notes for approval, rejection, or internal review context.
              </p>
              <textarea
                id="review-remarks"
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
                rows={8}
                className="mt-3 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                placeholder="Example: coastline annotation needs revision near northern boundary..."
              />
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <div className="flex gap-2">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <p>
                  Review the map preview and add remarks before rejecting. Approve only when the project is ready for publication workflow.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-100 pt-5 sm:flex-row">
              {isReviewable && (
                <>
                  <Button
                    icon={Check}
                    loading={busyAction === 'approve'}
                    onClick={() => runAction('approve', onApprove)}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="secondary"
                    icon={AlertCircle}
                    loading={busyAction === 'reject'}
                    disabled={!remarks.trim()}
                    onClick={() => runAction('reject', onReject)}
                  >
                    Reject
                  </Button>
                </>
              )}

              {isApproved && (
                <Button
                  icon={Send}
                  loading={busyAction === 'publish'}
                  onClick={() => runAction('publish', onPublish)}
                >
                  Publish
                </Button>
              )}

              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
