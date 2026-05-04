import { format } from "date-fns";
import { ExternalLink, MessageSquareText, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import Button from "@/components/ui/Button";
import {
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
  const hasMenuActions = Boolean(onRename || onDelete);

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
    <div className={`overflow-x-auto rounded-xl border ${isDarkMode ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white"}`}>
      <table className="w-full text-sm">
        <thead className={isDarkMode ? "bg-slate-950/70 font-semibold text-slate-300" : "bg-slate-50 font-semibold text-slate-600"}>
          <tr>
            <th className="px-4 py-3 text-left">Forecast Project</th>
            {isReviewMode && <th className="px-4 py-3 text-left">Owner</th>}
            <th className="px-4 py-3 text-left">Forecast Date</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Last Updated</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {projects.map((project) => {
            const projectId = getProjectId(project);
            const needsRevision = isProjectRevisionRequested(project.status);
            const statusLabel = needsRevision ? "Needs Revision" : getProjectStatusLabel(project.status);
            const statusClass = needsRevision
              ? "bg-amber-50 text-amber-800 border-amber-300"
              : getProjectStatusStyle(project.status);
            const latestRemarks = project.latestReviewRemarks;

            return (
              <tr key={projectId} className={`border-t transition ${isDarkMode ? "border-white/10 hover:bg-white/5" : "border-slate-100 hover:bg-slate-50"} ${needsRevision ? (isDarkMode ? "bg-amber-500/5" : "bg-amber-50/30") : ""}`}>
                <td className="px-4 py-3">
                  <p className={`font-semibold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>{project.name}</p>
                  <p className={`mt-0.5 text-xs font-semibold uppercase tracking-[0.12em] ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                    {project.chartType || "Forecast"}
                  </p>
                  {needsRevision && latestRemarks?.comment && (
                    <p className={`mt-2 flex max-w-md items-start gap-1.5 text-xs font-semibold leading-relaxed ${isDarkMode ? "text-amber-300" : "text-amber-800"}`}>
                      <MessageSquareText size={13} className="mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{latestRemarks.comment}</span>
                    </p>
                  )}
                </td>

                {isReviewMode && (
                  <td className={`px-4 py-3 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                    {project.ownerDisplay || "Project Owner"}
                  </td>
                )}

                <td className={`px-4 py-3 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                  {formatDate(project.forecastDate)}
                </td>

                <td className="px-4 py-3">
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass}`}>
                    {statusLabel}
                  </span>
                </td>

                <td className={`px-4 py-3 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                  {formatDate(project.updatedAt || project.submittedAt || project.createdAt, "MMM d, yyyy hh:mm a")}
                </td>

                <td className="relative px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" onClick={() => onOpen(project)} icon={ExternalLink}>
                      {isReviewMode ? "Review" : needsRevision ? "Open and Revise" : "Open"}
                    </Button>

                    {hasMenuActions && (
                      <Button
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
  );
}
