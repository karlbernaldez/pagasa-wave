import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { UserRow } from './UserRow';

// ─── Columns ──────────────────────────────────────────────────────────────────
const COLUMNS = [
  { key: 'select', label: '', width: 'w-10' },
  { key: 'profile', label: 'Profile', width: 'min-w-[200px]' },
  { key: 'contact', label: 'Contact', width: 'min-w-[160px]' },
  { key: 'agency', label: 'Agency & Position', width: 'min-w-[180px]' },
  { key: 'role', label: 'Role', width: 'min-w-[140px]' },
  { key: 'status', label: 'Status', width: 'min-w-[150px]' },
  { key: 'since', label: 'Member Since', width: 'min-w-[120px]' },
  { key: 'actions', label: 'Actions', width: 'min-w-[100px]' },
];

const PAGE_OPTIONS = [5, 10, 25, 50];

const clampInt = (value, min, max, fallback) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const i = Math.trunc(n);
  return Math.min(max, Math.max(min, i));
};

// ─── Component ────────────────────────────────────────────────────────────────
export function UserTable({
  filteredUsers = [],
  isDarkMode = true,
  onManage,

  selectedIds = new Set(),
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onBulkAction,

  // server mode
  totalCount,
  isServer = false,
  onPageChange,
  onLimitChange,

  // selection semantics (explicit!)
  selectAllScope = 'page', // 'page' | 'filtered'
}) {
  const [params, setParams] = useSearchParams();
  const [jump, setJump] = useState('');

  // URL is the single source of truth
  const page = useMemo(() => clampInt(params.get('page'), 1, Number.MAX_SAFE_INTEGER, 1), [params]);
  const limit = useMemo(() => clampInt(params.get('limit'), 1, 1000, 10), [params]); // cap if you want

  const dataCount = isServer ? Number(totalCount ?? 0) : filteredUsers.length;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(dataCount / limit)), [dataCount, limit]);

  // keep URL in a safe range if someone types invalid values / external nav
  useEffect(() => {
    const clampedPage = clampInt(page, 1, totalPages, 1);
    if (clampedPage !== page) {
      const next = new URLSearchParams(params);
      next.set('page', String(clampedPage));
      next.set('limit', String(limit));
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, totalPages]);

  // notify parent (server mode)
  useEffect(() => {
    if (!isServer) return;
    onPageChange?.(page);
    onLimitChange?.(limit);
  }, [isServer, page, limit, onPageChange, onLimitChange]);

  // client-side pagination slice
  const paginatedUsers = useMemo(() => {
    if (isServer) return filteredUsers; // parent should pass already paginated rows
    const start = (page - 1) * limit;
    return filteredUsers.slice(start, start + limit);
  }, [filteredUsers, page, limit, isServer]);

  const isEmpty = isServer ? dataCount === 0 : paginatedUsers.length === 0;

  // header checkbox state (page-level)
  const pageIds = useMemo(() => paginatedUsers.map((u) => u.id), [paginatedUsers]);
  const allSelectedOnPage = useMemo(
    () => pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id)),
    [pageIds, selectedIds]
  );
  const someSelectedOnPage = useMemo(
    () => pageIds.some((id) => selectedIds.has(id)),
    [pageIds, selectedIds]
  );

  const headerCheckboxRef = useRef(null);
  useEffect(() => {
    if (!headerCheckboxRef.current) return;
    headerCheckboxRef.current.indeterminate = !allSelectedOnPage && someSelectedOnPage;
  }, [allSelectedOnPage, someSelectedOnPage]);

  const updateUrl = useCallback(
    (patch) => {
      const next = new URLSearchParams(params);
      Object.entries(patch).forEach(([k, v]) => next.set(k, String(v)));
      setParams(next, { replace: true });
    },
    [params, setParams]
  );

  const handleLimitChange = useCallback(
    (e) => {
      const nextLimit = clampInt(e.target.value, 1, 1000, 10);
      // changing limit usually resets to page 1 (good UX)
      updateUrl({ limit: nextLimit, page: 1 });
    },
    [updateUrl]
  );

  const gotoPage = useCallback(
    (nextPage) => {
      const p = clampInt(nextPage, 1, totalPages, 1);
      updateUrl({ page: p, limit });
    },
    [updateUrl, totalPages, limit]
  );

  const handleHeaderSelect = useCallback(
    (checked) => {
      if (!checked) return onClearSelection?.();

      if (selectAllScope === 'filtered') {
        // selects all filtered (client mode only makes sense)
        onSelectAll?.(filteredUsers.map((u) => u.id));
        return;
      }

      // default: page scope
      onSelectAll?.(pageIds);
    },
    [filteredUsers, onClearSelection, onSelectAll, pageIds, selectAllScope]
  );

  const thClass = `text-left text-xs font-semibold tracking-widest uppercase py-3 pr-3 ${
    isDarkMode ? 'text-slate-500' : 'text-slate-400'
  }`;

  return (
    <div className="overflow-x-auto -mx-1 px-1 transition-all duration-300">
      <table className="w-full" style={{ minWidth: '920px' }}>
        <thead>
          <tr className={`border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
            {COLUMNS.map((col) => (
              <th key={col.key} className={`${thClass} ${col.width}`}>
                {col.key === 'select' ? (
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    checked={allSelectedOnPage}
                    onChange={(e) => handleHeaderSelect(e.target.checked)}
                    aria-label="Select users"
                  />
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="transition-opacity duration-300">
          {isEmpty ? (
            <tr>
              <td colSpan={COLUMNS.length} className="py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
                    }`}
                  >
                    <Users size={22} className={isDarkMode ? 'text-slate-600' : 'text-slate-400'} />
                  </div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    No users match your search
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            paginatedUsers.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                isDarkMode={isDarkMode}
                onManage={onManage}
                selected={selectedIds.has(user.id)}
                onToggleSelect={onToggleSelect}
              />
            ))
          )}
        </tbody>
      </table>

      {/* ─── Bulk Actions Bar ───────────────────────── */}
      {selectedIds?.size > 0 && (
        <div
          className={`flex items-center justify-between px-3 py-2 rounded-xl mb-3 border ${
            isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <span className="text-sm font-medium">{selectedIds.size} selected</span>

          <div className="flex gap-2">
            <button
              onClick={() => onBulkAction?.('activate')}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600"
            >
              Activate
            </button>

            <button
              onClick={() => onBulkAction?.('suspend')}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600"
            >
              Suspend
            </button>

            <button
              onClick={() => onBulkAction?.('delete')}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-red-500 text-white hover:bg-red-600"
            >
              Delete
            </button>

            <button onClick={onClearSelection} className="px-3 py-1 rounded-lg text-xs border">
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ─── Pagination Bar ───────────────────────── */}
      {!isEmpty && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-1">
          <div className="flex items-center gap-2 text-xs">
            <span className={isDarkMode ? 'text-slate-500' : 'text-slate-400'}>Rows per page:</span>

            <select
              value={limit}
              onChange={handleLimitChange}
              className={`px-2 py-1 rounded-lg border ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              {PAGE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => gotoPage(page - 1)}
              className={`px-2 py-1 rounded-lg border ${
                page === 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              } ${isDarkMode ? 'border-slate-700 text-slate-300' : 'border-slate-200 text-slate-600'}`}
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </button>

            <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Page {page} of {totalPages}
            </span>

            <button
              disabled={page === totalPages}
              onClick={() => gotoPage(page + 1)}
              className={`px-2 py-1 rounded-lg border ${
                page === totalPages ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              } ${isDarkMode ? 'border-slate-700 text-slate-300' : 'border-slate-200 text-slate-600'}`}
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>

            <input
              type="number"
              min={1}
              max={totalPages}
              placeholder="Go"
              value={jump}
              onChange={(e) => setJump(e.target.value)}
              onBlur={() => setJump('')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const n = clampInt(jump, 1, totalPages, page);
                  gotoPage(n);
                  setJump('');
                }
              }}
              className={`w-14 px-2 py-1 rounded-lg border text-xs ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'
              }`}
              aria-label="Jump to page"
            />
          </div>
        </div>
      )}
    </div>
  );
}