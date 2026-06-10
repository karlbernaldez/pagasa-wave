/**
 * ProjectLibraryPage.jsx
 *
 * Aligned with backend v2:
 *  - Single-project model (no forecastProjectId grouping)
 *  - ProjectService.createProject → returns { project, charts }
 *  - ProjectWorkflowService drives all status transitions
 *  - New ProjectQueryService pagination shape: { projects, total, page, limit, totalPages, statusCounts }
 *  - Collaborator panel scaffolded (UI + API hook stub ready for backend feature)
 *
 * Collaborator feature notes (TODO when backend ships):
 *  - Add `collaborators: [{ user, role, invitedAt }]` to Project model
 *  - POST /api/projects/:id/collaborators  – invite by email
 *  - DELETE /api/projects/:id/collaborators/:userId – remove
 *  - GET  /api/projects/:id/collaborators  – list
 *  - Guard: only owner or admin can manage collaborators
 */

import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Plus, Loader2 } from "lucide-react";

import ProjectStats from "@/features/projects/components/project-library/ProjectStats";
import ProjectToolbar from "@/features/projects/components/project-library/ProjectToolbar";
import ProjectTable from "@/features/projects/components/project-library/ProjectTable";
import ProjectPagination from "@/features/projects/components/project-library/ProjectPagination";
import ProjectCard from "@/features/projects/components/project-library/ProjectCard";
import ViewToggle from "../components/project-library/ViewToggle";
import GridState from "@/features/projects/components/project-library/ProjectGridState";
import CollaboratorPanel from "@/features/projects/components/project-library/CollaboratorPanel";
import ProjectDetailsDrawer from "@/features/projects/components/project-library/ProjectDetailsDrawer";
import ProjectReviewModal from "@/features/projects/components/ProjectReviewModal";
import CreateProjectModal from "@/components/ui/modals/CreateProjectModal";
import Button from "@/components/ui/Button";

import { createProject, fetchProjectById } from "@/api/projectAPI";
import { useTheme } from "@/app/providers/ThemeProvider";
import { useProjectLibraryController } from "@/features/projects/hooks/useProjectLibraryController";
import { isProjectPublished } from "@/features/projects/projectStatuses";

import { getCreatedProjectId, getProjectId, getReviewModalProject, } from "@/features/projects/utils/projectLibraryUtils";

// ─── main page ────────────────────────────────────────────────────────────────

