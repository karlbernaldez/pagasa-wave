const cn = (...classes) => classes.filter(Boolean).join(' ');

export default function AnalyticsMetricStrip({ items, isDarkMode }) {
  return (
    <section
      className={cn(
        'grid overflow-hidden rounded-2xl border sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6',
        isDarkMode ? 'border-white/10 bg-slate-950/50' : 'border-slate-200 bg-white'
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="min-w-0 border-b border-inherit px-4 py-4 sm:border-b-0 sm:border-r">
          <p
            className={cn(
              'text-[10px] font-black uppercase tracking-[0.12em]',
              isDarkMode ? 'text-slate-500' : 'text-slate-500'
            )}
          >
            {item.label}
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <p
              className={cn(
                'text-2xl font-black tabular-nums',
                isDarkMode ? 'text-white' : 'text-slate-950'
              )}
            >
              {item.value}
            </p>
            {item.delta ? (
              <span
                className={cn(
                  'text-[11px] font-black',
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                )}
              >
                {item.delta}
              </span>
            ) : null}
          </div>
          {item.helper ? (
            <p
              className={cn(
                'mt-1 text-[11px] font-semibold leading-4',
                isDarkMode ? 'text-slate-500' : 'text-slate-500'
              )}
            >
              {item.helper}
            </p>
          ) : null}
        </div>
      ))}
    </section>
  );
}
