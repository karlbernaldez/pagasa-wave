import { memo, useCallback } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { STATUS_OPTIONS } from '../constants';

function SearchBarComponent({
  query = '',
  onQueryChange,
  statusFilter = 'all',
  onStatusChange,
  isDarkMode = true,
}) {
  const handleQueryChange = useCallback(
    (event) => onQueryChange?.(event.target.value),
    [onQueryChange],
  );

  const clearQuery = useCallback(
    () => onQueryChange?.(''),
    [onQueryChange],
  );

  const handleStatusClick = useCallback(
    (value) => onStatusChange?.(value === statusFilter ? 'all' : value),
    [onStatusChange, statusFilter],
  );

  const inputWrapCls = isDarkMode
    ? 'border-white/10 bg-white/[0.04] text-slate-100 focus-within:border-cyan-300/30 focus-within:bg-white/[0.07]'
    : 'border-white/80 bg-white/65 text-slate-800 focus-within:border-cyan-200 focus-within:bg-white';

  const pillWrapCls = isDarkMode
    ? 'border-white/10 bg-white/[0.04]'
    : 'border-white/80 bg-white/65';

  const pillCls = (active) =>
    active
      ? isDarkMode
        ? 'border border-cyan-300/20 bg-cyan-400/10 text-cyan-200 shadow-inner shadow-cyan-300/10'
        : 'bg-cyan-600 text-white shadow-sm'
      : isDarkMode
        ? 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
        : 'text-slate-500 hover:bg-white/80 hover:text-slate-800';

  return (
    <div className="flex flex-col gap-3 lg:flex-row">
      <label
        className={`flex min-h-11 flex-1 cursor-text items-center gap-3 rounded-xl border px-4 py-2.5 shadow-sm backdrop-blur-xl transition-all ${inputWrapCls}`}
      >
        <Search size={15} aria-hidden="true" className={isDarkMode ? 'text-slate-500' : 'text-slate-400'} />

        <input
          value={query}
          onChange={handleQueryChange}
          placeholder="Search by name, email, agency, role..."
          aria-label="Search users"
          className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-500"
        />

        {query && (
          <button
            type="button"
            onClick={clearQuery}
            aria-label="Clear search"
            className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg transition-colors ${
              isDarkMode ? 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-200' : 'text-slate-400 hover:bg-white hover:text-slate-700'
            }`}
          >
            <X size={14} />
          </button>
        )}
      </label>

      <div
        role="group"
        aria-label="Filter users by status"
        className={`flex min-h-11 items-center gap-1 overflow-x-auto rounded-xl border px-1.5 py-1.5 shadow-sm backdrop-blur-xl ${pillWrapCls}`}
      >
        <SlidersHorizontal
          size={14}
          aria-hidden="true"
          className={`mx-1.5 shrink-0 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}
        />

        {STATUS_OPTIONS.map(({ value, label }) => {
          const active = statusFilter === value;

          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => handleStatusClick(value)}
              className={`whitespace-nowrap rounded-lg px-3 py-1 text-xs font-black transition-all ${pillCls(active)}`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const SearchBar = memo(SearchBarComponent);
