import { format } from 'date-fns';
import {
  Download,
  ExternalLink,
  MessageSquareText,
  MoreHorizontal,
  Pencil,
  Send,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { useState } from 'react';

import Button from '@/components/ui/Button';
import ProjectPreviewMap from '@/features/projects/components/ProjectPreviewMap';
import {
  PROJECT_STATUS,
  canEditProjectStatus,
  canSubmitProjectStatus,
  getProjectStatusLabel,
  getProjectStatusStyle,
  isProjectApproved,
  isProjectPublished,
  isProjectReviewable,
  isProjectRevisionRequested,
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
  return project?.primaryChartId || project?._id || project?.id;
}

function getPreviewCacheProjectId(project) {
  const id = getProjectId(project);
  if (!id) return id;

  const cacheToken = project?.updatedAt || project?.submittedAt || project?.reviewedAt || project?.publishedAt || project?.version || 'initial';
  return `${id}:${cacheToken}`;
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

function getLatestRemark(project) {
  return project?.latestReviewRemarks?.comment || project?.reviewComment || '';
}

function getPrimaryOpenLabel({ project, isReviewMode, needsRevision }) {
  if (isProjectPublished(project?.status)) return 'View Forecast';
  if (isReviewMode) return 'Review';
  if (needsRevision) return 'Open and Revise';
  return 'Open';
}

function getDefaultMenuActions({ project, onRename, onDelete }) {
  if (!canEditProjectStatus(project?.status)) return [];

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
  const needsRevision = isProjectRevisionRequested(project.status);

  return {
    key: isInitialSubmit ? 'submit' : 'resubmit',
    label: isInitialSubmit ? 'Submit' : needsRevision ? 'Resubmit Revision' : 'Resubmit',
    icon: Send,
    variant: 'primary',
    loading: submittingProjectId === project._id,
    onClick: () => onSubmit(project),
  };
}

function getReviewActions({ project, onPublish, onDownload }) {
  if (isProjectReviewable(project?.status)) {
    return [];
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

function MetadataItem({ label, value, isDarkMode }) {
  return (
    <div className="min-w-0">
      <p className={`font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
      <p className={`mt-1 truncate font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`} title={value}>
        {value}
      </p>
    </div>
  );
}

function RemarksPanel({ remark, needsRevision, isDarkMode }) {
  const hasRemark = Boolean(remark?.trim());
  const label = needsRevision || hasRemark ? 'Latest admin remarks' : 'Review remarks';
  const message = hasRemark ? remark : 'No admin remarks yet';

  const panelClass = hasRemark
    ? isDarkMode
      ? 'border-amber-400/30 bg-amber-950/30'
      : 'border-amber-200 bg-amber-50'
    : isDarkMode
      ? 'border-white/10 bg-slate-950/45'
      : 'border-slate-200 bg-slate-50';
  const labelClass = hasRemark
    ? isDarkMode ? 'text-amber-300' : 'text-amber-700'
    : isDarkMode ? 'text-slate-500' : 'text-slate-400';
  const textClass = hasRemark
    ? isDarkMode ? 'text-amber-100' : 'text-amber-900'
    : isDarkMode ? 'text-slate-500' : 'text-slate-500';

  return (
    <div className={`min-h-[76px] min-w-0 rounded-xl border p-3 text-sm ${panelClass}`}>
      <p className={`flex min-w-0 items-center gap-2 text-xs font-black uppercase tracking-[0.14em] ${labelClass}`}>
        <MessageSquareText size={14} className="shrink-0" />
        <span className="truncate">{label}</span>
      </p>
      <p className={`mt-1 line-clamp-2 font-semibold leading-relaxed ${textClass}`}>
        {message}
      </p>
    </div>
  );
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
  onPublish,
  onDownload,
  onActionComplete,
  actions,
  onSelect,
  isSelected,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [busyAction, setBusyAction] = useState(null);
  const [actionError, setActionError] = useState('');

  const previewProjectId = getPreviewCacheProjectId(project);
  const name = getProjectName(project);
  const needsRevision = isProjectRevisionRequested(project?.status);
  const statusLabel = needsRevision ? 'Needs Revision' : getProjectStatusLabel(project?.status);
  const statusClass = getProjectStatusStyle(project?.status);
  const featureSource = getProjectFeatures(project);
  const owner = getProjectOwner(project);
  const isReviewMode = mode === 'review';
  const featureScope = isReviewMode ? 'admin' : 'user';
  const latestRemark = getLatestRemark(project);

  const menuActions = actions ?? getDefaultMenuActions({ project, onRename, onDelete });
  const reviewActions = getReviewActions({ project, onPublish, onDownload });
  const submitAction = !isReviewMode
    ? getSubmitAction({ project, onSubmit, submittingProjectId })
    : null;

  const runAction = async (action) => {
    setActionError('');

    try {
      setBusyAction(action.key || action.label);
      await action.onClick?.(project);
      onActionComplete?.();
    } catch (error) {
      console.error(error);
      setActionError(error.message || 'Action failed. Please try again.');
    } finally {
      setBusyAction(null);
    }
  };

  const cardClass = isDarkMode
    ? `bg-slate-900/80 ${needsRevision ? 'border-orange-400/50 ring-2 ring-orange-400/15' : 'border-white/10 hover:border-cyan-400/30'}`
    : `bg-white ${needsRevision ? 'border-orange-300 ring-2 ring-orange-100' : 'border-slate-200 hover:border-blue-200'}`;

  return (
    <article
      onClick={() => onSelect?.(project)}
      className={`group cursor-pointer flex h-full flex-col overflow-hidden rounded-2xl border shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl
        ${isSelected ? "ring-2 ring-cyan-500 border-cyan-500" : ""}
        ${cardClass}
      `}
    >
      <div className="relative shrink-0 overflow-hidden rounded-t-2xl">
        <ProjectPreviewMap
          projectId={previewProjectId}
          features={featureSource}
          featureScope={featureScope}
          height={isReviewMode ? 190 : 168}
          isDarkMode={isDarkMode}
          className="rounded-none border-0"
          showLabels={false}
        />

        <div className="absolute right-2 top-2 z-10 max-w-[calc(100%-16px)] sm:right-3 sm:top-3">
          <span className={`inline-flex max-w-full shrink-0 truncate rounded-full border px-2 py-1 text-[11px] font-bold shadow-sm backdrop-blur sm:px-2.5 sm:text-xs ${statusClass}`}>
            {statusLabel}
          </span>
        </div>

        <div className="absolute bottom-3 left-3 z-10 max-w-[calc(100%-24px)]">
          <span className={`inline-flex max-w-full truncate rounded-md border px-2 py-0.5 text-[11px] font-black uppercase tracking-[0.12em] shadow-sm backdrop-blur ${isDarkMode ? 'border-white/10 bg-slate-950/80 text-slate-300' : 'border-white/70 bg-white/85 text-slate-600'}`}>
            {getProjectType(project)}
          </span>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="min-w-0 space-y-4">
          <div className="min-w-0">
            <h3 className={`line-clamp-2 min-h-[2.5rem] text-base font-black leading-tight ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`} title={name}>
              {name}
            </h3>
            <p className={`mt-1 min-h-[1rem] truncate text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} title={owner || undefined}>
              {owner || '—'}
            </p>
          </div>

          <RemarksPanel
            remark={latestRemark}
            needsRevision={needsRevision}
            isDarkMode={isDarkMode}
          />

          {actionError && (
            <div className={`flex items-start justify-between gap-3 rounded-xl border px-3 py-2 text-xs font-semibold ${isDarkMode ? 'border-red-500/30 bg-red-950/30 text-red-300' : 'border-red-200 bg-red-50 text-red-700'}`} role="alert">
              <span className="inline-flex items-start gap-2">
                <AlertCircle className="mt-0.5 shrink-0" size={14} />
                {actionError}
              </span>
              <button
                type="button"
                className={`shrink-0 font-black uppercase tracking-wide ${isDarkMode ? 'text-red-200 hover:text-white' : 'text-red-700 hover:text-red-900'}`}
                onClick={() => setActionError('')}
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="grid min-h-[48px] grid-cols-1 gap-3 text-xs sm:grid-cols-2">
            <MetadataItem
              label="Forecast Date"
              value={formatDate(project?.forecastDate)}
              isDarkMode={isDarkMode}
            />
            <MetadataItem
              label="Updated"
              value={formatDate(project?.updatedAt || project?.submittedAt || project?.createdAt, 'MMM d, h:mm a')}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>

        <div className={`mt-auto flex min-w-0 flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
          <div className="grid min-w-0 grid-cols-1 gap-2 sm:flex sm:items-center">
            <Button size="sm" icon={ExternalLink}
              onClick={(e) => {
                e.stopPropagation();
                onOpen?.(project);
              }}>
              {getPrimaryOpenLabel({ project, isReviewMode, needsRevision })}
            </Button>

            {submitAction && (
              <Button
                size="sm"
                variant="primary"
                icon={submitAction.icon}
                loading={submitAction.loading}
                onClick={(e) => {
                  e.stopPropagation();
                  runAction(submitAction);
                }}
              >
                {submitAction.label}
              </Button>
            )}
          </div>

          {!isReviewMode && menuActions.length > 0 && (
            <div className="relative self-end sm:self-auto">
              <Button
                variant="icon"
                size="sm"
                icon={MoreHorizontal}
                aria-label={`More actions for ${name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((value) => !value);
                }}
              />

              {menuOpen && (
                <div className={`absolute right-0 bottom-full mb-2 z-50 w-36 rounded-lg border py-1 text-sm shadow-lg ${isDarkMode ? 'border-white/10 bg-slate-950' : 'border-slate-200 bg-white'}`}>
                  {menuActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.key || action.label}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(false);
                          action.onClick?.(project);
                        }}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-left font-semibold ${action.danger
                          ? 'text-red-500 hover:bg-red-500/10'
                          : isDarkMode
                            ? 'text-slate-200 hover:bg-white/5'
                            : 'text-slate-700 hover:bg-slate-50'
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
            <div className="grid w-full min-w-0 grid-cols-1 gap-2 sm:flex sm:flex-1 sm:flex-wrap sm:justify-end">
              {reviewActions.map((action) => (
                <Button
                  key={action.key || action.label}
                  variant={
                    action.danger
                      ? "secondary"
                      : action.variant || "secondary"
                  }
                  size="sm"
                  icon={action.icon}
                  loading={
                    busyAction ===
                    (action.key || action.label)
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    runAction(action);
                  }}
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
