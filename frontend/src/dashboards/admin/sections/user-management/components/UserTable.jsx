import React, { useMemo, useEffect, useRef, useState, useCallback, memo } from 'react';
import { Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { UserRow } from './UserRow';

// ─── Constants ────────────────────────────────────────────────────────────────

const COLUMNS = [
  { key: 'select',  label: '',                  width: 'w-10'          },
  { key: 'profile', label: 'Profile',           width: 'min-w-[200px]' },
  { key: 'contact', label: 'Contact',           width: 'min-w-[160px]' },
  { key: 'agency',  label: 'Agency & Position', width: 'min-w-[180px]' },
  { key: 'role',    label: 'Role',              width: 'min-w-[140px]' },
  { key: 'status',  label: 'Status',            width: 'min-w-[150px]' },
  { key: 'since',   label: 'Member Since',      width: 'min-w-[120px]' },
  { key: 'actions', label: 'Actions',           width: 'min-w-[100px]' },
];

const PAGE_OPTIONS = [5, 10, 25, 50];

const BULK_ACTIONS = [
  { action: 'activate', label: 'Activate', cls: 'bg-emerald-500 hover:bg-emerald-600' },
  { action: 'suspend',  label: 'Suspend',  cls: 'bg-amber-500  hover:bg-amber-600'   },
  { action: 'delete',   label: 'Delete',   cls: 'bg-red-500    hover:bg-red-600'     },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const clampInt = (value, min, max, fallback) => {
  const n = Math.trunc(Number(value));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

const snapToPageOption = (limit) =>
  PAGE_OPTIONS.includes(limit)
    ? limit
    : PAGE_OPTIONS.reduce((best, cur) =>
        Math.abs(cur - limit) < Math.abs(best - limit) ? cur : best
      );

// Returns Tailwind classes for a themed input / select / button border element
const inputCls = (isDarkMode) =>
  `px-2 py-1 rounded-lg border text-xs ${
    isDarkMode
      ? 'border-white/10 bg-white/[0.04] text-slate-300'
      : 'border-white/80 bg-white/70 text-slate-600'
  }`;

const navBtnCls = (disabled, isDarkMode) =>
  `px-2 py-1 rounded-lg border ${
    disabled
      ? 'opacity-40 cursor-not-allowed'
      : isDarkMode ? 'hover:bg-white/[0.07]' : 'hover:bg-white'
  } ${isDarkMode ? 'border-white/10 text-slate-300' : 'border-white/80 text-slate-600'}`;

// ─── Sub-components (memo to skip re-renders when props haven't changed) ──────

const EmptyState = memo(({ isDarkMode, colSpan }) => (
  <tr>
    <td colSpan={colSpan} className="py-16 text-center">
      <div className="flex flex-col items-center gap-3">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            isDarkMode ? 'bg-white/[0.06]' : 'bg-white/70'
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
));
EmptyState.displayName = 'EmptyState';

const BulkActionsBar = memo(({ count, isDarkMode, onBulkAction, onClearSelection }) => {
  if (!count) return null;

  return (
    <div
      className={`flex items-center justify-between px-3 py-2 rounded-xl mb-3 border ${
        isDarkMode ? 'border-white/10 bg-white/[0.06]' : 'border-white/80 bg-white/70'
      }`}
    >
      <span className="text-sm font-medium">{count} selected</span>

      <div className="flex gap-2">
        {BULK_ACTIONS.map(({ action, label, cls }) => (
          <button
            key={action}
            onClick={() => onBulkAction?.(action)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold text-white ${cls}`}
          >
            {label}
          </button>
        ))}

        <button
          onClick={onClearSelection}
          className={`px-3 py-1 rounded-lg text-xs border ${
            isDarkMode ? 'border-slate-600 text-slate-300' : 'border-slate-300 text-slate-600'
          }`}
        >
          Clear
        </button>
      </div>
    </div>
  );
});
BulkActionsBar.displayName = 'BulkActionsBar';

const PaginationBar = memo(({ page, totalPages, limit, isDarkMode, onPageChange, onLimitChange }) => {
  const [jump, setJump] = useState('');
  const ic = inputCls(isDarkMode);

  const handleJump = () => {
    const n = clampInt(jump, 1, totalPages, page);
    onPageChange(n);
    setJump('');
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-1">

      {/* Rows per page */}
      <div className="flex items-center gap-2 text-xs">
        <span className={isDarkMode ? 'text-slate-500' : 'text-slate-400'}>Rows per page:</span>
        <select value={limit} onChange={(e) => onLimitChange(Number(e.target.value))} className={ic}>
          {PAGE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {/* Page navigation */}
      <div className="flex items-center gap-2">
        <button
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className={navBtnCls(page === 1, isDarkMode)}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </button>

        <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Page {page} of {totalPages}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          className={navBtnCls(page === totalPages, isDarkMode)}
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </button>

        {/* Jump to page */}
        <input
          type="number"
          min={1}
          max={totalPages}
          placeholder="Go"
          value={jump}
          onChange={(e) => setJump(e.target.value)}
          onBlur={() => setJump('')}
          onKeyDown={(e) => e.key === 'Enter' && handleJump()}
          className={`w-14 ${ic}`}
          aria-label="Jump to page"
        />
      </div>
    </div>
  );
});
PaginationBar.displayName = 'PaginationBar';

// ─── UserTable ────────────────────────────────────────────────────────────────

/**
 * UserTable
 *
 * Two modes:
 *   Client (isServer=false) – slices filteredUsers locally.
 *   Server  (isServer=true)  – parent passes paginated rows + totalCount.
 *
 * Pagination lives in the URL (?page & ?limit) so it survives hard reloads.
 *
 * Pass `isLoading={true}` while data is in flight — without it the URL-clamp
 * effect sees totalPages=1 (empty data) and resets the URL to page=1 before
 * the real data arrives.
 */
export function UserTable({
  filteredUsers  = [],
  isDarkMode     = true,
  onManage,
  isLoading      = false,

  // selection
  selectedIds    = new Set(),
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onBulkAction,
  selectAllScope = 'page', // 'page' | 'filtered'

  // server mode
  totalCount,
  isServer   = false,
  onPageChange,
  onLimitChange,
}) {
  const [params, setParams] = useSearchParams();

  // ── Derive state from URL ─────────────────────────────────────────────────
  const page  = useMemo(() => clampInt(params.get('page'),  1, Number.MAX_SAFE_INTEGER, 1),  [params]);
  const limit = useMemo(() => clampInt(params.get('limit'), 5, 1000,                   10), [params]);

  const dataCount  = isServer ? Number(totalCount ?? 0) : filteredUsers.length;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(dataCount / limit)), [dataCount, limit]);

  // ── URL normalisation ─────────────────────────────────────────────────────
  // Guard: skip while loading so page isn't clamped to 1 before data arrives.
  // This is the fix for the reload-resets-to-page-1 bug.
  useEffect(() => {
    if (isLoading) return;

    const clampedPage  = clampInt(page, 1, totalPages, 1);
    const snappedLimit = snapToPageOption(limit);

    if (clampedPage !== page || snappedLimit !== limit) {
      const next = new URLSearchParams(params);
      next.set('page',  String(clampedPage));
      next.set('limit', String(snappedLimit));
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, page, limit, totalPages]);

  // ── Notify parent (server mode) ───────────────────────────────────────────
  useEffect(() => {
    if (!isServer) return;
    onPageChange?.(page);
    onLimitChange?.(limit);
  }, [isServer, page, limit, onPageChange, onLimitChange]);

  // ── Client-side slice ─────────────────────────────────────────────────────
  const paginatedUsers = useMemo(() => {
    if (isServer) return filteredUsers;
    const start = (page - 1) * limit;
    return filteredUsers.slice(start, start + limit);
  }, [filteredUsers, isServer, page, limit]);

  const isEmpty = !isLoading && paginatedUsers.length === 0;

  // ── Header checkbox ───────────────────────────────────────────────────────
  const pageIds = useMemo(() => paginatedUsers.map((u) => u.id), [paginatedUsers]);

  const allSelectedOnPage = useMemo(
    () => pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id)),
    [pageIds, selectedIds],
  );
  const someSelectedOnPage = useMemo(
    () => !allSelectedOnPage && pageIds.some((id) => selectedIds.has(id)),
    [allSelectedOnPage, pageIds, selectedIds],
  );

  const headerCheckboxRef = useRef(null);
  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someSelectedOnPage;
    }
  }, [someSelectedOnPage]);

  // ── URL update ────────────────────────────────────────────────────────────
  const updateUrl = useCallback(
    (patch) => {
      const next = new URLSearchParams(params);
      Object.entries(patch).forEach(([k, v]) => next.set(k, String(v)));
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  const gotoPage = useCallback(
    (nextPage) => updateUrl({ page: clampInt(nextPage, 1, totalPages, 1), limit }),
    [updateUrl, totalPages, limit],
  );

  const handleLimitChange = useCallback(
    (nextLimit) => updateUrl({ limit: snapToPageOption(nextLimit), page: 1 }),
    [updateUrl],
  );

  const handleHeaderSelect = useCallback(
    (checked) => {
      if (!checked) return onClearSelection?.();
      onSelectAll?.(selectAllScope === 'filtered' ? filteredUsers.map((u) => u.id) : pageIds);
    },
    [filteredUsers, onClearSelection, onSelectAll, pageIds, selectAllScope],
  );

  // ── Styles ────────────────────────────────────────────────────────────────
  const thClass = `text-left text-xs font-semibold tracking-widest uppercase py-3 pr-3 ${
    isDarkMode ? 'text-slate-500' : 'text-slate-400'
  }`;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="overflow-x-auto -mx-1 px-1 transition-all duration-300">

      <BulkActionsBar
        count={selectedIds.size}
        isDarkMode={isDarkMode}
        onBulkAction={onBulkAction}
        onClearSelection={onClearSelection}
      />

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
                    aria-label="Select all on page"
                  />
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="transition-opacity duration-300">
          {isEmpty
            ? <EmptyState isDarkMode={isDarkMode} colSpan={COLUMNS.length} />
            : paginatedUsers.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  isDarkMode={isDarkMode}
                  onManage={onManage}
                  selected={selectedIds.has(user.id)}
                  onToggleSelect={onToggleSelect}
                />
              ))
          }
        </tbody>
      </table>

      {!isEmpty && (
        <PaginationBar
          page={page}
          totalPages={totalPages}
          limit={limit}
          isDarkMode={isDarkMode}
          onPageChange={gotoPage}
          onLimitChange={handleLimitChange}
        />
      )}
    </div>
  );
}
