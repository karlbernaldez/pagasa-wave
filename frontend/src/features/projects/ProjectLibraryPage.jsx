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

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  FolderKanban,
  LayoutGrid,
  List,
  Plus,
  Users,
  X,
  UserPlus,
  Trash2,
  Crown,
  Eye,
  Loader2,
} from "lucide-react";

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

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Backend v2: createProject returns { project, charts } */
function getCreatedProjectId(response) {
  // new shape: { project: { _id } }
  if (response?.project?._id) return response.project._id;
  if (response?.project?.id)  return response.project.id;
  // fallback: direct project document
  if (response?._id) return response._id;
  if (response?.id)  return response.id;
  return null;
}

/** Resolve the id used for navigation / review opening */
function getProjectId(project) {
  return project?._id || project?.id;
}

/** Strip stale denormalised reviewComment so the modal uses audit logs */
function getReviewModalProject(project) {
  if (!project) return project;
  const { reviewComment: _rc, ...rest } = project;
  return rest;
}

// ─── skeleton / empty states ──────────────────────────────────────────────────

function ProjectCardSkeleton({ isDarkMode = false }) {
  const border = isDarkMode ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white";
  const block  = isDarkMode ? "bg-slate-800"      : "bg-slate-200";
  const soft   = isDarkMode ? "bg-slate-800/70"   : "bg-slate-100";
  return (
    <div className={`overflow-hidden rounded-2xl border shadow-sm ${border}`}>
      <div className={`h-[168px] animate-pulse ${block}`} />
      <div className="space-y-4 p-4">
        <div className="space-y-2">
          <div className={`h-4 w-2/3 animate-pulse rounded ${block}`} />
          <div className={`h-3 w-1/3 animate-pulse rounded ${soft}`} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className={`h-9 animate-pulse rounded ${soft}`} />
          <div className={`h-9 animate-pulse rounded ${soft}`} />
        </div>
        <div className={`h-10 animate-pulse rounded ${soft}`} />
      </div>
    </div>
  );
}

function GridState({ type, onRetry, isDarkMode = false }) {
  if (type === "loading") {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProjectCardSkeleton key={i} isDarkMode={isDarkMode} />
        ))}
      </div>
    );
  }
  if (type === "error") {
    return (
      <div className={`flex items-center justify-between rounded-2xl border p-6 text-sm ${isDarkMode ? "border-red-500/30 bg-red-950/30 text-red-300" : "border-red-200 bg-red-50 text-red-700"}`}>
        <span className="inline-flex items-center gap-2 font-semibold">
          <AlertCircle size={18} /> Failed to load projects.
        </span>
        <Button variant="ghost" size="sm" onClick={onRetry}>Retry</Button>
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
        Try clearing filters or adjusting your search.
      </p>
    </div>
  );
}

// ─── view toggle ──────────────────────────────────────────────────────────────

function ViewToggle({ view, setView, isDarkMode }) {
  const base     = "inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-black transition sm:h-10 sm:flex-none sm:px-3";
  const active   = "bg-cyan-500 text-white shadow-sm";
  const inactive = isDarkMode ? "text-cyan-300 hover:bg-white/5" : "text-blue-600 hover:bg-blue-50";
  return (
    <div className={`grid w-full grid-cols-2 rounded-2xl border p-1 shadow-sm sm:inline-grid sm:w-auto ${isDarkMode ? "border-white/10 bg-slate-900" : "border-slate-200 bg-white"}`}>
      <button type="button" aria-label="Cards" aria-pressed={view === "grid"} className={`${base} ${view === "grid" ? active : inactive}`} onClick={() => setView("grid")}>
        <LayoutGrid size={16} /><span className="sm:hidden">Cards</span>
      </button>
      <button type="button" aria-label="List" aria-pressed={view === "list"} className={`${base} ${view === "list" ? active : inactive}`} onClick={() => setView("list")}>
        <List size={16} /><span className="sm:hidden">List</span>
      </button>
    </div>
  );
}

// ─── collaborator panel ───────────────────────────────────────────────────────

/**
 * CollaboratorRole constants — mirrors what your backend will enforce.
 * editor  → can edit when project is in editable status
 * viewer  → read-only access at all times
 */
