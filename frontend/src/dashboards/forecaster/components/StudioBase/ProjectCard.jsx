import { useState, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  FolderOpen,
  Clock,
  BarChart3,
  MoreHorizontal,
  ArrowUpRight,
} from "lucide-react";
import { ContextMenu } from "./ContextMenu";
import { STATUS_META, FALLBACK_STATUS } from "./constants";
import { cn } from "./utils";

function openProject(project) {
  localStorage.setItem("projectId", project._id);
  localStorage.setItem("projectName", project.name);
  localStorage.setItem("chartType", project.chartType ?? "");
  localStorage.setItem("forecastDate", project.forecastDate ?? "");
  window.open(`/studio/${project._id}`, "_blank");
}

export function ProjectCard({ project, isDark, onDelete, onRename, onShare }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const btnRef = useRef(null);

  const meta = STATUS_META[project.status] ?? FALLBACK_STATUS;
  const badgeCls = isDark ? meta.dark : meta.light;

  const handleOpen = (e) => {
    e.preventDefault();
    openProject(project);
  };

  return (
    <div
      onClick={handleOpen}
      className={cn(
        "relative group cursor-pointer rounded-2xl border overflow-hidden transition-all duration-300",
        "flex flex-col justify-between",
        isDark
          ? "bg-[#0c1626] border-slate-800 hover:border-cyan-600 hover:shadow-[0_12px_45px_rgba(0,0,0,0.55)]"
          : "bg-white border-slate-200 hover:border-blue-400 hover:shadow-xl hover:shadow-slate-200/70"
      )}
    >
      {/* Top Section */}
      <div className="px-5 pt-5 pb-3 flex justify-between items-start">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
            isDark
              ? "bg-slate-800 group-hover:bg-cyan-900"
              : "bg-slate-100 group-hover:bg-blue-100"
          )}
        >
          <FolderOpen
            size={16}
            strokeWidth={2}
            className={cn(
              "transition-colors",
              isDark
                ? "text-slate-400 group-hover:text-cyan-400"
                : "text-slate-500 group-hover:text-blue-600"
            )}
          />
        </div>

        {/* Context Menu */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative"
        >
          <button
            ref={btnRef}
            onClick={() => setMenuOpen((v) => !v)}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center border transition-all",
              "opacity-0 group-hover:opacity-100 focus:opacity-100",
              menuOpen && "!opacity-100",
              isDark
                ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-400 hover:text-white"
                : "bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-500 hover:text-slate-900"
            )}
          >
            <MoreHorizontal size={14} />
          </button>

          {menuOpen && (
            <ContextMenu
              isDark={isDark}
              triggerRef={btnRef}
              onClose={() => setMenuOpen(false)}
              onRename={() => onRename(project)}
              onShare={() => onShare(project)}
              onDelete={() => onDelete(project)}
            />
          )}
        </div>
      </div>

      {/* Title + Status */}
      <div className="px-5">
        <div className="flex items-start justify-between gap-3">
          <h3
            className={cn(
              "font-semibold text-base leading-snug truncate flex-1",
              isDark ? "text-slate-100" : "text-slate-900"
            )}
          >
            {project.name}
          </h3>

          <span
            className={cn(
              "text-[11px] font-semibold tracking-wide px-3 py-1 rounded-full border flex items-center gap-2",
              badgeCls
            )}
          >
            <span className={cn("w-2 h-2 rounded-full", meta.dot)} />
            {project.status || "Draft"}
          </span>
        </div>

        {/* Description */}
        <p
          className={cn(
            "mt-2 text-sm leading-relaxed line-clamp-2",
            project.description
              ? isDark
                ? "text-slate-400"
                : "text-slate-600"
              : isDark
              ? "text-slate-600 italic"
              : "text-slate-400 italic"
          )}
        >
          {project.description || "No description added."}
        </p>
      </div>

      {/* Footer */}
      <div
        className={cn(
          "mt-5 px-5 py-4 border-t flex items-center gap-4 text-xs transition-colors",
          isDark
            ? "border-slate-800 text-slate-500"
            : "border-slate-100 text-slate-500"
        )}
      >
        {project.createdAt && (
          <span className="flex items-center gap-1.5">
            <Clock size={12} />
            {formatDistanceToNow(new Date(project.createdAt), {
              addSuffix: true,
            })}
          </span>
        )}

        {project.chartType && (
          <span className="flex items-center gap-1.5 truncate">
            <BarChart3 size={12} />
            <span className="truncate">{project.chartType}</span>
          </span>
        )}

        <span
          className={cn(
            "ml-auto flex items-center gap-1 font-semibold opacity-0 group-hover:opacity-100 transition-opacity",
            isDark ? "text-cyan-400" : "text-blue-500"
          )}
        >
          Open <ArrowUpRight size={13} />
        </span>
      </div>
    </div>
  );
}