export default function ProjectLibraryPage({ role = "forecaster", title, description }) {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const controller = useProjectLibraryController({ role, title, description });

  const [view, setView] = useState("grid");
  const [reviewProject, setReviewProject] = useState(null);
  const [collaboratorProject, setCollaboratorProject] = useState(null);
  const [isStartingReview, setIsStartingReview] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [selectedProjectId, setSelectedProjectId] =
    useState(null);

  const {
    data: selectedProject,
    isLoading: loadingProject,
  } = useQuery({
    queryKey: [
      "project",
      selectedProjectId,
    ],
    enabled: !!selectedProjectId,
    queryFn: () =>
      fetchProjectById(selectedProjectId),
  });


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

  // ── open handler (admin → review flow, owner → studio) ──────────────────────
  const handleOpen = useCallback(async (project) => {
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
        const updated = await onStartReview?.(project);
        setReviewProject(updated || project);
      } catch (err) {
        setFeedbackError(err?.message || "Failed to start project review.");
      } finally {
        setIsStartingReview(false);
      }
      return;
    }

    onOpen(project);
  }, [role, navigate, onStartReview, onOpen]);

  const handleSelectProject = async (project) => {
    console.log("CLICKED", project);

    try {
      setLoadingProject(true);

      const fullProject = await getProjectById(
        project._id || project.id
      );

      console.log("FULL PROJECT", fullProject);

      setSelectedProject(fullProject);
    } catch (error) {
      console.error("PROJECT LOAD ERROR", error);
    } finally {
      setLoadingProject(false);
    }
  };

  // ── create project ───────────────────────────────────────────────────────────
  const handleCreateProject = useCallback(async ({ projectName, description: desc, forecastDate }) => {
    const name = projectName?.trim();
    if (!name || isCreating) return;

    setIsCreating(true);
    setFeedbackError("");

    try {
      // Backend v2: createProject returns { project, charts }
      const response = await createProject({ name, description: desc, forecastDate });
      const projectId = getCreatedProjectId(response);

      await onRetry?.();
      setShowCreateModal(false);

      if (!projectId) throw new Error("Project created but ID was missing from the response.");
      navigate(`/studio/${projectId}`);
    } catch (err) {
      setFeedbackError(err?.message || "Failed to create project.");
    } finally {
      setIsCreating(false);
    }
  }, [isCreating, navigate, onRetry]);

  // ── review action complete ───────────────────────────────────────────────────
  const handleReviewActionComplete = useCallback(async (updated) => {
    if (updated) setReviewProject(updated);
    await onRetry?.();
  }, [onRetry]);

  // ── share / collaborators ────────────────────────────────────────────────────
  const handleShare = useCallback((project) => {
    setCollaboratorProject(project);
  }, []);

  const tableProps = { ...controller.table, onOpen: handleOpen, onShare: handleShare, isDarkMode };

  useEffect(() => {
    console.log("Selected Project:", selectedProject);
  }, [selectedProject]);

  return (
    <div className={`min-h-full transition-colors ${isDarkMode ? "bg-[#0d1117]" : "bg-slate-50"}`}>
      <div className="mx-auto max-w-[1400px] space-y-5 p-4 sm:space-y-6 sm:p-6">

        {/* ── page header ──────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className={`text-2xl font-black ${isDarkMode ? "text-slate-50" : "text-slate-900"}`}>
              {controller.header.title}
            </h1>
            <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              {controller.header.description}
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            {role !== "admin" && (
              <Button
                icon={Plus}
                loading={isCreating}
                disabled={isCreating}
                onClick={() => setShowCreateModal(true)}
              >
                New Project
              </Button>
            )}
            <ViewToggle view={view} setView={setView} isDarkMode={isDarkMode} />
          </div>
        </div>

        {/* ── error banner ─────────────────────────────────────────────────── */}
        {feedbackError && (
          <div
            role="alert"
            className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${isDarkMode ? "border-red-500/30 bg-red-950/30 text-red-300" : "border-red-200 bg-red-50 text-red-700"}`}
          >
            <span className="inline-flex items-start gap-2">
              <AlertCircle className="mt-0.5 shrink-0" size={17} />
              {feedbackError}
            </span>
            <button
              type="button"
              className={`shrink-0 text-xs font-black uppercase tracking-wide ${isDarkMode ? "text-red-200 hover:text-white" : "text-red-700 hover:text-red-900"}`}
              onClick={() => setFeedbackError("")}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ── stats ────────────────────────────────────────────────────────── */}
        <ProjectStats {...controller.stats} isDarkMode={isDarkMode} />

        {/* ── toolbar ──────────────────────────────────────────────────────── */}
        <ProjectToolbar {...controller.toolbar} isDarkMode={isDarkMode} />

        {/* ── grid view ────────────────────────────────────────────────────── */}
        {view === "grid" && (
          <div>
            {loading && <GridState type="loading" isDarkMode={isDarkMode} />}
            {!loading && error && <GridState type="error" onRetry={onRetry} isDarkMode={isDarkMode} />}
            {!loading && !error && projects?.length === 0 && <GridState type="empty" isDarkMode={isDarkMode} />}
            {!loading && !error && projects?.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <ProjectCard
                    key={project._id || project.id}
                    project={project}
                    mode={mode}
                    isDarkMode={isDarkMode}
                    onOpen={handleOpen}
                    onRename={onRename}
                    onDelete={onDelete}
                    onApprove={onApprove}
                    onReject={onReject}
                    onPublish={onPublish}
                    onShare={role !== "admin" ? handleShare : undefined}
                    onActionComplete={onRetry}
                    onSelect={(project) =>
                      setSelectedProjectId(
                        project._id || project.id
                      )
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── list view ────────────────────────────────────────────────────── */}
        {view === "list" && <ProjectTable {...tableProps} />}

        {/* ── pagination ───────────────────────────────────────────────────── */}
        <ProjectPagination {...controller.pagination} isDarkMode={isDarkMode} />
      </div>

      {/* ── controller-injected dialogs (rename, delete confirm, etc.) ──── */}
      {controller.dialogs}

      {/* ── create project modal ─────────────────────────────────────────── */}
      {role !== "admin" && (
        <CreateProjectModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateProject}
          isDarkMode={isDarkMode}
        />
      )}

      {/* ── admin review loading overlay ─────────────────────────────────── */}
      {isStartingReview && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center gap-3 bg-black/50 text-sm font-bold text-white backdrop-blur-sm">
          <Loader2 size={18} className="animate-spin" />
          Starting review…
        </div>
      )}

      {/* ── admin review modal ───────────────────────────────────────────── */}
      {role === "admin" && (
        <ProjectReviewModal
          project={getReviewModalProject(reviewProject)}
          isDarkMode={isDarkMode}
          onClose={() => setReviewProject(null)}
          onApprove={onApprove}
          onReject={onReject}
          onPublish={onPublish}
          onActionComplete={handleReviewActionComplete}
        />
      )}

      {/* ── collaborator panel (owner / forecaster only) ─────────────────── */}
      {collaboratorProject && (
        <CollaboratorPanel
          project={collaboratorProject}
          isDarkMode={isDarkMode}
          onClose={() => setCollaboratorProject(null)}
        />
      )}

      {selectedProjectId && (
        <ProjectDetailsDrawer
          project={selectedProject}
          loading={loadingProject}
          isDarkMode={isDarkMode}
          onClose={() =>
            setSelectedProjectId(null)
          }
        />
      )}

    </div>
  );
}