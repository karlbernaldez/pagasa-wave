// ProjectCard.jsx — uniform card height, footer pinned to bottom
import { useState, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  FolderOpen, Clock, BarChart3, MoreHorizontal, ArrowUpRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { ContextMenu }                from "./ContextMenu";
import { STATUS_META, FALLBACK_STATUS } from "./constants";
import { cn }                          from "./utils";

function openProject(project) {
  localStorage.setItem("projectId",    project._id);
  localStorage.setItem("projectName",  project.name);
  localStorage.setItem("chartType",    project.chartType    ?? "");
  localStorage.setItem("forecastDate", project.forecastDate ?? "");
  window.open(`/studio/${project._id}`, "_blank");
}

export function ProjectCard({ project, isDark, onDelete, onRename, onShare }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const btnRef = useRef(null);

  const meta     = STATUS_META[project.status] ?? FALLBACK_STATUS;
  const badgeCls = isDark ? meta.dark : meta.light;

  return (
    <motion.div
      onClick={(e) => { e.preventDefault(); openProject(project); }}
      whileHover={{ scale: 1.02, y: -6 }}
      transition={{ type: "spring", stiffness: 200, damping: 22 }}
      className={cn(
        /* ── UNIFORM HEIGHT: fixed h-[300px] with flex col ── */
        "group relative cursor-pointer rounded-2xl border overflow-hidden",
        "flex flex-col h-[300px]",
        isDark
          ? "bg-slate-900/70 border-slate-700/60 backdrop-blur-sm hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-900/40"
          : "bg-white/90 border-slate-200 backdrop-blur-sm hover:border-blue-400/70 hover:shadow-2xl hover:shadow-slate-200/70"
      )}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 pointer-events-none" />
      {/* Shine sweep */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
      </div>
      {/* Corner dots */}
      <motion.div
        className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 pointer-events-none"
        animate={{ scale: [1, 1.4, 1] }}
        transition={{ duration: 2.2, repeat: Infinity }}
      />
      <motion.div
        className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 pointer-events-none"
        animate={{ scale: [1, 1.4, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, delay: 1.1 }}
      />

      {/* ── Top: icon + menu ── */}
      <div className="relative px-6 pt-6 pb-3 flex justify-between items-start flex-shrink-0">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 border",
          isDark
            ? "bg-slate-800/60 border-slate-700/50 group-hover:bg-blue-900/50 group-hover:border-blue-700/50"
            : "bg-slate-100 border-slate-200/80 group-hover:bg-blue-50 group-hover:border-blue-200"
        )}>
          <FolderOpen size={20} strokeWidth={1.8} className={cn(
            "transition-colors",
            isDark ? "text-slate-400 group-hover:text-blue-400" : "text-slate-500 group-hover:text-blue-600"
          )} />
        </div>

        <div onClick={(e) => e.stopPropagation()} className="relative">
          <button
            ref={btnRef}
            onClick={() => setMenuOpen((v) => !v)}
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center border transition-all",
              "opacity-0 group-hover:opacity-100 focus:opacity-100",
              menuOpen && "!opacity-100",
              isDark
                ? "bg-slate-800/60 border-slate-700/60 hover:bg-slate-700/80 text-slate-400 hover:text-white"
                : "bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-500 hover:text-slate-900"
            )}
          >
            <MoreHorizontal size={15} />
          </button>
          {menuOpen && (
            <ContextMenu isDark={isDark} triggerRef={btnRef}
              onClose={() => setMenuOpen(false)}
              onRename={() => onRename(project)}
              onShare={() => onShare(project)}
              onDelete={() => onDelete(project)} />
          )}
        </div>
      </div>

      {/* ── Body: title + status + description — flex-1 to fill space ── */}
      <div className="relative px-6 flex-1 flex flex-col min-h-0">
        {/* Title row + badge */}
        <div className="flex items-start justify-between gap-3 mb-2 flex-shrink-0">
          <h3 className={cn(
            "font-bold text-base leading-snug flex-1 line-clamp-2",
            isDark ? "text-slate-100" : "text-slate-900"
          )}>
            {project.name}
          </h3>

          <span className={cn(
            "inline-flex items-center gap-1.5 flex-shrink-0 rounded-xl border",
            "px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] transition-all duration-300 whitespace-nowrap",
            badgeCls
          )}>
            <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", meta.dot)} />
            {project.status || "Draft"}
          </span>
        </div>

        {/* Description — fills remaining body space, clipped */}
        <p className={cn(
          "text-sm leading-relaxed line-clamp-3 flex-1",
          project.description
            ? isDark ? "text-slate-400" : "text-slate-600"
            : isDark ? "text-slate-600 italic" : "text-slate-400 italic"
        )}>
          {project.description || "No description added."}
        </p>
      </div>

      {/* ── Footer — always pinned to bottom, flex-shrink-0 ── */}
      <div className={cn(
        "relative px-6 py-4 border-t flex items-center gap-4 flex-shrink-0 transition-colors mt-3",
        isDark ? "border-slate-700/50" : "border-slate-100"
      )}>
        {project.createdAt && (
          <span className={cn("flex items-center gap-1.5 text-xs font-medium min-w-0",
            isDark ? "text-slate-500" : "text-slate-500")}>
            <Clock size={12} className="flex-shrink-0" />
            <span className="truncate">{formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}</span>
          </span>
        )}
        {project.chartType && (
          <span className={cn("flex items-center gap-1.5 text-xs font-medium truncate",
            isDark ? "text-slate-500" : "text-slate-500")}>
            <BarChart3 size={12} className="flex-shrink-0" />
            <span className="truncate">{project.chartType}</span>
          </span>
        )}
        <span className={cn(
          "ml-auto flex items-center gap-1.5 text-xs font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 flex-shrink-0",
          "bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"
        )}>
          Open <ArrowUpRight size={13} className="text-cyan-400 flex-shrink-0" />
        </span>
      </div>
    </motion.div>
  );
}