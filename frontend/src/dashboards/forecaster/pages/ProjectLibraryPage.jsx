import { useState } from "react";
import { AlertCircle, FolderKanban, LayoutGrid, List, Plus } from "lucide-react";

import ProjectStats from "@dashboards/forecaster/components/project-library/ProjectStats";
import ProjectToolbar from "@dashboards/forecaster/components/project-library/ProjectToolbar";
import ProjectTable from "@dashboards/forecaster/components/project-library/ProjectTable";
import ProjectPagination from "@dashboards/forecaster/components/project-library/ProjectPagination";

import ProjectCard from "@/features/projects/components/ProjectCard";
import ProjectReviewModal from "@/features/projects/components/ProjectReviewModal";
import CreateProjectModal from "@/components/ui/modals/CreateProjectModal";
import Button from "@/components/ui/Button";

import { createProject } from "@/api/projectAPI";
import { useTheme } from "@/app/providers/ThemeProvider";
import { useProjectLibraryController } from "@dashboards/forecaster/hooks/useProjectLibraryController";

function ProjectCardSkeleton({ isDarkMode = false }) {
  const border = isDarkMode ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white";
  const block = isDarkMode ? "bg-slate-800" : "bg-slate-200";
  const blockSoft = isDarkMode ? "bg-slate-800/70" : "bg-slate-100";

  return (
    <div className={`overflow-hidden rounded-2xl border shadow-sm ${border}`}>
      <div className={`h-[168px] animate-pulse ${block}`} />
      <div className="space-y-4 p-4">
        <div className="space-y-2">
          <div className={`h-4 w-2/3 animate-pulse rounded ${block}`} />
          <div className={`h-3 w-1/3 animate-pulse rounded ${blockSoft}`} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className={`h-9 animate-pulse rounded ${blockSoft}`} />
          <div className={`h-9 animate-pulse rounded ${blockSoft}`} />
        </div>
        <div className={`h-10 animate-pulse rounded ${blockSoft}`} />
      </div>
    </div>
  );
}

function GridState({ type, onRetry, isDarkMode = false }) {
  if (type === "loading") {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <ProjectCardSkeleton key={index} isDarkMode={isDarkMode} />
        ))}
      </div>
    );
  }

  if (type === "error") {
    return (
      <div className={`flex items-center justify-between rounded-2xl border p-6 text-sm ${isDarkMode ? "border-red-500/30 bg-red-950/30 text-red-300" : "border-red-200 bg-red-50 text-red-700"}`}>
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
    <div className={`rounded-2xl border p-12 text-center shadow-sm ${isDarkMode ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white"}`}>
      <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${isDarkMode ? "bg-cyan-500/10 text-cyan-300" : "bg-blue-50 text-blue-600"}`}>
        <FolderKanban size={26} />
      </div>
      <h3 className={`mt-4 text-base font-black ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>No projects found</h3>
      <p className={`mt-1 text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
        Try clearing filters or changing your search terms.
      </p>
    </div>
  );
}

function getCreatedProjectId(project) {
  return project?._id || project?.id || project?.project?._id || project?.project?.id;
}

export default function ProjectLibraryPage({ role = "forecaster", title, description }) {
  const { isDarkMode } = useTheme();
  const controller = useProjectLibraryController({ role, title, description });
  const [view, setView] = useState("grid");
  const [reviewProject, setReviewProject] = useState(null);
  const [isStartingReview, setIsStartingReview] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

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
        window.alert(err?.message || 'Failed to start project review.');
      } finally {
        setIsStartingReview(false);
      }
      return;
    }
    onOpen(project);
  };

  const handleCreateAndOpenProject = async ({
    projectName,
    chartType,
    description: projectDescription,
    forecastDate,
  }) => {
    const name = projectName?.trim();
    if (!name || isCreatingProject) return;

    setIsCreatingProject(true);

    try {
      const createdProject = await createProject({
        name,
        chartType,
        description: projectDescription,
        forecastDate,
      });
      const projectId = getCreatedProjectId(createdProject);

      await onRetry?.();
      setShowCreateProjectModal(false);

      if (!projectId) {
        throw new Error("Project was created, but the project ID was missing from the response.");
      }

      window.location.href = `/studio/${projectId}`;
    } catch (err) {
      console.error("Failed to create project:", err);
      window.alert(err?.message || "Failed to create project.");
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleReviewActionComplete = async (updatedProject) => {
    if (updatedProject) {
      setReviewProject(updatedProject);
    }
    await onRetry?.();
  };

  const tableProps = {
    ...controller.table,
    onOpen: handleOpen,
    isDarkMode,
  };

  return (
    <div className={`min-h-full transition-colors ${isDarkMode ? "bg-[#0d1117]" : "bg-slate-50"}`}>
      <div className="mx-auto max-w-[1400px] space-y-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className={`text-2xl font-black ${isDarkMode ? "text-slate-50" : "text-slate-900"}`}>
              {controller.header.title}
            </h1>
            <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              {controller.header.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {role !== "admin" && (
              <Button
                icon={Plus}
                loading={isCreatingProject}
                disabled={isCreatingProject}
                onClick={() => setShowCreateProjectModal(true)}
              >
                New Project
              </Button>
            )}

            <div className={`inline-flex w-fit rounded-2xl border p-1 shadow-sm ${isDarkMode ? "border-white/10 bg-slate-900" : "border-slate-200 bg-white"}`}>
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
        </div>

        <ProjectStats {...controller.stats} isDarkMode={isDarkMode} />

        <ProjectToolbar {...controller.toolbar} isDarkMode={isDarkMode} />

        {view === "grid" && (
          <div>
            {loading && <GridState type="loading" isDarkMode={isDarkMode} />}

            {!loading && error && <GridState type="error" onRetry={onRetry} isDarkMode={isDarkMode} />}

            {!loading && !error && projects?.length === 0 && <GridState type="empty" isDarkMode={isDarkMode} />}

            {!loading && !error && projects?.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((p) => (
                  <ProjectCard
                    key={p._id || p.id}
                    project={p}
                    mode={mode}
                    isDarkMode={isDarkMode}
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
          <ProjectTable {...tableProps} />
        )}

        <ProjectPagination {...controller.pagination} isDarkMode={isDarkMode} />
      </div>

      {controller.dialogs}

      {role !== "admin" && (
        <CreateProjectModal
          visible={showCreateProjectModal}
          onClose={() => setShowCreateProjectModal(false)}
          onSubmit={handleCreateAndOpenProject}
          isDarkMode={isDarkMode}
        />
      )}

      {isStartingReview && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 text-sm font-bold text-white backdrop-blur-sm">
          Starting review…
        </div>
      )}

      {role === 'admin' && (
        <ProjectReviewModal
          project={reviewProject}
          isDarkMode={isDarkMode}
          onClose={() => setReviewProject(null)}
          onApprove={onApprove}
          onReject={onReject}
          onPublish={onPublish}
          onActionComplete={handleReviewActionComplete}
        />
      )}
    </div>
  );
}
