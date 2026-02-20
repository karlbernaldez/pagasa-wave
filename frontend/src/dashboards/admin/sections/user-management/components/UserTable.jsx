import React, { useState, useMemo, useEffect } from 'react';
import { Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { UserRow } from './UserRow';
import { useSearchParams } from 'react-router-dom';

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

// ─── Component ────────────────────────────────────────────────────────────────
export function UserTable({
  filteredUsers,
  isDarkMode,
  onUpdateUser,
  onManage,

  selectedIds,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onBulkAction,

  totalCount,
  isServer = false,
  onPageChange,
  onLimitChange,
}) {

  const [params, setParams] = useSearchParams();

  // ─── URL state
  const initialPage = Number(params.get('page')) || 1;
  const initialLimit = Number(params.get('limit')) || 10;

  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [jump, setJump] = useState('');

  // persist to URL
  useEffect(() => {
    setParams({ page, limit });
  }, [page, limit]);

  // notify parent if server mode
  useEffect(() => {
    if (isServer) {
      onPageChange?.(page);
      onLimitChange?.(limit);
    }
  }, [page, limit, isServer]);

  // ─── totals
  const dataCount = isServer ? totalCount ?? 0 : filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(dataCount / limit));

  // reset page if shrinking
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages]);

  // ─── local pagination slice (client mode only)
  const paginatedUsers = useMemo(() => {
    if (isServer) return filteredUsers;
    const start = (page - 1) * limit;
    return filteredUsers.slice(start, start + limit);
  }, [filteredUsers, page, limit, isServer]);

  const isEmpty = paginatedUsers.length === 0;

  const thClass = `text-left text-xs font-semibold tracking-widest uppercase py-3 pr-3 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'
    }`;

  return (
    <div className="overflow-x-auto -mx-1 px-1 transition-all duration-300">

      <table className="w-full" style={{ minWidth: '920px' }}>
        <thead>
          <tr className={`border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
            {COLUMNS.map(col => (
              <th key={col.key} className={`${thClass} ${col.width}`}>
                {col.key === 'select' ? (
                  <input
                    type="checkbox"
                    checked={
                      paginatedUsers.length > 0 &&
                      paginatedUsers.every(u => selectedIds.has(u.id))
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        onSelectAll(paginatedUsers.map(u => u.id));
                      } else {
                        onClearSelection();
                      }
                    }}
                  />
                ) : col.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="transition-opacity duration-300">
          {isEmpty ? (
            <tr>
              <td colSpan={COLUMNS.length} className="py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
                    }`}>
                    <Users size={22} className={isDarkMode ? 'text-slate-600' : 'text-slate-400'} />
                  </div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                    No users match your search
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            paginatedUsers.map(user => (
              <UserRow
                key={user.id}
                user={user}
                isDarkMode={isDarkMode}
                onUpdateUser={onUpdateUser}
                onManage={onManage}

                selected={selectedIds.has(user.id)}
                onToggleSelect={onToggleSelect}
              />
            ))
          )}
        </tbody>
      </table>

      {selectedIds?.size > 0 && (
        <div className={`flex items-center justify-between px-3 py-2 rounded-xl mb-3 border
    ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}
  `}>

          <span className="text-sm font-medium">
            {selectedIds.size} selected
          </span>

          <div className="flex gap-2">

            <button
              onClick={() => onBulkAction('activate')}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600"
            >
              Activate
            </button>

            <button
              onClick={() => onBulkAction('suspend')}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600"
            >
              Suspend
            </button>

            <button
              onClick={() => onBulkAction('delete')}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-red-500 text-white hover:bg-red-600"
            >
              Delete
            </button>

            <button
              onClick={onClearSelection}
              className="px-3 py-1 rounded-lg text-xs border"
            >
              Clear
            </button>

          </div>
        </div>
      )}

      {/* ─── Pagination Bar ───────────────────────── */}
      {!isEmpty && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-1">

          {/* rows per page */}
          <div className="flex items-center gap-2 text-xs">
            <span className={isDarkMode ? 'text-slate-500' : 'text-slate-400'}>
              Rows per page:
            </span>

            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className={`px-2 py-1 rounded-lg border ${isDarkMode
                ? 'bg-slate-900 border-slate-700 text-slate-300'
                : 'bg-white border-slate-200 text-slate-600'
                }`}
            >
              {PAGE_OPTIONS.map(opt => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* page controls */}
          <div className="flex items-center gap-2">

            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className={`px-2 py-1 rounded-lg border ${page === 1
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                } ${isDarkMode
                  ? 'border-slate-700 text-slate-300'
                  : 'border-slate-200 text-slate-600'
                }`}
            >
              <ChevronLeft size={14} />
            </button>

            <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Page {page} of {totalPages}
            </span>

            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className={`px-2 py-1 rounded-lg border ${page === totalPages
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                } ${isDarkMode
                  ? 'border-slate-700 text-slate-300'
                  : 'border-slate-200 text-slate-600'
                }`}
            >
              <ChevronRight size={14} />
            </button>

            {/* jump to page */}
            <input
              type="number"
              min="1"
              max={totalPages}
              placeholder="Go"
              value={jump}
              onChange={(e) => setJump(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const n = Number(jump);
                  if (n >= 1 && n <= totalPages) {
                    setPage(n);
                    setJump('');
                  }
                }
              }}
              className={`w-14 px-2 py-1 rounded-lg border text-xs ${isDarkMode
                ? 'bg-slate-900 border-slate-700 text-slate-300'
                : 'bg-white border-slate-200 text-slate-600'
                }`}
            />

          </div>

        </div>
      )}

    </div>
  );
}
