import { CheckCircle2, FileText, FolderKanban, Send, Users } from "lucide-react";
import { cn } from "./utils";

const STAT_STYLE = {
  "Total Projects": { icon: FolderKanban, tile: "bg-blue-50 text-blue-700" },
  Drafts: { icon: FileText, tile: "bg-sky-50 text-sky-700" },
  Submitted: { icon: Send, tile: "bg-amber-50 text-amber-700" },
  "Under Review": { icon: Users, tile: "bg-orange-50 text-orange-700" },
  Published: { icon: CheckCircle2, tile: "bg-emerald-50 text-emerald-700" },
};

export default function ProjectStats({ stats }) {
  if (!stats?.length) return null;

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Forecast project summary">
      {stats.map(({ value, label, helper }) => {
        const style = STAT_STYLE[label] ?? STAT_STYLE["Total Projects"];
        const Icon = style.icon;

        return (
          <article
            key={label}
            className="flex min-h-[92px] items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-lg", style.tile)}>
              <Icon size={22} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-slate-500">{label}</p>
              <p className="text-2xl font-black leading-tight tracking-tight text-slate-950">{value}</p>
              <p className="truncate text-xs font-medium text-slate-500">{helper}</p>
            </div>
          </article>
        );
      })}
    </section>
  );
}
