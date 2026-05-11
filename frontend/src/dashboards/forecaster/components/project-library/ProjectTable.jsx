import { format } from "date-fns";
import { ExternalLink, MessageSquareText, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import Button from "@/components/ui/Button";
import {
  canEditProjectStatus,
  getProjectStatusLabel,
  getProjectStatusStyle,
  isProjectRevisionRequested,
} from "@/features/projects/projectStatuses";

function formatDate(value, pattern = "MMM d, yyyy") {
  if (!value) return "-";

  try {
    return format(new Date(value), pattern);
  } catch {
    return "-";
  }
}

function getProjectId(project) {
  return project?._id || project?.id;
}

function getStatus(project) {
  const needsRevision = isProjectRevisionRequested(project.status);
  return {
    needsRevision,
    label: needsRevision ? "Needs Revision" : getProjectStatusLabel(project.status),
    className: needsRevision
      ? "bg-amber-50 text-amber-800 border-amber-300"
      : getProjectStatusStyle(project.status),
  };
}

function getOpenActionLabel({ isReviewMode, needsRevision, compact = false }) {
  if (isReviewMode) return "Review";
  if (needsRevision) return compact ? "Revise" : "Open and Revise";
  return "Open";
}

function ProjectMobileRow({
  project,
  isDarkMode,
  isReviewMode,
  active,
  setActive,
  onOpen,
  onRename,
  onDelete,
}) {
  const projectId = getProjectId(project);
  const status = getStatus(project);
  const latestRemarks = project.latestReviewRemarks;
  const canManageProject = !isReviewMode && canEditProjectStatus(project.status);
  const hasMenuActions = canManageProject && Boolean(onRename || onDelete);

  return (
    <article className={`rounded-2xl border p-4 shadow-sm ${isDarkMode ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white"} ${status.needsRevision ? (isDarkMode ? "ring-1 ring-amber-400/20" : "ring-1 ring-amber-100") : ""}`}>
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm font-black ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>{project.name}</p>
          <p className={`mt-1 truncate text-[11px] font-black uppercase tracking-[0.16em] ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
            {project.chartType || "Forecast"}
          </p>
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-1 text-[11px] font-bold ${status.className}`}>
          {status.label}
        </span>
      </div>

      {status.needsRevision && latestRemarks?.comment && (
        <p className={`mt-3 flex items-start gap-1.5 text-xs font-semibold leading-relaxed ${isDarkMode ? "text-amber-300" : "text-amber-800"}`}>
          <MessageSquareText size={13} className="mt-0.5 shrink-0" />
          <span className="line-clamp-2">{latestRemarks.comment}</span>
        </p>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
        {isReviewMode && (
          <div className="min-w-0">
            <dt className={`font-bold ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Owner</dt>
            <dd className={`mt-1 truncate font-semibold ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>{project.ownerDisplay || "Project Owner"}</dd>
          </div>
        )}
        <div className="min-w-0">
          <dt className={`font-bold ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Forecast Date</dt>
          <dd className={`mt-1 truncate font-semibold ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>{formatDate(project.forecastDate)}</dd>
        </div>
        <div className="min-w-0">
          <dt className={`font-bold ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Updated</dt>
          <dd className={`mt-1 truncate font-semibold ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
            {formatDate(project.updatedAt || project.submittedAt || project.createdAt, "MMM d, h:mm a")}
          </dd>
        </div>
      </dl>

      <div className={`relative mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-t pt-4 ${isDarkMode ? "border-white/10" : "border-slate-100"}`}>
        <Button className="w-full min-w-0" size="sm" icon={ExternalLink} onClick={() => onOpen(project)}>
          {getOpenActionLabel({ isReviewMode, needsRevision: status.needsRevision, compact: true })}
        </Button>

        {hasMenuActions && (
          <Button
            className="shrink-0"
            variant="icon"
            size="sm"
            icon={MoreHorizontal}
            aria-label={`More actions for ${project.name}`}
            onClick={() => setActive(active === projectId ? null : projectId)}
          />
        )}

        {hasMenuActions && active === projectId && (
          <div className={`absolute right-0 bottom-full z-50 mb-2 w-36 rounded-lg border py-1 text-sm shadow-lg ${isDarkMode ? "border-white/10 bg-slate-950" : "border-slate-200 bg-white"}`}>
            {onRename && (
              <button
                type="button"
                onClick={() => {
                  setActive(null);
                  onRename(project);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left font-semibold ${isDarkMode ? "text-slate-200 hover:bg-white/5" : "text-slate-700 hover:bg-slate-50"}`}
              >
                <Pencil size={14} aria-hidden="true" />
                Rename
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  setActive(null);
                  onDelete(project);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left font-semibold text-red-500 hover:bg-red-500/10"
              >
                <Trash2 size={14} aria-hidden="true" />
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export default function ProjectTable({
  projects,
  loading,
  error,
  onRetry,
  onOpen,
  onRename,
  onDelete,
  mode = "library",
  isDarkMode = false,
}) {
  const [active, setActive] = useState(null);
  const isReviewMode = mode === "review";

  if (loading) {
    return (
      <div className={`rounded-xl border p-6 text-sm ${isDarkMode ? "border-white/10 bg-slate-900/80 text-slate-400" : "border-slate-200 bg-white text-slate-500"}`}>
        Loading projects...
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-between rounded-xl border p-6 text-sm ${isDarkMode ? "border-red-500/30 bg-red-950/30 text-red-300" : "border-red-200 bg-red-50 text-red-600"}`}>
        Failed to load projects
        <Button variant="ghost" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className={`rounded-xl border p-10 text-center text-sm ${isDarkMode ? "border-white/10 bg-slate-900/80 text-slate-400" : "border-slate-200 bg-white text-slate-500"}`}>
        No projects found
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {projects.map((project) => (
          <ProjectMobileRow
            key={getProjectId(project)}
            project={project}
            isDarkMode={isDarkMode}
            isReviewMode={isReviewMode}
            active={active}
            setActive={setActive}
            onOpen={onOpen}
            onRename={onRename}
            onDelete={onDelete}
          />
        ))}
      </div>

      <div className={`hidden overflow-x-auto rounded-xl border md:block ${isDarkMode ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white"}`}>
        <table className="w-full table-fixed text-sm">
          <thead className={isDarkMode ? "bg-slate-950/70 font-semibold text-slate-300" : "bg-slate-50 font-semibold text-slate-600"}>
            <tr>
              <th className="w-[34%] px-4 py-3 text-left">Forecast Project</th>
              {isReviewMode && <th className="w-[16%] px-4 py-3 text-left">Owner</th>}
              <th className="w-[14%] px-4 py-3 text-left">Forecast Date</th>
              <th className="w-[14%] px-4 py-3 text-left">Status</th>
              <th className="w-[16%] px-4 py-3 text-left">Last Updated</th>
              <th className="w-[120px] px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {projects.map((project) => {
              const projectId = getProjectId(project);
              const status = getStatus(project);
              const latestRemarks = project.latestReviewRemarks;
              const canManageProject = !isReviewMode && canEditProjectStatus(project.status);
              const hasMenuActions = canManageProject && Boolean(onRename || onDelete);

              return (
                <tr key={projectId} className={`border-t transition ${isDarkMode ? "border-white/10 hover:bg-white/5" : "border-slate-100 hover:bg-slate-50"} ${status.needsRevision ? (isDarkMode ? "bg-amber-500/5" : "bg-amber-50/30") : ""}`}>
                  <td className="min-w-0 px-4 py-3">
                    <p className={`truncate font-semibold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`} title={project.name}>{project.name}</p>
                    <p className={`mt-0.5 truncate text-xs font-semibold uppercase tracking-[0.12em] ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                      {project.chartType || "Forecast"}
                    </p>
                    {status.needsRevision && latestRemarks?.comment && (
                      <p className={`mt-2 flex max-w-md items-start gap-1.5 text-xs font-semibold leading-relaxed ${isDarkMode ? "text-amber-300" : "text-amber-800"}`}>
                        <MessageSquareText size={13} className="mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{latestRemarks.comment}</span>
                      </p>
                    )}
                  </td>

                  {isReviewMode && (
                    <td className={`min-w-0 px-4 py-3 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                      <span className="block truncate">{project.ownerDisplay || "Project Owner"}</span>
                    </td>
                  )}

                  <td className={`px-4 py-3 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                    <span className="block truncate">{formatDate(project.forecastDate)}</span>
                  </td>

                  <td className="px-4 py-3">
                    <span className={`inline-flex max-w-full truncate rounded-full border px-2.5 py-1 text-xs font-bold ${status.className}`}>
                      {status.label}
                    </span>
                  </td>

                  <td className={`px-4 py-3 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                    <span className="block truncate">{formatDate(project.updatedAt || project.submittedAt || project.createdAt, "MMM d, yyyy hh:mm a")}</span>
                  </td>

                  <td className="relative px-4 py-3 text-right">
                    <div className="inline-flex max-w-full items-center justify-end gap-2">
                      <Button className="shrink-0" size="sm" onClick={() => onOpen(project)} icon={ExternalLink}>
                        {getOpenActionLabel({ isReviewMode, needsRevision: status.needsRevision, compact: true })}
                      </Button>

                      {hasMenuActions && (
                        <Button
                          className="shrink-0"
                          variant="icon"
                          size="sm"
                          icon={MoreHorizontal}
                          aria-label={`More actions for ${project.name}`}
                          onClick={() => setActive(active === projectId ? null : projectId)}
                        />
                      )}
                    </div>

                    {hasMenuActions && active === projectId && (
                      <div className={`absolute right-4 bottom-full z-50 mb-2 w-36 rounded-lg border py-1 text-sm shadow-lg ${isDarkMode ? "border-white/10 bg-slate-950" : "border-slate-200 bg-white"}`}>
                        {onRename && (
                          <button
                            type="button"
                            onClick={() => {
                              setActive(null);
                              onRename(project);
                            }}
                            className={`flex w-full items-center gap-2 px-3 py-2 text-left font-semibold ${isDarkMode ? "text-slate-200 hover:bg-white/5" : "text-slate-700 hover:bg-slate-50"}`}
                          >
                            <Pencil size={14} aria-hidden="true" />
                            Rename
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => {
                              setActive(null);
                              onDelete(project);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left font-semibold text-red-500 hover:bg-red-500/10"
                          >
                            <Trash2 size={14} aria-hidden="true" />
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
