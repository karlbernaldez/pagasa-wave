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
    <section aria-label="Forecast project summary">
      <div className="flex gap-2 overflow-x-auto pb-1 sm:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {stats.map(({ value, label }) => {
          const style = STAT_STYLE[label] ?? STAT_STYLE["Total Projects"];
          const Icon = style.icon;

          return (
            <article
              key={label}
              className={cn(
                "flex min-w-[132px] items-center gap-2 rounded-2xl border px-3 py-2 shadow-sm",
                isDarkMode ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white"
              )}
            >
              <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", isDarkMode ? style.darkTile : style.tile)}>
                <Icon size={16} strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className={cn("truncate text-[10px] font-bold leading-tight", isDarkMode ? "text-slate-400" : "text-slate-500")}>{label}</p>
                <p className={cn("text-lg font-black leading-tight", isDarkMode ? "text-slate-50" : "text-slate-950")}>{value}</p>
              </div>
            </article>
          );
        })}
      </div>

      <div className="hidden grid-cols-2 gap-3 sm:grid lg:grid-cols-3 xl:grid-cols-5">
        {stats.map(({ value, label, helper }, index) => {
          const style = STAT_STYLE[label] ?? STAT_STYLE["Total Projects"];
          const Icon = style.icon;
          const isPrimary = index === 0;

          return (
            <article
              key={label}
              className={cn(
                "min-w-0 rounded-xl border p-3 shadow-sm transition-colors sm:flex sm:min-h-[92px] sm:items-center sm:gap-4 sm:p-4",
                isPrimary && "col-span-2 lg:col-span-1",
                isDarkMode ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white"
              )}
            >
              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:h-12 sm:w-12", isDarkMode ? style.darkTile : style.tile)}>
                  <Icon size={20} strokeWidth={2} className="sm:h-[22px] sm:w-[22px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate text-[11px] font-bold sm:text-xs", isDarkMode ? "text-slate-400" : "text-slate-500")}>{label}</p>
                  <p className={cn("text-xl font-black leading-tight tracking-tight sm:text-2xl", isDarkMode ? "text-slate-50" : "text-slate-950")}>{value}</p>
                  <p className={cn("truncate text-[11px] font-medium sm:text-xs", isDarkMode ? "text-slate-500" : "text-slate-500")}>{helper}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
