import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, FolderKanban, LayoutGrid, List, Plus } from "lucide-react";

import ProjectStats from "@/features/projects/components/project-library/ProjectStats";
import ProjectToolbar from "@/features/projects/components/project-library/ProjectToolbar";
import ProjectTable from "@/features/projects/components/project-library/ProjectTable";
import ProjectPagination from "@/features/projects/components/project-library/ProjectPagination";

import ProjectCard from "@/features/projects/components/ProjectCard";
import ProjectReviewModal from "@/features/projects/components/ProjectReviewModal";
import CreateProjectModal from "@/components/ui/modals/CreateProjectModal";
import Button from "@/components/ui/Button";

import { createProject } from "@/api/projectAPI";
import { useTheme } from "@/app/providers/ThemeProvider";
import { useProjectLibraryController } from "@/features/projects/hooks/useProjectLibraryController";
import { isProjectPublished } from "@/features/projects/projectStatuses";
import useCurrentDashboardUser from "@/shared/hooks/useCurrentDashboardUser";

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

function ViewToggle({ view, setView, isDarkMode }) {
  const buttonBase = "inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-black transition sm:flex-none";
  const activeClass = "bg-cyan-500 text-white shadow-sm";
  const inactiveClass = isDarkMode ? "text-slate-300 hover:bg-white/5" : "text-slate-600 hover:bg-slate-100";

  return (
    <div className={`grid w-full grid-cols-2 rounded-2xl border p-1 shadow-sm sm:inline-grid sm:w-auto ${isDarkMode ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white"}`}>
      <button
        type="button"
        aria-label="Show project cards"
        aria-pressed={view === "grid"}
        className={`${buttonBase} ${view === "grid" ? activeClass : inactiveClass}`}
        onClick={() => setView("grid")}
      >
        <LayoutGrid size={16} />
        <span>Cards</span>
      </button>
      <button
        type="button"
        aria-label="Show project list"
        aria-pressed={view === "list"}
        className={`${buttonBase} ${view === "list" ? activeClass : inactiveClass}`}
        onClick={() => setView("list")}
      >
        <List size={16} />
        <span>List</span>
      </button>
    </div>
  );
}

