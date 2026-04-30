import { format } from 'date-fns';
import {
  AlertCircle,
  Check,
  Download,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Send,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';

import Button from '@/components/ui/Button';
import ProjectPreviewMap from '@/features/projects/components/ProjectPreviewMap';
import {
  PROJECT_STATUS,
  canSubmitProjectStatus,
  getProjectStatusLabel,
  getProjectStatusStyle,
  isProjectApproved,
  isProjectPublished,
  isProjectReviewable,
} from '@/features/projects/projectStatuses';

function formatDate(value, pattern = 'MMM d, yyyy') {
  if (!value) return '—';

  try {
    return format(new Date(value), pattern);
  } catch {
    return '—';
  }
}

function getProjectId(project) {
  return project?._id || project?.id;
}

function getProjectName(project) {
  return project?.name || project?.title || 'Untitled project';
}

function getProjectType(project) {
  return project?.chartType || project?.type || 'Forecast';
}

function getProjectOwner(project) {
  if (project?.ownerDisplay) return project.ownerDisplay;
  if (!project?.owner) return null;
  if (typeof project.owner === 'string') return project.owner;

  const fullName = `${project.owner.firstName ?? ''} ${project.owner.lastName ?? ''}`.trim();
  return fullName || project.owner.email || null;
}

function getProjectFeatures(project) {
  return project?.features || project?.featureCollection || project?.annotations || [];
}

function getDefaultMenuActions({ project, onRename, onDelete }) {
  return [
    onRename && {
      key: 'rename',
      label: 'Rename',
      icon: Pencil,
      onClick: () => onRename(project),
    },
    onDelete && {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      danger: true,
      onClick: () => onDelete(project),
    },
  ].filter(Boolean);
}

function getSubmitAction({ project, onSubmit, submittingProjectId }) {
  if (!onSubmit || !canSubmitProjectStatus(project?.status)) return null;

  const isInitialSubmit = project.status === PROJECT_STATUS.DRAFT;

  return {
    key: isInitialSubmit ? 'submit' : 'resubmit',
    label: isInitialSubmit ? 'Submit' : 'Resubmit',
    icon: Send,
    variant: 'primary',
    loading: submittingProjectId === project._id,
    onClick: () => onSubmit(project),
  };
}

function getReviewActions({ project, onApprove, onReject, onPublish, onDownload }) {
  if (isProjectReviewable(project?.status)) {
    return [
      onApprove && {
        key: 'approve',
        label: 'Approve',
        icon: Check,
        variant: 'primary',
        onClick: () => onApprove(project),
      },
      onReject && {
        key: 'reject',
        label: 'Reject',
        icon: AlertCircle,
        variant: 'secondary',
        danger: true,
        onClick: () => onReject(project),
      },
    ].filter(Boolean);
  }

  if (isProjectApproved(project?.status)) {
    return [
      onPublish && {
        key: 'publish',
        label: 'Publish',
        icon: Send,
        variant: 'primary',
        onClick: () => onPublish(project),
      },
    ].filter(Boolean);
  }

  if (isProjectPublished(project?.status)) {
    return [
      onDownload && {
        key: 'download',
        label: 'Download',
        icon: Download,
        variant: 'secondary',
        onClick: () => onDownload(project),
      },
    ].filter(Boolean);
  }

  return [];
}

export default function ProjectCard({
  project,
  mode = 'library',
  isDarkMode = false,
  onOpen,
  onRename,
  onDelete,
  onSubmit,
  submittingProjectId,
  onApprove,
  onReject,
  onPublish,
  onDownload,
  onActionComplete,
  actions,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [busyAction, setBusyAction] = useState(null);

  const id = getProjectId(project);
  const name = getProjectName(project);
  const statusLabel = getProjectStatusLabel(project?.status);
  const statusClass = getProjectStatusStyle(project?.status);
  const featureSource = getProjectFeatures(project);
  const owner = getProjectOwner(project);
  const isReviewMode = mode === 'review';
  const featureScope = isReviewMode ? 'admin' : 'user';

  const menuActions = actions ?? getDefaultMenuActions({ project, onRename, onDelete });
  const reviewActions = getReviewActions({ project, onApprove, onReject, onPublish, onDownload });
  const submitAction = !isReviewMode
    ? getSubmitAction({ project, onSubmit, submittingProjectId })
    : null;

  const runAction = async (action) => {
    try {
      setBusyAction(action.key || action.label);
      await action.onClick?.(project);
      onActionComplete?.();
    } catch (error) {
      console.error(error);
      alert(error.message || 'Action failed. Please try again.');
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <article className="group rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <div className="relative overflow-hidden rounded-t-2xl">
        <ProjectPreviewMap
          projectId={id}
          features={featureSource}
          featureScope={featureScope}
          height={isReviewMode ? 190 : 168}
          isDarkMode={isDarkMode}
          className="rounded-none border-0"
        />

        <div className="absolute right-3 top-3 z-10">
          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold shadow-sm backdrop-blur ${statusClass}`}>
            {statusLabel}
          </span>
        </div>

        <div className="absolute bottom-3 left-3 z-10">
          <span className="rounded-md border border-white/70 bg-white/85 px-2 py-0.5 text-[11px] font-black uppercase tracking-[0.12em] text-slate-600 shadow-sm backdrop-blur">
            {getProjectType(project)}
          </span>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-black text-slate-900" title={name}>
            {name}
          </h3>
          {owner && (
            <p className="mt-1 truncate text-xs font-semibold text-slate-500">
              {owner}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="font-bold text-slate-400">Forecast Date</p>
            <p className="mt-1 font-semibold text-slate-700">
              {formatDate(project?.forecastDate)}
            </p>
          </div>
          <div>
            <p className="font-bold text-slate-400">Updated</p>
            <p className="mt-1 font-semibold text-slate-700">
              {formatDate(project?.updatedAt || project?.submittedAt || project?.createdAt, 'MMM d, h:mm a')}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2">
            <Button size="sm" icon={ExternalLink} onClick={() => onOpen?.(project)}>
              {isReviewMode ? 'Review' : 'Open'}
            </Button>

            {submitAction && (
              <Button
                size="sm"
                variant="primary"
                icon={submitAction.icon}
                loading={submitAction.loading}
                onClick={() => runAction(submitAction)}
              >
                {submitAction.label}
              </Button>
            )}
          </div>

          {!isReviewMode && menuActions.length > 0 && (
            <div className="relative">
              <Button
                variant="icon"
                size="sm"
                icon={MoreHorizontal}
                aria-label={`More actions for ${name}`}
                onClick={() => setMenuOpen((value) => !value)}
              />

              {menuOpen && (
                <div className="absolute right-0 bottom-full mb-2 z-50 w-36 rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg">
                  {menuActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.key || action.label}
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          action.onClick?.(project);
                        }}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-left font-semibold hover:bg-slate-50 ${
                          action.danger ? 'text-red-600' : 'text-slate-700'
                        }`}
                      >
                        {Icon && <Icon size={14} aria-hidden="true" />}
                        {action.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {isReviewMode && reviewActions.length > 0 && (
            <div className="flex flex-1 justify-end gap-2">
              {reviewActions.map((action) => (
                <Button
                  key={action.key || action.label}
                  variant={action.danger ? 'secondary' : action.variant || 'secondary'}
                  size="sm"
                  icon={action.icon}
                  loading={busyAction === (action.key || action.label)}
                  onClick={() => runAction(action)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
