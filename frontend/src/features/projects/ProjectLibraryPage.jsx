import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CalendarCheck, CheckCircle2, FolderKanban, LayoutGrid, List, Plus } from "lucide-react";

import ProjectStats from "@/features/projects/components/project-library/ProjectStats";
import ProjectToolbar from "@/features/projects/components/project-library/ProjectToolbar";
import ProjectTable from "@/features/projects/components/project-library/ProjectTable";
import ProjectPagination from "@/features/projects/components/project-library/ProjectPagination";

import ProjectCard from "@/features/projects/components/ProjectCard";
import ProjectReviewModal from "@/features/projects/components/ProjectReviewModal";
import CreateProjectModal from "@/components/ui/modals/CreateProjectModal";
import Button from "@/components/ui/Button";

import { createProject, fetchAdminForecastPackage } from "@/api/projectAPI";
import { useTheme } from "@/app/providers/ThemeProvider";
import { useProjectLibraryController } from "@/features/projects/hooks/useProjectLibraryController";
import { PROJECT_STATUS, getProjectStatusLabel, isProjectPublished } from "@/features/projects/projectStatuses";
import { adaptProjects } from "@/features/projects/projectAdapter";
import useCurrentDashboardUser from "@/shared/hooks/useCurrentDashboardUser";

const CHART_ORDER = ["analysis", "forecast_24h", "forecast_36h", "forecast_48h"];
const CHART_LABELS = {
  analysis: "Wave Analysis",
  forecast_24h: "24h Forecast",
  forecast_36h: "36h Forecast",
  forecast_48h: "48h Forecast",
};

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
      <button type="button" aria-label="Show project cards" aria-pressed={view === "grid"} className={`${buttonBase} ${view === "grid" ? activeClass : inactiveClass}`} onClick={() => setView("grid")}>
        <LayoutGrid size={16} />
        <span>Cards</span>
      </button>
      <button type="button" aria-label="Show project list" aria-pressed={view === "list"} className={`${buttonBase} ${view === "list" ? activeClass : inactiveClass}`} onClick={() => setView("list")}>
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

function getProjectName(project) {
  return project?.name || project?.title || "Untitled project";
}

function getForecastDateKey(project) {
  const date = new Date(project?.forecastDate || project?.issuedAt || project?.createdAt || 0);
  if (Number.isNaN(date.getTime())) return "unknown";
  return date.toISOString().slice(0, 10);
}

function getChartType(project) {
  return project?.chartType || project?.type || "";
}

function getChartSortValue(project) {
  const index = CHART_ORDER.indexOf(getChartType(project));
  return index === -1 ? CHART_ORDER.length : index;
}

function formatForecastDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No forecast date";
  return new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric", year: "numeric" }).format(date);
}

function getPackageProgress(projects) {
  return projects.reduce((counts, project) => {
    if ([PROJECT_STATUS.SUBMITTED, PROJECT_STATUS.UNDER_REVIEW].includes(project.status)) counts.needsReview += 1;
    if ([PROJECT_STATUS.APPROVED, PROJECT_STATUS.PUBLISHED].includes(project.status)) counts.approved += 1;
    if ([PROJECT_STATUS.REVISION_REQUESTED, PROJECT_STATUS.REJECTED].includes(project.status)) counts.returned += 1;
    if (project.status === PROJECT_STATUS.PUBLISHED) counts.published += 1;
    return counts;
  }, { needsReview: 0, approved: 0, returned: 0, published: 0 });
}

function getPackageStatus(projects) {
  const progress = getPackageProgress(projects);
  if (projects.length >= CHART_ORDER.length && progress.published === projects.length) return "Published";
  if (progress.returned > 0) return "Returned";
  if (progress.approved === projects.length && projects.length > 0) return "Approved";
  return "Under Review";
}