function ProjectViewControls({ isCreatingProject, isDarkMode, onCreateProject, role, setView, userName, view }) {
  const isAdmin = role === "admin";
  const message = `Welcome back, ${userName}.`;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className={`text-sm font-black ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>{message}</p>
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        {!isAdmin && (
          <Button icon={Plus} loading={isCreatingProject} disabled={isCreatingProject} onClick={onCreateProject}>
            New Project
          </Button>
        )}
        <ViewToggle view={view} setView={setView} isDarkMode={isDarkMode} />
      </div>
    </div>
  );
}

function getCreatedProjectId(project) {
  return project?._id || project?.id || project?.project?._id || project?.project?.id;
}

function getProjectId(project) {
  return project?._id || project?.id;
}

function getReviewModalProject(project) {
  if (!project) return project;
  return {
    ...project,
    reviewComment: undefined,
  };
}

function getWelcomeName(user, fallbackRole) {
  const name = String(user?.name || "").trim();
  if (!name || name.toLowerCase().startsWith("loading")) return fallbackRole;
  if (name.includes("@")) return name.split("@")[0];
  return name.split(" ")[0] || fallbackRole;
}

export default function ProjectLibraryPage({ role = "forecaster", title, description }) {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const controller = useProjectLibraryController({ role, title, description });
  const userOptions = useMemo(() => ({ roleOverride: role === "admin" ? "Administrator" : "Forecaster" }), [role]);
  const { user } = useCurrentDashboardUser(null, userOptions);
  const [view, setView] = useState("grid");
  const [reviewProject, setReviewProject] = useState(null);
  const [isStartingReview, setIsStartingReview] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");

  const { projects, loading, error, onRetry, onOpen, onRename, onDelete, onStartReview, onApprove, onReject, onPublish, mode } = controller.table;

  const handleOpen = async (project) => {
    setFeedbackError("");
    const projectId = getProjectId(project);
    if (!projectId) return;

    if (isProjectPublished(project?.status)) {
      navigate(`/forecasts/${projectId}`);
      return;
    }

    if (role === "admin") {
      setIsStartingReview(true);
      try {
        const updatedProject = await onStartReview?.(project);
        setReviewProject(updatedProject || project);
      } catch (err) {
        console.error("Failed to start review:", err);
        setFeedbackError(err?.message || "Failed to start project review.");
      } finally {
        setIsStartingReview(false);
      }
      return;
    }

    onOpen(project);
  };

  const handleCreateAndOpenProject = async ({ projectName, chartType, description: projectDescription, forecastDate }) => {
    const name = projectName?.trim();
    if (!name || isCreatingProject) return;
    setIsCreatingProject(true);
    setFeedbackError("");

    try {
      const createdProject = await createProject({ name, chartType, description: projectDescription, forecastDate });
      const projectId = getCreatedProjectId(createdProject);
      await onRetry?.();
      setShowCreateProjectModal(false);
      if (!projectId) throw new Error("Project was created, but the project ID was missing from the response.");
      navigate(`/studio/${projectId}`);
    } catch (err) {
      console.error("Failed to create project:", err);
      setFeedbackError(err?.message || "Failed to create project.");
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleReviewActionComplete = async (updatedProject) => {
    if (updatedProject) setReviewProject(updatedProject);
    await onRetry?.();
  };

  const tableProps = { ...controller.table, onOpen: handleOpen, isDarkMode };

  return (
    <div className={`min-h-full transition-colors ${isDarkMode ? "bg-[#0d1117]" : "bg-slate-50"}`}>
      <div className="mx-auto max-w-[1400px] space-y-5 p-4 sm:space-y-6 sm:p-6">
        <ProjectViewControls isCreatingProject={isCreatingProject} isDarkMode={isDarkMode} onCreateProject={() => setShowCreateProjectModal(true)} role={role} setView={setView} userName={getWelcomeName(user, role === "admin" ? "Admin" : "Forecaster")} view={view} />

        {feedbackError && (
          <div className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${isDarkMode ? "border-red-500/30 bg-red-950/30 text-red-300" : "border-red-200 bg-red-50 text-red-700"}`} role="alert">
            <span className="inline-flex items-start gap-2"><AlertCircle className="mt-0.5 shrink-0" size={17} />{feedbackError}</span>
            <button type="button" className={`shrink-0 text-xs font-black uppercase tracking-wide ${isDarkMode ? "text-red-200 hover:text-white" : "text-red-700 hover:text-red-900"}`} onClick={() => setFeedbackError("")}>Dismiss</button>
          </div>
        )}

        <ProjectStats {...controller.stats} isDarkMode={isDarkMode} />
        <ProjectToolbar {...controller.toolbar} isDarkMode={isDarkMode} />

        {view === "grid" && (
          <div>
            {loading && <GridState type="loading" isDarkMode={isDarkMode} />}
            {!loading && error && <GridState type="error" onRetry={onRetry} isDarkMode={isDarkMode} />}
            {!loading && !error && projects?.length === 0 && <GridState type="empty" isDarkMode={isDarkMode} />}
            {!loading && !error && projects?.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <ProjectCard key={project._id || project.id} project={project} mode={mode} isDarkMode={isDarkMode} onOpen={handleOpen} onRename={onRename} onDelete={onDelete} onApprove={onApprove} onReject={onReject} onPublish={onPublish} onActionComplete={onRetry} />
                ))}
              </div>
            )}
          </div>
        )}

        {view === "list" && <ProjectTable {...tableProps} />}
        <ProjectPagination {...controller.pagination} isDarkMode={isDarkMode} />
      </div>

      {controller.dialogs}

      {role !== "admin" && <CreateProjectModal visible={showCreateProjectModal} onClose={() => setShowCreateProjectModal(false)} onSubmit={handleCreateAndOpenProject} isDarkMode={isDarkMode} />}

      {isStartingReview && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 text-sm font-bold text-white backdrop-blur-sm">Starting review…</div>}

      {role === "admin" && (
        <ProjectReviewModal project={getReviewModalProject(reviewProject)} isDarkMode={isDarkMode} onClose={() => setReviewProject(null)} onApprove={onApprove} onReject={onReject} onPublish={onPublish} onActionComplete={handleReviewActionComplete} />
      )}
    </div>
  );
}
