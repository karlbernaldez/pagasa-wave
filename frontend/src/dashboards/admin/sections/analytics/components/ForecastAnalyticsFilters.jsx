const cn = (...classes) => classes.filter(Boolean).join(' ');

export default function ForecastAnalyticsFilters({
  filters,
  options,
  onChange,
  disabled = false,
  isDarkMode,
}) {
  const chartTypes = options?.chartTypes || [];
  const statuses = options?.statuses || [];

  const update = (patch) => onChange({ ...filters, ...patch });
  const hasFilters = Boolean(filters.status || filters.chartType);

  return (
    <section
      className={cn(
        'rounded-2xl border p-4',
        isDarkMode ? 'border-white/10 bg-slate-950/50' : 'border-slate-200 bg-white'
      )}
      aria-label="Forecast analytics filters"
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h3 className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
            Analysis filters
          </h3>
          <p
            className={cn(
              'mt-1 text-xs font-semibold leading-5',
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            )}
          >
            Filters are applied by the server so KPIs, trends, timing, bottlenecks, findings, and
            explorer records use the same analytical scope.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs font-bold">
            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
              Chart / horizon
            </span>
            <select
              value={filters.chartType || ''}
              disabled={disabled}
              onChange={(event) => update({ chartType: event.target.value })}
              className={cn(
                'mt-1 block min-h-9 min-w-52 rounded-lg border px-3 text-xs',
                isDarkMode
                  ? 'border-white/10 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-900'
              )}
            >
              <option value="">All forecast packages</option>
              {chartTypes.map((option) => (
                <option key={option.chartType} value={option.chartType}>
                  {option.horizonHours === 0
                    ? `${option.label} · Analysis`
                    : `${option.label} · T+${option.horizonHours}`}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-bold">
            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Status</span>
            <select
              value={filters.status || ''}
              disabled={disabled}
              onChange={(event) => update({ status: event.target.value })}
              className={cn(
                'mt-1 block min-h-9 min-w-44 rounded-lg border px-3 text-xs',
                isDarkMode
                  ? 'border-white/10 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-900'
              )}
            >
              <option value="">All statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            disabled={disabled || !hasFilters}
            onClick={() => onChange({ status: '', chartType: '' })}
            className={cn(
              'min-h-9 rounded-lg border px-3 py-2 text-xs font-black disabled:opacity-40',
              isDarkMode
                ? 'border-white/10 bg-white/[0.04] text-slate-200'
                : 'border-slate-200 bg-white text-slate-700'
            )}
          >
            Reset filters
          </button>
        </div>
      </div>

      <p
        className={cn(
          'mt-3 text-[11px] font-semibold',
          isDarkMode ? 'text-slate-500' : 'text-slate-400'
        )}
      >
        {filters.chartType
          ? 'Current analysis unit: individual forecast chart project. Status applies to that chart project.'
          : 'Current analysis unit: Forecast Package. Status applies to the package.'}
      </p>
    </section>
  );
}
