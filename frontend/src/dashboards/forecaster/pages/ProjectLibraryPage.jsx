import { useState } from "react";
import { AlertCircle, FolderKanban, LayoutGrid, List } from "lucide-react";

import ProjectStats from "@dashboards/forecaster/components/project-library/ProjectStats";
import ProjectToolbar from "@dashboards/forecaster/components/project-library/ProjectToolbar";
import ProjectTable from "@dashboards/forecaster/components/project-library/ProjectTable";
import ProjectPagination from "@dashboards/forecaster/components/project-library/ProjectPagination";

import ProjectCard from "@/features/projects/components/ProjectCard";
import ProjectReviewModal from "@/features/projects/components/ProjectReviewModal";
import Button from "@/components/ui/Button";

import { useProjectLibraryController } from "@dashboards/forecaster/hooks/useProjectLibraryController";

function ProjectCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="h-[168px] animate-pulse bg-slate-200" />
      <div className="space-y-4 p-4">
        <div className="space-y-2">
          <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-9 animate-pulse rounded bg-slate-100" />
          <div className="h-9 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="h-10 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  );
}

function GridState({ type, onRetry }) {
  if (type === "loading") {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <ProjectCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (type === "error") {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        <span className="inline-flex items-center gap-2 font-semibold">
          <AlertCircle size={18} />
          Failed to load projects.
        </span>
        <Button variant="ghost" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <FolderKanban size={26} />
      </div>
      <h3 className="mt-4 text-base font-black text-slate-900">No projects found</h3>
      <p className="mt-1 text-sm text-slate-500">
        Try clearing filters or changing your search terms.
      </p>
    </div>
  );
}

export default function ProjectLibraryPage({ role = "forecaster", title, description }) {
  const controller = useProjectLibraryController({ role, title, description });
  const [view, setView] = useState("grid");
  const [reviewProject, setReviewProject] = useState(null);
  const [isStartingReview, setIsStartingReview] = useState(false);

  const {
    projects,
    loading,
    error,
    onRetry,
    onOpen,
    onRename,
    onDelete,
    onStartReview,
    onApprove,
    onReject,
    onPublish,
    mode,
  } = controller.table;

  const handleOpen = async (project) => {
    if (role === 'admin') {
      setIsStartingReview(true);
      try {
        const updatedProject = await onStartReview?.(project);
        setReviewProject(updatedProject || project);
      } catch (err) {
        console.error('Failed to start review:', err);
        setReviewProject(project);
      } finally {
        setIsStartingReview(false);
      }
      return;
    }
    onOpen(project);
  };

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-[1400px] space-y-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              {controller.header.title}
            </h1>
            <p className="text-sm text-slate-500">
              {controller.header.description}
            </p>
          </div>

          <div className="inline-flex w-fit rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            <Button
              aria-label="Show project cards"
              variant={view === "grid" ? "primary" : "ghost"}
              size="sm"
              icon={LayoutGrid}
              onClick={() => setView("grid")}
            />
            <Button
              aria-label="Show project list"
              variant={view === "list" ? "primary" : "ghost"}
              size="sm"
              icon={List}
              onClick={() => setView("list")}
            />
          </div>
        </div>

        <ProjectStats {...controller.stats} />

        <ProjectToolbar {...controller.toolbar} />

        {view === "grid" && (
          <div>
            {loading && <GridState type="loading" />}

            {!loading && error && <GridState type="error" onRetry={onRetry} />}

            {!loading && !error && projects?.length === 0 && <GridState type="empty" />}

            {!loading && !error && projects?.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((p) => (
                  <ProjectCard
                    key={p._id || p.id}
                    project={p}
                    mode={mode}
                    onOpen={handleOpen}
                    onRename={onRename}
                    onDelete={onDelete}
                    onApprove={onApprove}
                    onReject={onReject}
                    onPublish={onPublish}
                    onActionComplete={onRetry}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {view === "list" && (
          <ProjectTable {...controller.table} />
        )}

        <ProjectPagination {...controller.pagination} />
      </div>

      {controller.dialogs}

      {isStartingReview && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 text-sm font-bold text-white backdrop-blur-sm">
          Starting review…
        </div>
      )}

      {role === 'admin' && (
        <ProjectReviewModal
          project={reviewProject}
          onClose={() => setReviewProject(null)}
          onApprove={onApprove}
          onReject={onReject}
          onPublish={onPublish}
          onActionComplete={onRetry}
        />
      )}
    </div>
  );
}
