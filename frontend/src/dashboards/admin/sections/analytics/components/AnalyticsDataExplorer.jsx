import { useMemo, useState } from 'react';

const cn = (...classes) => classes.filter(Boolean).join(' ');

export default function AnalyticsDataExplorer({
  title,
  description,
  columns,
  rows,
  searchFields = [],
  filters = [],
  isDarkMode,
  pageSize = 15,
}) {
  const [query, setQuery] = useState('');
  const [filterState, setFilterState] = useState(() =>
    Object.fromEntries(filters.map((filter) => [filter.key, 'all']))
  );
  const [sort, setSort] = useState({ key: null, direction: 'asc' });
  const [page, setPage] = useState(1);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const next = (rows || []).filter((row) => {
      if (
        normalizedQuery &&
        !searchFields.some((field) =>
          String(row?.[field] ?? '')
            .toLowerCase()
            .includes(normalizedQuery)
        )
      ) {
        return false;
      }

      return filters.every((filter) => {
        const value = filterState[filter.key];
        return value === 'all' || String(row?.[filter.key] ?? '') === value;
      });
    });

    if (!sort.key) return next;

    return [...next].sort((left, right) => {
      const a = left?.[sort.key];
      const b = right?.[sort.key];
      if (a == null && b == null) return 0;
      if (a == null) return 1;
      if (b == null) return -1;
      const result =
        typeof a === 'number' && typeof b === 'number'
          ? a - b
          : String(a).localeCompare(String(b), undefined, { numeric: true });
      return sort.direction === 'asc' ? result : -result;
    });
  }, [filterState, filters, query, rows, searchFields, sort]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visibleRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (key) => {
    setPage(1);
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  };

  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl border',
        isDarkMode ? 'border-white/10 bg-slate-950/50' : 'border-slate-200 bg-white'
      )}
    >
      <div className="border-b border-inherit p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h3 className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
              {title}
            </h3>
            <p
              className={cn(
                'mt-1 text-xs font-semibold',
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              )}
            >
              {description}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="text-xs font-bold">
              <span className="sr-only">Search records</span>
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Search records…"
                className={cn(
                  'min-h-9 w-56 rounded-lg border px-3 text-xs',
                  isDarkMode
                    ? 'border-white/10 bg-slate-900 text-white placeholder:text-slate-600'
                    : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'
                )}
              />
            </label>
            {filters.map((filter) => (
              <label key={filter.key} className="text-xs font-bold">
                <span className="sr-only">{filter.label}</span>
                <select
                  value={filterState[filter.key]}
                  onChange={(event) => {
                    setFilterState((current) => ({ ...current, [filter.key]: event.target.value }));
                    setPage(1);
                  }}
                  className={cn(
                    'min-h-9 rounded-lg border px-3 text-xs',
                    isDarkMode
                      ? 'border-white/10 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-900'
                  )}
                >
                  <option value="all">All {filter.label}</option>
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>
        <p
          className={cn(
            'mt-3 text-[11px] font-semibold',
            isDarkMode ? 'text-slate-500' : 'text-slate-400'
          )}
        >
          {filteredRows.length} matching record{filteredRows.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs">
          <thead
            className={isDarkMode ? 'bg-white/[0.04] text-slate-400' : 'bg-slate-50 text-slate-500'}
          >
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="whitespace-nowrap px-4 py-3 font-black uppercase tracking-wide"
                >
                  {column.sortable === false ? (
                    column.label
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      className="inline-flex items-center gap-1"
                    >
                      {column.label}
                      {sort.key === column.key ? (sort.direction === 'asc' ? '↑' : '↓') : ''}
                    </button>
                  )}
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
            {visibleRows.length ? (
              visibleRows.map((row, index) => (
                <tr key={row.id || index}>
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums"
                    >
                      {column.render
                        ? column.render(row[column.key], row)
                        : (row[column.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center font-semibold">
                  No matching records.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-inherit px-4 py-3 text-xs font-semibold">
        <span className={isDarkMode ? 'text-slate-500' : 'text-slate-500'}>
          Page {safePage} of {pageCount}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            className="rounded-lg border border-inherit px-3 py-1.5 disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={safePage >= pageCount}
            onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
            className="rounded-lg border border-inherit px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