const COLLAB_ROLES = [
  { value: "editor", label: "Editor", icon: Crown,  description: "Can edit charts & annotations" },
  { value: "viewer", label: "Viewer", icon: Eye,    description: "Read-only access" },
];

/**
 * CollaboratorPanel
 *
 * Standalone slide-over panel for managing project collaborators.
 * Currently uses stub API calls (console.log) — wire up to your real
 * collaborator endpoints once the backend ships.
 *
 * Expected backend contract:
 *   POST   /api/projects/:id/collaborators   { email, role }
 *   DELETE /api/projects/:id/collaborators/:userId
 *   GET    /api/projects/:id/collaborators   → [{ user: { _id, firstName, lastName, email }, role, invitedAt }]
 */
function CollaboratorPanel({ project, isDarkMode, onClose }) {
  const [email, setEmail]         = useState("");
  const [role, setRole]           = useState("editor");
  const [inviting, setInviting]   = useState(false);
  const [removing, setRemoving]   = useState(null); // userId being removed
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");

  // TODO: replace with real API call + cache invalidation
  const [collaborators, setCollaborators] = useState(project?.collaborators || []);

  const bg      = isDarkMode ? "bg-[#0d1117]"      : "bg-white";
  const border  = isDarkMode ? "border-white/10"   : "border-slate-200";
  const text    = isDarkMode ? "text-slate-100"    : "text-slate-900";
  const subtext = isDarkMode ? "text-slate-400"    : "text-slate-500";
  const input   = isDarkMode
    ? "bg-slate-800 border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500"
    : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500";
  const selectCls = isDarkMode
    ? "bg-slate-800 border-white/10 text-slate-100"
    : "bg-white border-slate-200 text-slate-900";

  const handleInvite = useCallback(async () => {
    setError(""); setSuccess("");
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) { setError("Enter an email address."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setError("Enter a valid email address."); return; }
    if (collaborators.some(c => c.user?.email === trimmed)) { setError("This person is already a collaborator."); return; }

    setInviting(true);
    try {
      // TODO: replace with real API
      // const res = await fetch(`/api/projects/${project._id}/collaborators`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   credentials: "include",
      //   body: JSON.stringify({ email: trimmed, role }),
      // });
      // if (!res.ok) throw new Error((await res.json()).message);
      // const { collaborator } = await res.json();

      // Optimistic local update (swap for real response when backend ships)
      const optimistic = {
        user: { _id: Date.now().toString(), firstName: trimmed.split("@")[0], lastName: "", email: trimmed },
        role,
        invitedAt: new Date().toISOString(),
        pending: true,
      };
      setCollaborators(prev => [...prev, optimistic]);
      setEmail(""); setRole("editor");
      setSuccess(`Invite sent to ${trimmed}.`);
    } catch (err) {
      setError(err?.message || "Failed to invite collaborator.");
    } finally {
      setInviting(false);
    }
  }, [email, role, collaborators, project]);

  const handleRemove = useCallback(async (userId) => {
    setError(""); setSuccess("");
    setRemoving(userId);
    try {
      // TODO: replace with real API
      // await fetch(`/api/projects/${project._id}/collaborators/${userId}`, {
      //   method: "DELETE", credentials: "include",
      // });
      setCollaborators(prev => prev.filter(c => c.user?._id !== userId));
    } catch (err) {
      setError(err?.message || "Failed to remove collaborator.");
    } finally {
      setRemoving(null);
    }
  }, [project]);

  const roleLabel = (r) => COLLAB_ROLES.find(cr => cr.value === r)?.label || r;

  return (
    <div className="fixed inset-0 z-[80] flex justify-end">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden />

      {/* panel */}
      <div className={`relative z-10 flex h-full w-full max-w-md flex-col border-l shadow-2xl ${bg} ${border}`}>
        {/* header */}
        <div className={`flex items-center justify-between border-b px-5 py-4 ${border}`}>
          <div>
            <h2 className={`text-base font-black ${text}`}>
              <span className="inline-flex items-center gap-2"><Users size={18} className="text-cyan-500" />Collaborators</span>
            </h2>
            <p className={`mt-0.5 text-xs ${subtext}`}>{project?.name}</p>
          </div>
          <button type="button" onClick={onClose} className={`rounded-xl p-2 transition hover:bg-white/5 ${subtext}`}>
            <X size={18} />
          </button>
        </div>

        {/* invite form */}
        <div className={`border-b px-5 py-4 ${border}`}>
          <p className={`mb-3 text-xs font-bold uppercase tracking-wide ${subtext}`}>Invite by email</p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleInvite()}
              className={`min-w-0 flex-1 rounded-xl border px-3 py-2 text-sm outline-none transition ${input}`}
            />
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className={`rounded-xl border px-2 py-2 text-sm outline-none ${selectCls}`}
            >
              {COLLAB_ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {error   && <p className="mt-2 text-xs font-semibold text-red-400">{error}</p>}
          {success && <p className="mt-2 text-xs font-semibold text-emerald-400">{success}</p>}

          <button
            type="button"
            disabled={inviting}
            onClick={handleInvite}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-400 disabled:opacity-60"
          >
            {inviting
              ? <><Loader2 size={15} className="animate-spin" />Inviting…</>
              : <><UserPlus size={15} />Send invite</>}
          </button>
        </div>

        {/* role descriptions */}
        <div className={`flex gap-4 border-b px-5 py-3 ${border}`}>
          {COLLAB_ROLES.map(r => (
            <div key={r.value} className="flex items-start gap-2">
              <r.icon size={13} className={isDarkMode ? "mt-0.5 text-slate-400" : "mt-0.5 text-slate-400"} />
              <div>
                <p className={`text-xs font-bold ${text}`}>{r.label}</p>
                <p className={`text-xs ${subtext}`}>{r.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* collaborator list */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {collaborators.length === 0 ? (
            <div className={`flex flex-col items-center gap-2 py-12 text-center ${subtext}`}>
              <Users size={32} className="opacity-30" />
              <p className="text-sm">No collaborators yet.</p>
              <p className="text-xs">Invite someone above to get started.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {collaborators.map(c => {
                const user = c.user || {};
                const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || user.email?.[0]?.toUpperCase() || "?";
                const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
                return (
                  <li key={user._id} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${isDarkMode ? "border-white/10 bg-slate-900/60" : "border-slate-100 bg-slate-50"}`}>
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${isDarkMode ? "bg-cyan-500/20 text-cyan-300" : "bg-blue-100 text-blue-700"}`}>
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-semibold ${text}`}>{displayName}</p>
                      <p className={`truncate text-xs ${subtext}`}>{user.email}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {c.pending && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${isDarkMode ? "bg-amber-500/20 text-amber-300" : "bg-amber-100 text-amber-700"}`}>
                          Pending
                        </span>
                      )}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                        {roleLabel(c.role)}
                      </span>
                      <button
                        type="button"
                        disabled={removing === user._id}
                        onClick={() => handleRemove(user._id)}
                        className={`rounded-lg p-1 transition ${isDarkMode ? "text-slate-500 hover:text-red-400" : "text-slate-400 hover:text-red-500"}`}
                        aria-label={`Remove ${displayName}`}
                      >
                        {removing === user._id
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Trash2 size={14} />}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* footer note */}
        <div className={`border-t px-5 py-3 ${border}`}>
          <p className={`text-xs ${subtext}`}>
            Collaborators can access this project based on their assigned role. Only the project owner and admins can manage collaborators.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function ProjectLibraryPage({ role = "forecaster", title, description }) {
  const navigate   = useNavigate();
  const { isDarkMode } = useTheme();
  const controller = useProjectLibraryController({ role, title, description });

  const [view, setView]           = useState("grid");
  const [reviewProject, setReviewProject]       = useState(null);
  const [collaboratorProject, setCollaboratorProject] = useState(null);
  const [isStartingReview, setIsStartingReview] = useState(false);
  const [showCreateModal, setShowCreateModal]   = useState(false);
  const [isCreating, setIsCreating]             = useState(false);
  const [feedbackError, setFeedbackError]       = useState("");

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

  // ── create project ───────────────────────────────────────────────────────────
  const handleCreateProject = useCallback(async ({ projectName, description: desc, forecastDate }) => {
    const name = projectName?.trim();
    if (!name || isCreating) return;

    setIsCreating(true);
    setFeedbackError("");

    try {
      // Backend v2: createProject returns { project, charts }
      const response  = await createProject({ name, description: desc, forecastDate });
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
    </div>
  );
}