import { CheckCircle2, FileText, FolderKanban, Send, Users } from "lucide-react";
import { cn } from "./utils";

const STAT_STYLE = {
  "Total Projects": { icon: FolderKanban, tile: "bg-blue-50 text-blue-700", darkTile: "bg-blue-500/10 text-blue-300" },
  Drafts: { icon: FileText, tile: "bg-sky-50 text-sky-700", darkTile: "bg-sky-500/10 text-sky-300" },
  Submitted: { icon: Send, tile: "bg-amber-50 text-amber-700", darkTile: "bg-amber-500/10 text-amber-300" },
  "Under Review": { icon: Users, tile: "bg-orange-50 text-orange-700", darkTile: "bg-orange-500/10 text-orange-300" },
  "Needs Revision": { icon: FileText, tile: "bg-yellow-50 text-yellow-700", darkTile: "bg-yellow-500/10 text-yellow-300" },
  Published: { icon: CheckCircle2, tile: "bg-emerald-50 text-emerald-700", darkTile: "bg-emerald-500/10 text-emerald-300" },
};

export default function ProjectStats({ stats, isDarkMode = false }) {
  if (!stats?.length) return null;

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Forecast project summary">
      {stats.map(({ value, label, helper }) => {
        const style = STAT_STYLE[label] ?? STAT_STYLE["Total Projects"];
        const Icon = style.icon;

        return (
          <article
            key={label}
            className={cn(
              "flex min-h-[92px] items-center gap-4 rounded-xl border p-4 shadow-sm transition-colors",
              isDarkMode ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white"
            )}
          >
            <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-lg", isDarkMode ? style.darkTile : style.tile)}>
              <Icon size={22} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className={cn("truncate text-xs font-bold", isDarkMode ? "text-slate-400" : "text-slate-500")}>{label}</p>
              <p className={cn("text-2xl font-black leading-tight tracking-tight", isDarkMode ? "text-slate-50" : "text-slate-950")}>{value}</p>
              <p className={cn("truncate text-xs font-medium", isDarkMode ? "text-slate-500" : "text-slate-500")}>{helper}</p>
            </div>
          </article>
        );
      })}
    </section>
  );
}
