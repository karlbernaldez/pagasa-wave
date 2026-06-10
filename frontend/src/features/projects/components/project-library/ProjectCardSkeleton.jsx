export default function ProjectCardSkeleton({ isDarkMode = false }) {
  const border = isDarkMode ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white";
  const block = isDarkMode ? "bg-slate-800" : "bg-slate-200";
  const soft = isDarkMode ? "bg-slate-800/70" : "bg-slate-100";
  return (
    <div className={`overflow-hidden rounded-2xl border shadow-sm ${border}`}>
      <div className={`h-[168px] animate-pulse ${block}`} />
      <div className="space-y-4 p-4">
        <div className="space-y-2">
          <div className={`h-4 w-2/3 animate-pulse rounded ${block}`} />
          <div className={`h-3 w-1/3 animate-pulse rounded ${soft}`} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className={`h-9 animate-pulse rounded ${soft}`} />
          <div className={`h-9 animate-pulse rounded ${soft}`} />
        </div>
        <div className={`h-10 animate-pulse rounded ${soft}`} />
      </div>
    </div>
  );
}