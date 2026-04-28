// studio/StudioLanding.jsx
import { useState, useEffect, useMemo } from "react";
import {
  Plus, Search, Filter, X,
  ChevronLeft, ChevronRight, Sparkles, FolderOpen,
  ArrowUp, ArrowDown, Home, FolderKanban, FileText, Send, CheckCircle2, Users,
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

const STAT_STYLE = {
  "Total Projects": { icon: FolderKanban, tile: "bg-blue-50 text-blue-700" },
  Drafts: { icon: FileText, tile: "bg-sky-50 text-sky-700" },
  "Under Review": { icon: Users, tile: "bg-amber-50 text-amber-700" },
  Submitted: { icon: Send, tile: "bg-slate-100 text-slate-600" },
  Published: { icon: CheckCircle2, tile: "bg-emerald-50 text-emerald-700" },
};

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
  const stats = !loading && allProjects.length > 0 ? getProjectStats(allProjects) : [];

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-[1500px] space-y-4 p-5 lg:p-6">
        <section className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/40 to-white p-5 shadow-sm">
          <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_1px_1px,_#bfdbfe_1px,_transparent_0)] [background-size:24px_24px]" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-blue-700 shadow-sm">
                <Home size={15} />
                <ChevronRight size={14} className="text-slate-400" />
                <span>WaveLab Studio</span>
              </div>
              <div>
                <p className="text-sm font-black text-blue-800">WaveLab Studio</p>
                <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 lg:text-4xl">
                  Forecast Project Library
                </h1>
                <p className="mt-2 text-base font-medium text-slate-500">
                  Select a project to continue forecasting, review saved work, or start a new forecast.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800"
            >
              <Plus size={18} strokeWidth={2.4} />
              New Project
            </button>
          </div>

          {stats.length > 0 && (
            <div className="relative mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {stats.map(({ value, label, helper }) => {
                const style = STAT_STYLE[label] ?? STAT_STYLE["Total Projects"];
                const Icon = style.icon;
                return (
                  <div key={label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-sm">
                    <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg", style.tile)}>
                      <Icon size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-500">{label}</p>
                      <p className="text-2xl font-black leading-tight text-slate-950">{value}</p>
                      <p className="truncate text-xs font-medium text-slate-500">{helper}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <motion.section
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="grid gap-3 lg:grid-cols-[1.8fr_0.75fr_0.75fr_0.75fr_0.7fr_auto_auto] lg:items-end">
            <label className="space-y-1.5">
              <span className="text-xs font-bold text-slate-600">Search</span>
              <div className="flex h-10 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50">
                <Search size={16} strokeWidth={2} className="text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, region, or description..."
                  className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
                {search && (
                  <button type="button" onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600">
                    <X size={14} />
                  </button>
                )}
              </div>
            </label>

            <FilterSelect label="Status" value="All Statuses" />
            <FilterSelect label="Type" value="All Types" />
            <FilterSelect label="Category" value="All Categories" />
            <FilterSelect label="Date Range" value="All Time" />

            <button type="button" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-bold text-blue-700 hover:bg-blue-100">
              <Filter size={15} />
              Filters
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs">0</span>
            </button>
            <button type="button" className="h-10 px-2 text-sm font-bold text-blue-600 hover:text-blue-800">Clear</button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
            <span className="text-xs font-bold text-slate-500">Sort by</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-9 appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-xs font-bold text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-50"
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
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              {sortDir === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
              {sortDir === "asc" ? "Oldest First" : "Newest First"}
            </button>

            <div className="ml-auto flex items-center gap-2 overflow-x-auto">
              {STATUS_FILTERS.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.06em] transition",
                    statusFilter === s
                      ? "border-blue-700 bg-blue-700 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </motion.section>

        {loading ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} isDark={false} />)}
          </div>
        ) : sortedPaged.length === 0 ? (
          <EmptyState hasFilters={!!search || statusFilter !== "All"}
            onCreateClick={() => setShowCreateModal(true)} />
        ) : (
          <motion.div
            className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"
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
          <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-slate-500 tabular-nums">
              Showing page {page} of {totalPages} · {total} project{total !== 1 ? "s" : ""}
            </p>

            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40">
                <ChevronLeft size={14} />
              </button>
              <div className="flex items-center gap-1.5">
                {pageNums.map((item, idx) => item === "…" ? (
                  <span key={`e-${idx}`} className="flex h-9 w-9 items-center justify-center text-sm text-slate-400">…</span>
                ) : (
                  <button key={item} onClick={() => setPage(item)} className={cn("h-9 w-9 rounded-lg border text-sm font-bold transition", page === item ? "border-blue-700 bg-blue-700 text-white" : "border-slate-200 text-slate-500 hover:bg-slate-100")}>{item}</button>
                ))}
              </div>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40">
                <ChevronRight size={14} />
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

function FilterSelect({ label, value }) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-bold text-slate-600">{label}</span>
      <button type="button" className="flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-left text-sm font-semibold text-slate-600 hover:bg-slate-50">
        <span className="truncate">{value}</span>
        <ChevronRight size={14} className="rotate-90 text-slate-400" />
      </button>
    </label>
  );
}

function EmptyState({ hasFilters, onCreateClick }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-20 gap-5 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
        <FolderOpen size={28} className="text-slate-400" strokeWidth={1.6} />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold tracking-tight text-slate-900">
          {hasFilters ? "No matching projects" : "No projects yet"}
        </h3>
        <p className="max-w-sm text-sm leading-relaxed text-slate-500">
          {hasFilters ? "Try a different search or clear the filter." : "Create your first project to get started."}
        </p>
      </div>
      {!hasFilters && (
        <button type="button" onClick={onCreateClick} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-800">
          <Sparkles size={16} strokeWidth={2.5} />
          Create First Project
        </button>
      )}
    </motion.div>
  );
}
