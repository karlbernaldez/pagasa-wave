const DIFF_LEGEND_ITEMS = [
  { key: 'added', label: 'Added', className: 'bg-emerald-500' },
  { key: 'changed', label: 'Changed', className: 'bg-orange-500' },
  { key: 'removed', label: 'Removed', className: 'bg-red-500' },
  { key: 'unchanged', label: 'Unchanged', className: 'bg-slate-500' },
];

export function DiffMetric({ label, value, tone = 'slate', isDarkMode = false }) {
  const toneClass = isDarkMode
    ? {
        blue: 'border-blue-400/20 bg-blue-500/10 text-blue-300 ring-blue-400/10',
        green: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300 ring-emerald-400/10',
        orange: 'border-orange-400/20 bg-orange-500/10 text-orange-300 ring-orange-400/10',
        red: 'border-red-400/20 bg-red-500/10 text-red-300 ring-red-400/10',
        slate: 'border-white/10 bg-slate-950/70 text-slate-300 ring-white/10',
      }[tone]
    : {
        blue: 'border-blue-100 bg-blue-50 text-blue-700 ring-blue-100',
        green: 'border-emerald-100 bg-emerald-50 text-emerald-700 ring-emerald-100',
        orange: 'border-orange-100 bg-orange-50 text-orange-700 ring-orange-100',
        red: 'border-red-100 bg-red-50 text-red-700 ring-red-100',
        slate: 'border-slate-100 bg-slate-50 text-slate-700 ring-slate-100',
      }[tone];

  return (
    <div className={`rounded-2xl border p-3 ring-1 sm:p-4 ${toneClass}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-70 sm:text-[11px]">{label}</p>
      <p className="mt-1 text-xl font-black leading-none sm:text-2xl">{value}</p>
    </div>
  );
}

export function DiffLegend({ isDarkMode = false }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 rounded-2xl border px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] ${isDarkMode ? 'border-white/10 bg-slate-950/80 text-slate-300' : 'border-slate-200 bg-white/90 text-slate-600'}`}>
      {DIFF_LEGEND_ITEMS.map((item) => (
        <span key={item.key} className="inline-flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full ${item.className}`} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

export function AnnotationDiffSummary({ diff, isDarkMode = false }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3 xl:grid-cols-2">
      <DiffMetric label="Previous" value={diff.previousCount} isDarkMode={isDarkMode} />
      <DiffMetric label="Current" value={diff.currentCount} tone="blue" isDarkMode={isDarkMode} />
      <DiffMetric label="Added" value={diff.added} tone="green" isDarkMode={isDarkMode} />
      <DiffMetric label="Changed" value={diff.changed} tone="orange" isDarkMode={isDarkMode} />
      <DiffMetric label="Removed" value={diff.removed} tone="red" isDarkMode={isDarkMode} />
    </div>
  );
}
