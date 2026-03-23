// studio/components/SkeletonCard.jsx
import { cn } from "./utils";

export function SkeletonCard({ isDark }) {
  const sh   = isDark ? "bg-slate-800"      : "bg-slate-100";
  const soft = isDark ? "bg-slate-800/50"   : "bg-slate-50";
  const div  = isDark ? "bg-slate-800"      : "bg-slate-100";

  return (
    <div className={cn(
      "rounded-2xl border animate-pulse flex flex-col",
      isDark ? "bg-[#0b1525] border-slate-800" : "bg-white border-slate-200"
    )}>
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className={cn("w-9 h-9 rounded-xl", sh)} />
        <div className={cn("w-7 h-7 rounded-lg", sh)} />
      </div>
      <div className="flex items-center justify-between px-4 pb-2 gap-3">
        <div className={cn("h-3.5 rounded flex-1", sh)} />
        <div className={cn("h-5 w-20 rounded-full", sh)} />
      </div>
      <div className="px-4 flex-1 space-y-1.5">
        <div className={cn("h-2.5 rounded", soft)} />
        <div className={cn("h-2.5 rounded w-4/5", soft)} />
      </div>
      <div className={cn("mx-4 mt-4 h-px", div)} />
      <div className="flex gap-3 px-4 py-3">
        <div className={cn("h-2.5 rounded w-24", soft)} />
        <div className={cn("h-2.5 rounded w-16", soft)} />
      </div>
    </div>
  );
}