const cn = (...classes) => classes.filter(Boolean).join(' ');

export default function AnalyticsFindings({ findings = [], isDarkMode }) {
  if (!findings.length) return null;

  return (
    <section
      className={cn(
        'rounded-2xl border p-4',
        isDarkMode ? 'border-white/10 bg-slate-950/50' : 'border-slate-200 bg-white'
      )}
      aria-label="Analytical findings"
    >
      <div className="mb-3">
        <h3 className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
          Analytical findings
        </h3>
        <p
          className={cn(
            'mt-1 text-xs font-semibold',
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          )}
        >
          Deterministic observations derived from the selected reporting data.
        </p>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {findings.map((finding) => (
          <article
            key={finding.id}
            className={cn(
              'rounded-xl border px-4 py-3',
              isDarkMode ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-slate-50/70'
            )}
          >
            <p
              className={cn('text-xs font-black', isDarkMode ? 'text-slate-100' : 'text-slate-900')}
            >
              {finding.title}
            </p>
            <p
              className={cn(
                'mt-1 text-xs font-semibold leading-5',
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              )}
            >
              {finding.detail}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
