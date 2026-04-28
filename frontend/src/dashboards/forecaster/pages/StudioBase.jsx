// studio/StudioLanding.jsx
import { useState, useEffect, useMemo } from "react";
import {
  Plus, Search, Filter, X,
  ChevronLeft, ChevronRight, Sparkles, FolderOpen,
  ArrowUpDown, ArrowUp, ArrowDown, Home, FolderKanban,
} from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/app/providers/ThemeProvider";
import CreateProjectModal from "@/components/ui/modals/CreateProjectModal";

import { useProjects }       from "@dashboards/forecaster/components/StudioBase/hooks/useProjects";
import { ProjectCard }       from "@dashboards/forecaster/components/StudioBase/ProjectCard";
import { SkeletonCard }      from "@dashboards/forecaster/components/StudioBase/SkeletonCard";
import { DeleteDialog, RenameDialog, ShareDialog } from "@dashboards/forecaster/components/StudioBase/ProjectDialogs";
import { STATUS_FILTERS }    from "@dashboards/forecaster/components/StudioBase/constants";
import { cn, buildPageNumbers } from "@dashboards/forecaster/components/StudioBase/utils";
import {
  SORT_OPTIONS,
  getProjectStats,
  scaleIn,
  sortProjects,
  stagger,
} from "@dashboards/forecaster/components/project-library/projectLibraryUtils";

