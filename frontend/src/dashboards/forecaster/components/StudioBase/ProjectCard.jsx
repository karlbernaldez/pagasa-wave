// ProjectCard.jsx — enriched with full project schema data
import { useState, useRef } from "react";
import { formatDistanceToNow, format } from "date-fns";
import {
  FolderOpen, BarChart3, MoreHorizontal, ArrowUpRight,
  Eye, CalendarDays, GitBranch, Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

const STATUS_ACCENT = {
  Draft:        { strip: "from-slate-400  to-slate-500",  icon: "text-slate-400",  bg: "bg-slate-500/10"  },
  Submitted:    { strip: "from-amber-400  to-orange-500", icon: "text-amber-400",  bg: "bg-amber-500/10"  },
  "Under Review":{ strip: "from-violet-400 to-indigo-500",icon: "text-violet-400", bg: "bg-violet-500/10" },
  Published:    { strip: "from-emerald-400 to-teal-500",  icon: "text-emerald-400",bg: "bg-emerald-500/10"},
  Approved:     { strip: "from-green-400  to-emerald-500",icon: "text-green-400",  bg: "bg-green-500/10"  },
  Rejected:     { strip: "from-red-400    to-rose-500",   icon: "text-red-400",    bg: "bg-red-500/10"    },
};
const FALLBACK_ACCENT = { strip: "from-blue-400 to-cyan-500", icon: "text-blue-400", bg: "bg-blue-500/10" };

export function ProjectCard({ project, isDark, onDelete, onRename, onShare }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const btnRef = useRef(null);

  const meta   = STATUS_META[project.status] ?? FALLBACK_STATUS;
  const accent = STATUS_ACCENT[project.status] ?? FALLBACK_ACCENT;
  const badge  = isDark ? meta.dark : meta.light;

  const lastActivity = project.lastOpenedAt ?? project.updatedAt;
  const forecastLabel = project.forecastDate
    ? format(new Date(project.forecastDate), "MMM d, yyyy")
    : null;
  const lastOpenLabel = lastActivity
    ? formatDistanceToNow(new Date(lastActivity), { addSuffix: true })
    : null;

  return (
    <motion.div
      onClick={(e) => { e.preventDefault(); openProject(project); }}
      whileHover={{ scale: 1.01, y: -2 }}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
      className={cn(
        "group relative cursor-pointer rounded-xl border overflow-hidden",
        "flex flex-col h-[235px]",
        isDark
          ? "bg-slate-900/70 border-slate-700/60 backdrop-blur-sm hover:border-slate-600/80 hover:shadow-xl hover:shadow-black/30"
          : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/70"
      )}
    >
      <div className={cn(
        "absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r opacity-70 group-hover:opacity-100 transition-opacity duration-300",
        accent.strip
      )} />

      <div className="relative px-4 pt-5 pb-2 flex justify-between items-start flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 border",
            isDark
              ? `${accent.bg} border-slate-700/50 group-hover:border-slate-600`
              : `${accent.bg} border-slate-200/80 group-hover:border-slate-300`
          )}>
            <FolderOpen size={16} strokeWidth={1.8} className={cn("transition-colors", accent.icon)} />
          </div>

          {project.version != null && (
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide border",
              isDark
                ? "bg-slate-800/70 border-slate-700 text-slate-400"
                : "bg-slate-100 border-slate-200 text-slate-500"
            )}>
              <GitBranch size={9} strokeWidth={2.5} />
              v{project.version}
            </span>
          )}
        </div>

        <div onClick={(e) => e.stopPropagation()} className="relative">
          <button
            ref={btnRef}
            onClick={() => setMenuOpen((v) => !v)}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center border transition-all",
              "opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100",
              menuOpen && "!opacity-100",
              isDark
                ? "bg-slate-800/60 border-slate-700/60 hover:bg-slate-700/80 text-slate-400 hover:text-white"
                : "bg-white border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-900"
            )}
            aria-label="Project actions"
          >
            <MoreHorizontal size={14} />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <ContextMenu isDark={isDark} triggerRef={btnRef}
                onClose={() => setMenuOpen(false)}
                onRename={() => onRename(project)}
                onShare={() => onShare(project)}
                onDelete={() => onDelete(project)} />
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="relative px-4 flex-1 flex flex-col min-h-0 gap-2">
        <div className="flex items-start justify-between gap-2 flex-shrink-0">
          <h3 className={cn(
            "font-bold text-[15px] leading-snug flex-1 line-clamp-2",
            isDark ? "text-slate-100" : "text-slate-900"
          )}>
            {project.name}
          </h3>

          <span className={cn(
            "inline-flex items-center gap-1.5 flex-shrink-0 rounded-full border",
            "px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] whitespace-nowrap transition-all duration-300",
            badge
          )}>
            <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", meta.dot)} />
            {project.status || "Draft"}
          </span>
        </div>

        {forecastLabel && (
          <div className={cn(
            "inline-flex items-center gap-1.5 self-start px-2 py-0.5 rounded-md text-[10px] font-semibold border flex-shrink-0",
            isDark
              ? "bg-blue-900/30 border-blue-700/40 text-blue-300"
              : "bg-blue-50 border-blue-100 text-blue-600"
          )}>
            <CalendarDays size={10} strokeWidth={2} />
            Forecast · {forecastLabel}
          </div>
        )}

        <p className={cn(
          "text-sm leading-relaxed line-clamp-2",
          project.description
            ? isDark ? "text-slate-400" : "text-slate-600"
            : isDark ? "text-slate-600 italic" : "text-slate-400 italic"
        )}>
          {project.description || "No description added."}
        </p>
      </div>

      <div className={cn(
        "relative px-4 py-2.5 border-t flex items-center gap-0 flex-shrink-0",
        isDark ? "border-slate-700/50" : "border-slate-100"
      )}>
        {project.chartType && (
          <span className={cn(
            "flex items-center gap-1.5 text-[10px] font-semibold capitalize mr-2.5",
            isDark ? "text-slate-500" : "text-slate-400"
          )}>
            <BarChart3 size={10} strokeWidth={2} className="flex-shrink-0" />
            {project.chartType}
          </span>
        )}

        {project.chartType && (
          <span className={cn("w-px h-3 mr-2.5 flex-shrink-0", isDark ? "bg-slate-700" : "bg-slate-200")} />
        )}

        {project.openCount != null && (
          <span className={cn(
            "flex items-center gap-1.5 text-[10px] font-semibold mr-2.5",
            isDark ? "text-slate-500" : "text-slate-400"
          )}>
            <Eye size={10} strokeWidth={2} className="flex-shrink-0" />
            {project.openCount}
          </span>
        )}

        {lastOpenLabel && (
          <span className={cn(
            "flex items-center gap-1.5 text-[10px] font-medium truncate",
            isDark ? "text-slate-600" : "text-slate-400"
          )}>
            <Activity size={10} strokeWidth={2} className="flex-shrink-0" />
            <span className="truncate">{lastOpenLabel}</span>
          </span>
        )}

        <span className={cn(
          "ml-auto hidden items-center gap-1 text-[10px] font-bold flex-shrink-0 lg:flex",
          "opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-1 group-hover:translate-x-0",
          "text-blue-600"
        )}>
          Open <ArrowUpRight size={11} className="text-blue-600 flex-shrink-0" />
        </span>
      </div>
    </motion.div>
  );
}