function buildForecastPackages(projects) {
  const groups = new Map();
  projects.forEach((project) => {
    const key = getForecastDateKey(project);
    groups.set(key, [...(groups.get(key) || []), project]);
  });

  return Array.from(groups.entries())
    .map(([key, groupProjects]) => {
      const sortedProjects = [...groupProjects].sort((a, b) => getChartSortValue(a) - getChartSortValue(b));
      return {
        id: key,
        forecastDate: sortedProjects[0]?.forecastDate || sortedProjects[0]?.createdAt,
        projects: sortedProjects,
        progress: getPackageProgress(sortedProjects),
        status: getPackageStatus(sortedProjects),
      };
    })
    .sort((a, b) => new Date(b.forecastDate || 0).getTime() - new Date(a.forecastDate || 0).getTime());
}

function getReviewModalProject(project) {
  if (!project) return project;
  return { ...project, reviewComment: undefined };
}

function getWelcomeName(user, fallbackRole) {
  const name = String(user?.name || "").trim();
  if (!name || name.toLowerCase().startsWith("loading")) return fallbackRole;
  if (name.includes("@")) return name.split("@")[0];
  return name.split(" ")[0] || fallbackRole;
}

function DailyFocusPackage({ packageItem, isDarkMode, onOpenProject }) {
  if (!packageItem) return null;

  const cardClass = isDarkMode
    ? "border-white/10 bg-slate-950/55 text-slate-100 hover:border-cyan-300/40 hover:bg-slate-900"
    : "border-slate-200 bg-white text-slate-900 hover:border-cyan-300 hover:bg-cyan-50/60";
  const muted = isDarkMode ? "text-slate-400" : "text-slate-500";
  const firstProject = packageItem.projects[0];

  return (
    <section className={`overflow-hidden rounded-3xl border shadow-sm ${isDarkMode ? "border-cyan-400/25 bg-cyan-950/20" : "border-cyan-200 bg-cyan-50/70"}`}>
      <button
        type="button"
        onClick={() => firstProject && onOpenProject(firstProject)}
        className={`block w-full border-b border-white/10 p-5 text-left transition ${isDarkMode ? "hover:bg-cyan-400/10" : "hover:bg-cyan-100/70"}`}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.16em] ${isDarkMode ? "border-cyan-300/20 bg-cyan-400/10 text-cyan-100" : "border-cyan-200 bg-cyan-100 text-cyan-800"}`}>
                <CalendarCheck size={14} />
                Daily Focus
              </span>
              <span className={`text-sm font-bold ${muted}`}>{formatForecastDate(packageItem.forecastDate)}</span>
              <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${isDarkMode ? "border-amber-300/30 bg-amber-400/15 text-amber-200" : "border-amber-200 bg-amber-50 text-amber-700"}`}>{packageItem.status}</span>
            </div>
            <h2 className={`mt-4 text-2xl font-black ${isDarkMode ? "text-white" : "text-slate-950"}`}>Today&apos;s Analysis and Forecast Charts</h2>
            <p className={`mt-2 max-w-3xl text-sm font-semibold leading-6 ${muted}`}>Click anywhere in this Daily Focus header, Review package, or any chart card below to open the review modal.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex rounded-xl bg-cyan-500 px-4 py-2 text-sm font-black text-white shadow-sm">Review package</span>
            <div className={`grid grid-cols-3 gap-2 rounded-2xl border p-2 text-center text-xs font-black ${isDarkMode ? "border-white/10 bg-slate-950/50" : "border-white/70 bg-white/80"}`}>
              <div><p className={muted}>Needs Review</p><p className="mt-1 text-xl">{packageItem.progress.needsReview}</p></div>
              <div><p className={muted}>Approved</p><p className="mt-1 text-xl">{packageItem.progress.approved}</p></div>
              <div><p className={muted}>Returned</p><p className="mt-1 text-xl">{packageItem.progress.returned}</p></div>
            </div>
          </div>
        </div>
      </button>

      <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-4">
        {packageItem.projects.map((project) => {
          const type = getChartType(project);
          const isPublished = project.status === PROJECT_STATUS.PUBLISHED;

          return (
            <button key={getProjectId(project)} type="button" className={`min-w-0 rounded-2xl border p-4 text-left shadow-sm transition ${cardClass}`} onClick={() => onOpenProject(project)}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={`truncate text-xs font-black uppercase tracking-[0.16em] ${muted}`}>{CHART_LABELS[type] || type}</p>
                  <p className="mt-2 truncate text-sm font-black" title={getProjectName(project)}>{getProjectName(project)}</p>
                </div>
                <CheckCircle2 className={isPublished ? "text-emerald-300" : "text-slate-500"} size={20} />
              </div>
              <span className={`mt-4 inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${isPublished ? "border-emerald-300/25 bg-emerald-400/15 text-emerald-200" : "border-sky-300/25 bg-sky-400/15 text-sky-200"}`}>{getProjectStatusLabel(project.status)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function ProjectLibraryPage({ role = "forecaster", title, description }) {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const controller = useProjectLibraryController({ role, title, description });
  const userOptions = useMemo(() => ({ roleOverride: role === "admin" ? "Administrator" : "Forecaster" }), [role]);
  const { user } = useCurrentDashboardUser(null, userOptions);
  const [view, setView] = useState("grid");
  const [reviewProject, setReviewProject] = useState(null);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [isStartingReview, setIsStartingReview] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");

  const { projects, loading, error, onRetry, onOpen, onRename, onDelete, onStartReview, onApprove, onReject, onNoPublication, onPublish, mode } = controller.table;
  const packages = useMemo(() => buildForecastPackages(projects || []), [projects]);
  const dailyFocusPackage = role === "admin" ? packages[0] : null;

  const getReviewQueueForProject = (project, sourceProjects = projects || []) => {
    const dateKey = getForecastDateKey(project);
    return sourceProjects.filter((candidate) => getForecastDateKey(candidate) === dateKey).sort((a, b) => getChartSortValue(a) - getChartSortValue(b));
  };

  const loadFullReviewQueue = async (project) => {
    const localQueue = getReviewQueueForProject(project);
    const projectId = getProjectId(project);
    if (!projectId) return localQueue;

    try {
      const packageResponse = await fetchAdminForecastPackage(projectId);
      const packageProjects = adaptProjects(packageResponse?.projects || []);
      const packageQueue = packageProjects.sort((a, b) => getChartSortValue(a) - getChartSortValue(b));
      return packageQueue.length > 0 ? packageQueue : localQueue;
    } catch (err) {
      console.error("Failed to load full review package:", err);
      return localQueue;
    }
  };

  const openReviewProject = async (project) => {
    const projectId = getProjectId(project);
    if (!projectId) return;

    setIsStartingReview(true);
    try {
      const updatedProject = await onStartReview?.(project);
      const nextProject = updatedProject || project;
      const nextQueue = await loadFullReviewQueue(nextProject);
      setReviewQueue(nextQueue);
      setReviewProject(nextProject);
    } catch (err) {
      console.error("Failed to start review:", err);
      setFeedbackError(err?.message || "Failed to start project review.");
    } finally {
      setIsStartingReview(false);
    }
  };

  const handleOpen = async (project) => {
    setFeedbackError("");
    const projectId = getProjectId(project);
    if (!projectId) return;

    if (role === "admin") {
      await openReviewProject(project);
      return;
    }

    if (isProjectPublished(project?.status)) {
      navigate(`/forecasts/${projectId}`);
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

        {role === "admin" && !loading && !error && dailyFocusPackage && <DailyFocusPackage packageItem={dailyFocusPackage} isDarkMode={isDarkMode} onOpenProject={handleOpen} />}

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
                  <ProjectCard key={project._id || project.id} project={project} mode={mode} isDarkMode={isDarkMode} onOpen={handleOpen} onRename={onRename} onDelete={onDelete} onApprove={onApprove} onReject={onReject} onNoPublication={onNoPublication} onPublish={onPublish} onActionComplete={onRetry} />
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
      {isStartingReview && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 text-sm font-bold text-white backdrop-blur-sm">Starting review package…</div>}
      {role === "admin" && <ProjectReviewModal project={getReviewModalProject(reviewProject)} reviewQueue={reviewQueue} isDarkMode={isDarkMode} onClose={() => { setReviewProject(null); setReviewQueue([]); }} onSelectProject={openReviewProject} onApprove={onApprove} onReject={onReject} onNoPublication={onNoPublication} onPublish={onPublish} onActionComplete={handleReviewActionComplete} />}
    </div>
  );
}