export default function StudioLanding() {
  const { isDarkMode: isDark } = useTheme();
  const {
    loading, allProjects, search, setSearch,
    statusFilter, setStatusFilter, page, setPage,
    paged, total, totalPages,
    deleteProject, renameProject, createProject,
  } = useProjects();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteTarget,    setDeleteTarget]    = useState(null);
  const [deletingId,      setDeletingId]      = useState(null);
  const [renameTarget,    setRenameTarget]    = useState(null);
  const [renamingId,      setRenamingId]      = useState(null);
  const [shareTarget,     setShareTarget]     = useState(null);

  const [sortBy,  setSortBy]  = useState("updatedAt");
  const [sortDir, setSortDir] = useState("desc");

  const sortedPaged = useMemo(
    () => sortProjects(paged, sortBy, sortDir),
    [paged, sortBy, sortDir]
  );

  const toggleDir = () => setSortDir((d) => (d === "asc" ? "desc" : "asc"));

  useEffect(() => { document.title = "WaveLab · Project Library"; }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { setDeletingId(deleteTarget._id); await deleteProject(deleteTarget._id); setDeleteTarget(null); }
    catch (e) { console.error(e); } finally { setDeletingId(null); }
  };
  const handleRename = async (newName) => {
    if (!renameTarget) return;
    try { setRenamingId(renameTarget._id); await renameProject(renameTarget._id, newName); setRenameTarget(null); }
    catch (e) { console.error(e); } finally { setRenamingId(null); }
  };

  const pageNums = buildPageNumbers(totalPages, page);

  const muteText = "text-slate-500";
  const pgBtn = "border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-700";
  const pgActive = "bg-blue-700 text-white border-blue-700 shadow-sm";

  const stats = !loading && allProjects.length > 0 ? getProjectStats(allProjects) : [];

  const controlBase = cn(
    "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:border-slate-300"
  );

  return (
    <div className="min-h-full bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <div className="inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-blue-700 shadow-sm">
          <Home size={15} />
          <ChevronRight size={14} className="text-slate-400" />
          <span>WaveLab Studio</span>
        </div>

        <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 lg:text-4xl">
              Forecast Project Library
            </h1>
            <p className="mt-2 text-base font-medium text-slate-500">
              Manage, review, and continue marine forecasting work.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800"
          >
            <Plus size={18} strokeWidth={2.4} />
            New Project
          </button>
        </section>

        {stats.length > 0 && (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map(({ value, label }) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <FolderKanban size={22} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-600">{label}</p>
                    <p className="text-3xl font-black leading-none text-slate-900">{value}</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {label === "Total" ? "All forecast projects" : "Project status"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        <motion.section
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Search</span>
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50">
                <Search size={16} strokeWidth={2} className={muteText} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search projects by title or description..."
                  className="flex-1 bg-transparent text-sm leading-relaxed text-slate-900 outline-none placeholder:text-slate-400"
                />
                {search && (
                  <button type="button" onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600">
                    <X size={14} />
                  </button>
                )}
              </div>
            </label>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Sort by</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={cn(controlBase, "h-10 pl-3 pr-8 appearance-none cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-50")}
                  style={{ backgroundImage: "none" }}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-white text-slate-800">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronRight size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-slate-400" />
              </div>

              <button
                type="button"
                onClick={toggleDir}
                title={sortDir === "asc" ? "Ascending — click for descending" : "Descending — click for ascending"}
                className={cn(controlBase, "h-10 px-3")}
              >
                {sortDir === "asc" ? <ArrowUp size={13} strokeWidth={2.5} /> : <ArrowDown size={13} strokeWidth={2.5} />}
                <span className="uppercase tracking-[0.1em]">{sortDir === "asc" ? "Asc" : "Desc"}</span>
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-2 overflow-x-auto">
              <Filter size={13} strokeWidth={2} className="shrink-0 text-slate-400" />
              {STATUS_FILTERS.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-bold uppercase tracking-[0.08em] transition",
                    statusFilter === s
                      ? "border-blue-700 bg-blue-700 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>

            {(search || statusFilter !== "All") && total > 0 && (
              <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-500">
                {total} result{total !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </motion.section>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} isDark={false} />)}
          </div>
        ) : sortedPaged.length === 0 ? (
          <EmptyState isDark={false} hasFilters={!!search || statusFilter !== "All"}
            onCreateClick={() => setShowCreateModal(true)} />
        ) : (
          <motion.div
            className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
            variants={stagger} initial="hidden" animate="show"
          >
            {sortedPaged.map((project) => (
              <motion.div key={project._id} variants={scaleIn}>
                <ProjectCard project={project} isDark={false}
                  onDelete={setDeleteTarget}
                  onRename={setRenameTarget}
                  onShare={setShareTarget}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {totalPages > 1 && (
          <div className="flex flex-col gap-4 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-slate-500 tabular-nums">
              Showing page {page} of {totalPages} · {total} project{total !== 1 ? "s" : ""}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={cn("flex h-10 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed", pgBtn)}
              >
                <ChevronLeft size={14} /> Prev
              </button>

              <div className="flex items-center gap-1.5">
                {pageNums.map((item, idx) =>
                  item === "…" ? (
                    <span key={`e-${idx}`} className="flex h-10 w-10 items-center justify-center text-sm text-slate-400">…</span>
                  ) : (
                    <button key={item} onClick={() => setPage(item)}
                      className={cn("h-10 w-10 rounded-lg border text-sm font-bold transition", page === item ? pgActive : pgBtn)}>
                      {item}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={cn("flex h-10 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed", pgBtn)}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateProjectModal visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={(fd) => createProject(fd, setShowCreateModal)}
        isDarkMode={isDark} />
      {deleteTarget && (
        <DeleteDialog project={deleteTarget} isDark={isDark}
          onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete}
          loading={deletingId === deleteTarget._id} />
      )}
      {renameTarget && (
        <RenameDialog project={renameTarget} isDark={isDark}
          onCancel={() => setRenameTarget(null)} onConfirm={handleRename}
          loading={renamingId === renameTarget._id} />
      )}
      {shareTarget && (
        <ShareDialog project={shareTarget} isDark={isDark} onClose={() => setShareTarget(null)} />
      )}
    </div>
  );
}

function EmptyState({ isDark, hasFilters, onCreateClick }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-24 gap-6 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
        <FolderOpen size={34} className="text-slate-400" strokeWidth={1.6} />
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900">
          {hasFilters ? "No matching projects" : "No projects yet"}
        </h3>
        <p className="max-w-sm text-base leading-relaxed text-slate-500">
          {hasFilters ? "Try a different search or clear the filter." : "Create your first project to get started."}
        </p>
      </div>
      {!hasFilters && (
        <button
          type="button"
          onClick={onCreateClick}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-800"
        >
          <Sparkles size={16} strokeWidth={2.5} />
          Create First Project
        </button>
      )}
    </motion.div>
  );
}
