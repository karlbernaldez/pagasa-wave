const cn = (...classes) => classes.filter(Boolean).join(' ');

const toCount = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
};

const formatLabel = (value) => {
  const label = String(value || 'Unknown').replaceAll('_', ' ').trim();
  return label ? label.charAt(0).toUpperCase() + label.slice(1) : 'Unknown';
};

export default function DashboardBreakdownCard({ title, description, rows = [], isDarkMode }) {
  const normalizedRows = rows
    .map((row) => ({ label: formatLabel(row.label), value: toCount(row.value) }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
  const total = normalizedRows.reduce((sum, row) => sum + row.value, 0);
  const primary = normalizedRows[0] || null;
  const primaryShare = total && primary ? Math.round((primary.value / total) * 100) : 0;
  const insight = primary
    ? normalizedRows.length === 1
      ? `${primary.label} represents all ${total} record${total === 1 ? '' : 's'} in the selected period.`
      : `${primary.label} is the largest group at ${primaryShare}% (${primary.value} of ${total}).`
    : 'No records were found in the selected period.';

  return (
    <section
      className={cn(
        'flex min-h-[360px] flex-col rounded-2xl border p-5',
        isDarkMode ? 'border-white/10 bg-slate-950/50' : 'border-slate-200 bg-white'
      )}
    >
      <div>
        <h3 className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
          {title}
        </h3>
        <p
          className={cn(
            'mt-1 text-xs font-semibold leading-5',
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          )}
        >
          {description}
        </p>
      </div>

      {normalizedRows.length ? (
        <>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <div
              className={cn(
                'rounded-xl border px-3 py-3',
                isDarkMode ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-slate-50'
              )}
            >
              <p
                className={cn(
                  'text-[9px] font-black uppercase tracking-[0.12em]',
                  isDarkMode ? 'text-slate-500' : 'text-slate-400'
                )}
              >
                Total
              </p>
              <p
                className={cn(
                  'mt-1 text-xl font-black tabular-nums',
                  isDarkMode ? 'text-white' : 'text-slate-950'
                )}
              >
                {total}
              </p>
            </div>
            <div
              className={cn(
                'min-w-0 rounded-xl border px-3 py-3',
                isDarkMode ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-slate-50'
              )}
            >
              <p
                className={cn(
                  'text-[9px] font-black uppercase tracking-[0.12em]',
                  isDarkMode ? 'text-slate-500' : 'text-slate-400'
                )}
              >
                Primary
              </p>
              <p
                className={cn(
                  'mt-1 truncate text-sm font-black',
                  isDarkMode ? 'text-white' : 'text-slate-950'
                )}
                title={primary?.label}
              >
                {primary?.label}
              </p>
            </div>
            <div
              className={cn(
                'rounded-xl border px-3 py-3',
                isDarkMode ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-slate-50'
              )}
            >
              <p
                className={cn(
                  'text-[9px] font-black uppercase tracking-[0.12em]',
                  isDarkMode ? 'text-slate-500' : 'text-slate-400'
                )}
              >
                Share
              </p>
              <p
                className={cn(
                  'mt-1 text-xl font-black tabular-nums',
                  isDarkMode ? 'text-cyan-200' : 'text-cyan-700'
                )}
              >
                {primaryShare}%
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {normalizedRows.map((row) => {
              const share = total ? Math.round((row.value / total) * 100) : 0;
              return (
                <div key={row.label}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                    <span
                      className={cn(
                        'min-w-0 truncate font-bold',
                        isDarkMode ? 'text-slate-300' : 'text-slate-700'
                      )}
                    >
                      {row.label}
                    </span>
                    <span
                      className={cn(
                        'shrink-0 font-black tabular-nums',
                        isDarkMode ? 'text-slate-300' : 'text-slate-700'
                      )}
                    >
                      {row.value}
                      <span
                        className={cn(
                          'ml-1.5 text-[10px] font-semibold',
                          isDarkMode ? 'text-slate-500' : 'text-slate-400'
                        )}
                      >
                        {share}%
                      </span>
                    </span>
                  </div>
                  <div
                    className={cn(
                      'h-2 overflow-hidden rounded-full',
                      isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
                    )}
                    aria-label={`${row.label}: ${row.value} (${share}%)`}
                  >
                    <div
                      className="h-full rounded-full bg-cyan-500"
                      style={{ width: `${Math.max(4, share)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className={cn(
              'mt-auto rounded-xl border px-3 py-3 text-[11px] font-semibold leading-5',
              isDarkMode
                ? 'border-cyan-300/10 bg-cyan-400/[0.05] text-slate-300'
                : 'border-cyan-100 bg-cyan-50/60 text-slate-600'
            )}
          >
            {insight}
          </div>
        </>
      ) : (
        <div
          className={cn(
            'grid flex-1 place-items-center text-center text-xs font-semibold',
            isDarkMode ? 'text-slate-500' : 'text-slate-400'
          )}
        >
          No data in the selected period.
        </div>
      )}
    </section>
  );
}
