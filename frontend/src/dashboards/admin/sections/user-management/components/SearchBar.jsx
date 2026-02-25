import React, { memo, useCallback } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { STATUS_OPTIONS } from '../constants';

/**
 * Combined search input + status filter pill group.
 * Optimized + accessible + memoized.
 */
function SearchBarComponent({
  query = '',
  onQueryChange,
  statusFilter,
  onStatusChange,
  isDarkMode = true,
}) {

  const base = isDarkMode
    ? 'bg-slate-900/70 border-slate-700/60 text-slate-100 placeholder:text-slate-500 focus-within:border-cyan-500/60 focus-within:shadow-cyan-500/10'
    : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus-within:border-cyan-400 focus-within:shadow-cyan-100';

  const handleQueryChange = useCallback(
    (e) => onQueryChange?.(e.target.value),
    [onQueryChange]
  );

  const clearQuery = useCallback(() => {
    onQueryChange?.('');
  }, [onQueryChange]);

  const handleStatusClick = useCallback(
    (value) => {
      if (value !== statusFilter) {
        onStatusChange?.(value);
      }
    },
    [onStatusChange, statusFilter]
  );

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">

      {/* SEARCH INPUT */}
      <label
        className={`flex items-center gap-3 flex-1 px-4 py-2.5 rounded-xl border transition-all duration-200 shadow-sm focus-within:shadow-lg cursor-text ${base}`}
      >
        <Search
          size={15}
          aria-hidden="true"
          className={isDarkMode ? 'text-slate-500' : 'text-slate-400'}
        />

        <input
          value={query}
          onChange={handleQueryChange}
          placeholder="Search by name, email, agency, role…"
          aria-label="Search users"
          className="w-full bg-transparent text-sm outline-none"
        />

        {query && (
          <button
            type="button"
            onClick={clearQuery}
            aria-label="Clear search"
            className={`inline-flex items-center justify-center rounded transition-colors ${
              isDarkMode
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <X size={14} />
          </button>
        )}
      </label>

      {/* STATUS FILTER PILLS */}
      <div
        role="group"
        aria-label="Filter users by status"
        className={`flex items-center gap-1 px-1.5 py-1.5 rounded-xl border ${
          isDarkMode
            ? 'bg-slate-900/70 border-slate-700/60'
            : 'bg-slate-50 border-slate-200'
        }`}
      >
        <SlidersHorizontal
          size={14}
          aria-hidden="true"
          className={`mx-1.5 shrink-0 ${
            isDarkMode ? 'text-slate-500' : 'text-slate-400'
          }`}
        />

        {STATUS_OPTIONS.map(({ value, label }) => {
          const active = statusFilter === value;

          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => handleStatusClick(value)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-150 ${
                active
                  ? isDarkMode
                    ? 'bg-cyan-500/20 text-cyan-300 shadow-inner border border-cyan-500/30'
                    : 'bg-cyan-500 text-white shadow-sm'
                  : isDarkMode
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white'
              }`}
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