import ProjectCardSkeleton from "@/features/projects/components/project-library/ProjectCardSkeleton";

export default function GridState({ type, onRetry, isDarkMode = false }) {
  if (type === "loading") {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProjectCardSkeleton key={i} isDarkMode={isDarkMode} />
        ))}
      </div>
    );
  }
  if (type === "error") {
    return (
      <div className={`flex items-center justify-between rounded-2xl border p-6 text-sm ${isDarkMode ? "border-red-500/30 bg-red-950/30 text-red-300" : "border-red-200 bg-red-50 text-red-700"}`}>
        <span className="inline-flex items-center gap-2 font-semibold">
          <AlertCircle size={18} /> Failed to load projects.
        </span>
        <Button variant="ghost" size="sm" onClick={onRetry}>Retry</Button>
      </div>
    );
  }
  return (
    <div className={`rounded-2xl border p-12 text-center shadow-sm ${isDarkMode ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white"}`}>
      <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${isDarkMode ? "bg-cyan-500/10 text-cyan-300" : "bg-blue-50 text-blue-600"}`}>
        <FolderKanban size={26} />
      </div>
      <h3 className={`mt-4 text-base font-black ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>No projects found</h3>
      <p className={`mt-1 text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
        Try clearing filters or adjusting your search.
      </p>
    </div>
  );
}