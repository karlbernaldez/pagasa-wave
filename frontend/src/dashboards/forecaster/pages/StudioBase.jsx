// studio/StudioLanding.jsx
import { useState, useEffect, useMemo } from "react";
import {
  Plus, Search, Filter, X,
  ChevronLeft, ChevronRight, Sparkles, FolderOpen, Waves,
  ArrowUpDown, ArrowUp, ArrowDown,
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
  fadeUp,
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

  // ── Sort state ──
  const [sortBy,  setSortBy]  = useState("updatedAt");
  const [sortDir, setSortDir] = useState("desc");

  // Apply sorting on top of the already-filtered+paged slice.
  // NOTE: For true cross-page sorting wire sortBy/sortDir into useProjects
  // so sorting happens before pagination. This sorts the current page only.
  const sortedPaged = useMemo(
    () => sortProjects(paged, sortBy, sortDir),
    [paged, sortBy, sortDir]
  );

  const toggleDir = () => setSortDir((d) => (d === "asc" ? "desc" : "asc"));

  useEffect(() => { document.title = "WaveLab · Studio"; }, []);

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

  const headText = isDark ? "text-white"     : "text-slate-900";
  const bodyText = isDark ? "text-slate-300" : "text-slate-600";
  const muteText = isDark ? "text-slate-400" : "text-slate-500";
  const pgBtn    = isDark
    ? "border-slate-700/60 hover:bg-slate-800/60 text-slate-500 hover:text-slate-200"
    : "border-slate-200 hover:bg-slate-100 text-slate-400 hover:text-slate-700";
  const pgActive = "bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-transparent shadow-lg shadow-blue-500/20";

  const stats = !loading && allProjects.length > 0 ? getProjectStats(allProjects) : [];

  // Shared control styles
  const controlBase = cn(
    "inline-flex items-center gap-1.5 rounded-xl border text-xs font-bold transition-all duration-200",
    isDark
      ? "border-slate-700 bg-slate-800/40 text-slate-300 hover:bg-slate-800/70 hover:border-slate-500"
      : "border-slate-200 bg-white/70 text-slate-600 hover:bg-white hover:border-slate-300"
  );

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-700 pt-16 relative overflow-hidden",
      isDark
        ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
        : "bg-gradient-to-br from-slate-50 via-white to-slate-100"
    )}>

      {/* Dot-grid */}
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none z-0">
        <div className={cn(
          "absolute inset-0 bg-[length:30px_30px]",
          isDark
            ? "bg-[radial-gradient(circle_at_center,_theme(colors.blue.500)_1px,_transparent_1px)]"
            : "bg-[radial-gradient(circle_at_center,_theme(colors.blue.400)_1px,_transparent_1px)]"
        )} />
      </div>

      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className={cn("absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full blur-3xl",
          isDark ? "bg-blue-600/10" : "bg-blue-400/15")} />
        <div className={cn("absolute -bottom-24 -right-24 w-[450px] h-[450px] rounded-full blur-3xl",
          isDark ? "bg-cyan-600/10" : "bg-cyan-400/12")} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* ══ Header ══ */}
        <motion.div className="mb-14" variants={stagger} initial="hidden" animate="show">
          <motion.div variants={scaleIn} className="mb-7">
            <div className={cn(
              "inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold",
              "backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]",
              isDark
                ? "bg-blue-500/10 text-blue-300 border border-blue-400/20 hover:border-blue-400/40"
                : "bg-blue-100/80 text-blue-700 border border-blue-200 hover:border-blue-300"
            )}>
              <Waves size={16} className="animate-pulse" />
              WaveLab Studio
            </div>
          </motion.div>

          <div className="flex items-end justify-between gap-8 flex-wrap">
            <div className="space-y-5">
              <motion.h1
                variants={fadeUp} custom={0.05}
                className={cn("text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight", headText)}
              >
                Your{" "}
                <span className={cn("bg-gradient-to-r bg-clip-text text-transparent",
                  isDark
                    ? "from-blue-400 via-cyan-400 to-emerald-400"
                    : "from-blue-600 via-cyan-600 to-emerald-600"
                )}>
                  Projects
                </span>
              </motion.h1>

              <motion.p variants={fadeUp} custom={0.12}
                className={cn("text-lg sm:text-xl leading-relaxed max-w-xl", bodyText)}
              >
                {loading ? "Loading…"
                  : allProjects.length > 0
                    ? `${allProjects.length} project${allProjects.length !== 1 ? "s" : ""} · click any card to open`
                    : "Create your first project to get started."}
              </motion.p>
            </div>

            <motion.button
              variants={fadeUp} custom={0.18}
              onClick={() => setShowCreateModal(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="group inline-flex items-center gap-2.5 rounded-xl
                bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700
                px-7 py-3.5 text-sm font-semibold text-white
                shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-xl"
            >
              <Plus size={16} strokeWidth={2.5}
                className="group-hover:rotate-90 transition-transform duration-300" />
              New Project
            </motion.button>
          </div>

          {/* Stats row */}
          {stats.length > 0 && (
            <motion.div
              variants={fadeUp} custom={0.24}
              className={cn(
                "grid grid-cols-4 gap-6 pt-8 mt-8 border-t",
                isDark ? "border-slate-800" : "border-slate-200"
              )}
            >
              {stats.map(({ value, label }) => (
                <div key={label} className="text-center lg:text-left">
                  <div className="text-3xl sm:text-4xl font-black bg-gradient-to-br from-blue-500 to-cyan-600 bg-clip-text text-transparent">
                    {value}
                  </div>
                  <div className={cn("text-sm font-medium mt-0.5",
                    isDark ? "text-slate-400" : "text-slate-600")}>
                    {label}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* ══ Search + Filters + Sort ══ */}
        <motion.div
          className="mb-10 space-y-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.28 }}
        >
          {/* Search bar */}
          <div className={cn(
            "flex items-center gap-3 rounded-2xl px-5 py-4 border transition-all",
            isDark
              ? "bg-slate-900/60 border-slate-700/60 text-white backdrop-blur-sm focus-within:border-blue-500/60"
              : "bg-white/80 border-slate-200 text-slate-900 backdrop-blur-sm shadow-sm focus-within:border-blue-400"
          )}>
            <Search size={16} strokeWidth={2} className={muteText} />
            <input
              type="text" value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or description…"
              className="flex-1 bg-transparent text-sm leading-relaxed outline-none placeholder:text-slate-500"
            />
            {search && (
              <button onClick={() => setSearch("")}
                className={cn("hover:opacity-70 transition-opacity", muteText)}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter pills + Sort controls in one row */}
          <div className="flex items-center justify-between gap-3 flex-wrap">

            {/* Left — status filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter size={12} strokeWidth={2} className={cn(muteText, "flex-shrink-0")} />
              {STATUS_FILTERS.map((s) => (
                <motion.button
                  key={s}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl border px-3.5 py-1.5",
                    "text-xs font-bold uppercase tracking-[0.1em] transition-all duration-300",
                    statusFilter === s
                      ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-blue-500 shadow-md shadow-blue-500/20"
                      : isDark
                        ? "border-slate-700 text-slate-300 bg-slate-800/40 hover:bg-slate-800/70 hover:border-slate-500"
                        : "border-slate-200 text-slate-600 bg-white/70 hover:bg-white hover:border-slate-300"
                  )}
                >
                  {s}
                </motion.button>
              ))}
              {(search || statusFilter !== "All") && total > 0 && (
                <span className={cn("text-sm font-medium ml-1 tabular-nums", muteText)}>
                  {total} result{total !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Right — sort controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <ArrowUpDown size={12} strokeWidth={2} className={cn(muteText, "flex-shrink-0")} />

              {/* Sort-by select */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={cn(
                    controlBase,
                    "pl-3 pr-7 py-1.5 appearance-none cursor-pointer",
                    // keep native arrow but hide default focus ring
                    "focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  )}
                  style={{ backgroundImage: "none" }}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      className={isDark ? "bg-slate-900 text-slate-200" : "bg-white text-slate-800"}
                    >
                      {opt.label}
                    </option>
                  ))}
                </select>
                {/* Custom chevron */}
                <ChevronRight
                  size={12}
                  className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none",
                    muteText
                  )}
                />
              </div>

              {/* Asc / Desc toggle */}
              <motion.button
                onClick={toggleDir}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={sortDir === "asc" ? "Ascending — click for descending" : "Descending — click for ascending"}
                className={cn(controlBase, "px-2.5 py-1.5")}
              >
                <motion.span
                  key={sortDir}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center"
                >
                  {sortDir === "asc"
                    ? <ArrowUp  size={13} strokeWidth={2.5} />
                    : <ArrowDown size={13} strokeWidth={2.5} />
                  }
                </motion.span>
                <span className="uppercase tracking-[0.1em]">
                  {sortDir === "asc" ? "Asc" : "Desc"}
                </span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* ══ Card Grid ══ */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} isDark={isDark} />)}
          </div>
        ) : sortedPaged.length === 0 ? (
          <EmptyState isDark={isDark} hasFilters={!!search || statusFilter !== "All"}
            onCreateClick={() => setShowCreateModal(true)} />
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={stagger} initial="hidden" animate="show"
          >
            {sortedPaged.map((project) => (
              <motion.div key={project._id} variants={scaleIn}>
                <ProjectCard project={project} isDark={isDark}
                  onDelete={setDeleteTarget}
                  onRename={setRenameTarget}
                  onShare={setShareTarget}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ══ Pagination ══ */}
        {totalPages > 1 && (
          <motion.div
            className="flex items-center justify-center gap-2 mt-14"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-semibold",
                "transition-all disabled:opacity-25 disabled:cursor-not-allowed", pgBtn
              )}
            >
              <ChevronLeft size={14} /> Prev
            </button>

            <div className="flex items-center gap-1.5">
              {pageNums.map((item, idx) =>
                item === "…" ? (
                  <span key={`e-${idx}`} className={cn("w-10 h-10 flex items-center justify-center text-sm", muteText)}>…</span>
                ) : (
                  <button key={item} onClick={() => setPage(item)}
                    className={cn("w-10 h-10 rounded-xl text-sm font-bold border transition-all",
                      page === item ? pgActive : pgBtn)}>
                    {item}
                  </button>
                )
              )}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-semibold",
                "transition-all disabled:opacity-25 disabled:cursor-not-allowed", pgBtn
              )}
            >
              Next <ChevronRight size={14} />
            </button>
          </motion.div>
        )}

        {totalPages > 1 && (
          <p className={cn("text-center text-xs mt-4 tabular-nums", muteText)}>
            Page {page} of {totalPages} · {total} project{total !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* ── Modals ── */}
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
      className="flex flex-col items-center justify-center py-32 gap-7 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={cn(
        "w-24 h-24 rounded-3xl border flex items-center justify-center backdrop-blur-sm",
        isDark ? "bg-slate-900/60 border-slate-700/60" : "bg-white/80 border-slate-200 shadow-sm"
      )}>
        <FolderOpen size={40} className={isDark ? "text-slate-500" : "text-slate-400"} strokeWidth={1.4} />
      </div>
      <div className="space-y-3">
        <h3 className={cn("font-bold text-2xl tracking-tight", isDark ? "text-white" : "text-slate-900")}>
          {hasFilters ? "No matching projects" : "No projects yet"}
        </h3>
        <p className={cn("text-lg leading-relaxed max-w-sm", isDark ? "text-slate-300" : "text-slate-600")}>
          {hasFilters ? "Try a different search or clear the filter." : "Create your first project to get started."}
        </p>
      </div>
      {!hasFilters && (
        <motion.button
          onClick={onCreateClick}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          className="group inline-flex items-center gap-2.5 rounded-xl
            bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700
            px-7 py-3.5 text-sm font-semibold text-white
            shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-xl"
        >
          <Sparkles size={16} strokeWidth={2.5} />
          Create First Project
        </motion.button>
      )}
    </motion.div>
  );
}