// studio/StudioLanding.jsx
import { useState, useEffect } from "react";
import {
  Plus, Search, Filter, X,
  ChevronLeft, ChevronRight, Layers, Sparkles, FolderOpen,
} from "lucide-react";
import { useTheme } from "@/app/providers/ThemeProvider";
import CreateProjectModal from "@/components/ui/modals/CreateProjectModal";

import { useProjects }       from "@dashboards/forecaster/components/StudioBase/hooks/useProjects";
import { ProjectCard }       from "@dashboards/forecaster/components/StudioBase/ProjectCard";
import { SkeletonCard }      from "@dashboards/forecaster/components/StudioBase/SkeletonCard";
import { DeleteDialog, RenameDialog, ShareDialog } from "@dashboards/forecaster/components/StudioBase/ProjectDialogs";
import { STATUS_FILTERS }    from "@dashboards/forecaster/components/StudioBase/constants";
import { cn, buildPageNumbers } from "@dashboards/forecaster/components/StudioBase/utils";

export default function StudioLanding() {
  const { isDarkMode: isDark } = useTheme();

  const {
    loading, allProjects,
    search, setSearch,
    statusFilter, setStatusFilter,
    page, setPage,
    paged, total, totalPages,
    deleteProject, renameProject, createProject,
  } = useProjects();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteTarget, setDeleteTarget]       = useState(null);
  const [deletingId, setDeletingId]           = useState(null);
  const [renameTarget, setRenameTarget]       = useState(null);
  const [renamingId, setRenamingId]           = useState(null);
  const [shareTarget, setShareTarget]         = useState(null);

  useEffect(() => { document.title = "WaveLab · Studio"; }, []);

  /* ── action handlers ── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeletingId(deleteTarget._id);
      await deleteProject(deleteTarget._id);
      setDeleteTarget(null);
    } catch (e) { console.error(e); }
    finally { setDeletingId(null); }
  };

  const handleRename = async (newName) => {
    if (!renameTarget) return;
    try {
      setRenamingId(renameTarget._id);
      await renameProject(renameTarget._id, newName);
      setRenameTarget(null);
    } catch (e) { console.error(e); }
    finally { setRenamingId(null); }
  };

  /* ── resolved theme tokens ── */
  const pageBg   = isDark ? "bg-[#070e1c]"  : "bg-slate-50";
  const headText = isDark ? "text-white"     : "text-slate-900";
  const muteText = isDark ? "text-slate-500" : "text-slate-400";
  const inputCls = isDark
    ? "bg-slate-900 border-slate-800 text-white focus-within:border-slate-600"
    : "bg-white border-slate-200 text-slate-900 focus-within:border-blue-400 shadow-sm";
  const pgBtn    = isDark
    ? "border-slate-800 hover:bg-slate-800 text-slate-500 hover:text-slate-200"
    : "border-slate-200 hover:bg-slate-100 text-slate-400 hover:text-slate-700";
  const pgActive = isDark
    ? "bg-cyan-500/20 text-cyan-300 border-cyan-700"
    : "bg-blue-600 text-white border-blue-600 shadow-sm";

  const pageNums = buildPageNumbers(totalPages, page);

  return (
    <div className={cn("min-h-screen transition-colors duration-200 pt-16", pageBg)}>

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {isDark ? (
          <>
            <div className="absolute -top-48 left-1/4 w-[800px] h-[600px] rounded-full blur-[200px] opacity-[0.07] bg-cyan-500" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[400px] rounded-full blur-[180px] opacity-[0.04] bg-blue-600" />
          </>
        ) : (
          <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-blue-50/70 to-transparent" />
        )}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10">

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-10 flex-wrap gap-4">
          <div>
            <p className={cn("flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] mb-3", muteText)}>
              <Layers size={10} strokeWidth={3} />
              WaveLab Studio
            </p>
            <h1 className={cn("text-4xl font-black tracking-tight leading-none mb-2.5", headText)}>
              Your Projects
            </h1>
            <p className={cn("text-sm", muteText)}>
              {loading ? "Loading…"
                : allProjects.length > 0
                  ? `${allProjects.length} project${allProjects.length !== 1 ? "s" : ""} · click any card to open`
                  : "Create your first project to get started"}
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all",
              "hover:scale-[1.02] active:scale-[0.98]",
              isDark
                ? "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-800 shadow-[0_0_20px_rgba(6,182,212,0.10)]"
                : "bg-blue-600 hover:bg-blue-700 text-white border-blue-700 shadow-lg shadow-blue-500/20"
            )}
          >
            <Plus size={14} strokeWidth={2.5} />
            New Project
          </button>
        </div>

        {/* ── Search ── */}
        <div className={cn(
          "flex items-center gap-3 rounded-2xl px-4 py-3 border mb-3 transition-all",
          inputCls
        )}>
          <Search size={14} strokeWidth={2} className={muteText} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or description…"
            className="flex-1 bg-transparent text-sm outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")}
              className={cn("hover:opacity-70 transition-opacity", muteText)}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* ── Filter pills ── */}
        <div className="flex items-center gap-1.5 mb-8 flex-wrap">
          <Filter size={11} strokeWidth={2} className={cn(muteText, "flex-shrink-0 mr-0.5")} />
          {STATUS_FILTERS.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn(
                "text-[11px] font-semibold px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap",
                statusFilter === s
                  ? isDark
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-700"
                    : "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : isDark
                    ? "bg-slate-900 text-slate-500 hover:bg-slate-800 hover:text-slate-300 border-slate-800"
                    : "bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 border-slate-200"
              )}>
              {s}
            </button>
          ))}
          {(search || statusFilter !== "All") && total > 0 && (
            <span className={cn("text-xs ml-1 tabular-nums", muteText)}>
              {total} result{total !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} isDark={isDark} />)}
          </div>
        ) : paged.length === 0 ? (
          <EmptyState isDark={isDark} hasFilters={!!search || statusFilter !== "All"}
            onCreateClick={() => setShowCreateModal(true)} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paged.map((project) => (
              <ProjectCard key={project._id} project={project} isDark={isDark}
                onDelete={setDeleteTarget}
                onRename={setRenameTarget}
                onShare={setShareTarget}
              />
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-10">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className={cn("p-2 rounded-xl border transition-all disabled:opacity-25 disabled:cursor-not-allowed", pgBtn)}>
              <ChevronLeft size={15} />
            </button>
            {pageNums.map((item, idx) =>
              item === "…" ? (
                <span key={`e-${idx}`} className={cn("text-xs px-1", muteText)}>…</span>
              ) : (
                <button key={item} onClick={() => setPage(item)}
                  className={cn("w-9 h-9 rounded-xl text-xs font-bold border transition-all",
                    page === item ? pgActive : pgBtn)}>
                  {item}
                </button>
              )
            )}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className={cn("p-2 rounded-xl border transition-all disabled:opacity-25 disabled:cursor-not-allowed", pgBtn)}>
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <CreateProjectModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={(formData) => createProject(formData, setShowCreateModal)}
        isDarkMode={isDark}
      />
      {deleteTarget && (
        <DeleteDialog project={deleteTarget} isDark={isDark}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={deletingId === deleteTarget._id} />
      )}
      {renameTarget && (
        <RenameDialog project={renameTarget} isDark={isDark}
          onCancel={() => setRenameTarget(null)}
          onConfirm={handleRename}
          loading={renamingId === renameTarget._id} />
      )}
      {shareTarget && (
        <ShareDialog project={shareTarget} isDark={isDark}
          onClose={() => setShareTarget(null)} />
      )}
    </div>
  );
}

/* ── EmptyState (local, small enough to inline) ── */
function EmptyState({ isDark, hasFilters, onCreateClick }) {
  const headText = isDark ? "text-white"     : "text-slate-900";
  const muteText = isDark ? "text-slate-500" : "text-slate-400";
  return (
    <div className="flex flex-col items-center justify-center py-28 gap-5 text-center">
      <div className={cn("w-20 h-20 rounded-3xl border flex items-center justify-center",
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm")}>
        <FolderOpen size={36} className={muteText} strokeWidth={1.4} />
      </div>
      <div>
        <h3 className={cn("font-bold text-lg mb-1.5", headText)}>
          {hasFilters ? "No matching projects" : "No projects yet"}
        </h3>
        <p className={cn("text-sm", muteText)}>
          {hasFilters ? "Try a different search or clear the filter." : "Create your first project to get started."}
        </p>
      </div>
      {!hasFilters && (
        <button onClick={onCreateClick}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all hover:scale-[1.02]",
            isDark
              ? "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-800"
              : "bg-blue-600 hover:bg-blue-700 text-white border-blue-700 shadow-md shadow-blue-500/20"
          )}>
          <Sparkles size={14} strokeWidth={2.5} />
          Create First Project
        </button>
      )}
    </div>
  );
}