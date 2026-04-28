import { useState, useRef } from "react";
import { formatDistanceToNow, format } from "date-fns";
import {
  Waves,
  Wind,
  CloudSun,
  CalendarDays,
  Eye,
  ExternalLink,
  GitBranch,
  MoreHorizontal,
  UserRound,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

const STATUS_TONE = {
  Draft: "bg-blue-50 text-blue-700 border-blue-100",
  Submitted: "bg-slate-100 text-slate-700 border-slate-200",
  "Under Review": "bg-amber-50 text-amber-700 border-amber-100",
  Published: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Rejected: "bg-rose-50 text-rose-700 border-rose-100",
};

function getTypeMeta(chartType) {
  const key = String(chartType ?? "").toLowerCase();
  if (key.includes("wind")) return { icon: Wind, tile: "bg-sky-50 text-sky-700", label: "Wind & Wave" };
  if (key.includes("warning")) return { icon: CloudSun, tile: "bg-blue-50 text-blue-700", label: "Coastal Forecast" };
  return { icon: Waves, tile: "bg-blue-50 text-blue-700", label: "Wave Forecast" };
}

export function ProjectCard({ project, isDark, onDelete, onRename, onShare }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const btnRef = useRef(null);

  const statusMeta = STATUS_META[project.status] ?? FALLBACK_STATUS;
  const statusTone = STATUS_TONE[project.status] ?? STATUS_TONE.Draft;
  const typeMeta = getTypeMeta(project.chartType);
  const TypeIcon = typeMeta.icon;

  const updatedAt = project.updatedAt ? new Date(project.updatedAt) : null;
  const forecastDate = project.forecastDate ? new Date(project.forecastDate) : null;
  const dateLabel = forecastDate ? format(forecastDate, "MMM d, yyyy") : updatedAt ? format(updatedAt, "MMM d, yyyy") : "No date";
  const timeLabel = updatedAt ? format(updatedAt, "hh:mm a") : "";
  const lastActivity = project.lastOpenedAt ?? project.updatedAt;
  const lastActivityLabel = lastActivity ? formatDistanceToNow(new Date(lastActivity), { addSuffix: true }) : "No activity";

  return (
    <motion.article
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="group flex h-[205px] flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg", typeMeta.tile)}>
            <TypeIcon size={22} strokeWidth={2.1} />
          </div>
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-base font-black leading-tight text-slate-900">{project.name}</h3>
            <p className="mt-1 truncate text-xs font-bold text-slate-500">{project.chartType || typeMeta.label}</p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <span className={cn("inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-bold", statusTone)}>
            {project.status || statusMeta.label || "Draft"}
          </span>
          <div className="mt-3 flex items-center justify-end gap-1.5 text-xs font-semibold text-slate-500">
            <CalendarDays size={13} />
            <span>{dateLabel}</span>
          </div>
          {timeLabel && <p className="mt-0.5 text-xs font-medium text-slate-500">{timeLabel}</p>}
        </div>
      </div>

      <p className="mt-3 line-clamp-2 min-h-[40px] text-sm leading-relaxed text-slate-600">
        {project.description || "No description provided for this forecast project."}
      </p>

      <div className="mt-auto border-t border-slate-100 pt-3">
        <div className="mb-3 flex items-center gap-3 text-xs font-semibold text-slate-500">
          {project.version != null && (
            <span className="inline-flex items-center gap-1"><GitBranch size={12} />v{project.version}</span>
          )}
          <span className="inline-flex items-center gap-1 truncate"><UserRound size={12} />Updated {lastActivityLabel}</span>
          {project.openCount != null && (
            <span className="ml-auto inline-flex items-center gap-1"><Eye size={12} />{project.openCount}</span>
          )}
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => openProject(project)}
            className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white text-xs font-bold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50"
          >
            Open in Studio
            <ExternalLink size={13} />
          </button>
          <div className="relative">
            <button
              ref={btnRef}
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
              aria-label="Project actions"
            >
              <MoreHorizontal size={16} />
            </button>
            <AnimatePresence>
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
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
