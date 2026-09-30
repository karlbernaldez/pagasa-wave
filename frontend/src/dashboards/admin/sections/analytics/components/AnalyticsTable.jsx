const cn = (...classes) => classes.filter(Boolean).join(' ');

export default function AnalyticsTable({
  title,
  description,
  headers,
  rows,
  isDarkMode,
  dense = true,
}) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl border',
        isDarkMode ? 'border-white/10 bg-slate-950/50' : 'border-slate-200 bg-white'
      )}
    >
      <div className="border-b border-inherit px-5 py-4">
        <h3 className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
          {title}
        </h3>
        {description ? (
          <p
            className={cn(
              'mt-1 text-xs font-semibold',
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      <div className="overflow-x-auto">
        <table className={cn('min-w-full text-left', dense ? 'text-xs' : 'text-sm')}>
          <thead
            className={isDarkMode ? 'bg-white/[0.04] text-slate-400' : 'bg-slate-50 text-slate-500'}
          >
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className="whitespace-nowrap px-4 py-3 font-black uppercase tracking-wide"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody
            className={
              isDarkMode
                ? 'divide-y divide-white/5 text-slate-300'
                : 'divide-y divide-slate-100 text-slate-700'
            }
          >
            {rows.length ? (
              rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={headers.length} className="px-4 py-12 text-center font-semibold">
                  No records in the selected period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
