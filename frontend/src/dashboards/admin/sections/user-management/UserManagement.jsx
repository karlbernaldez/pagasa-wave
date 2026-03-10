import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Plus, Users, UserCheck, Clock, Ban } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useUsers } from './hooks/useUsers';
import { SearchBar } from './components/SearchBar';
import { UserTable } from './components/UserTable';
import { AddUserModal } from './components/AddUserModal';
import { ManageUserModal } from './components/ManageUserModal';
import { RolesSection } from './components/RolesSection';
import { STATUS_LABELS } from './constants';

// ─── StatCard ─────────────────────────────────────────────────────────────────

const COLOR_MAP = {
  cyan: { light: 'text-cyan-600 bg-cyan-50 border-cyan-100', dark: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20' },
  emerald: { light: 'text-emerald-600 bg-emerald-50 border-emerald-100', dark: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  amber: { light: 'text-amber-600 bg-amber-50 border-amber-100', dark: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  red: { light: 'text-red-600 bg-red-50 border-red-100', dark: 'text-red-400 bg-red-400/10 border-red-400/20' },
};

function StatCard({ icon: Icon, label, value, color, isDarkMode }) {
  const c = COLOR_MAP[color]?.[isDarkMode ? 'dark' : 'light'] ?? '';

  return (
    <div
      className={`rounded-xl border p-4 flex items-center gap-3 ${isDarkMode ? 'bg-slate-900/60 border-slate-700/60' : 'bg-white border-slate-200'
        }`}
    >
      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${c}`}>
        <Icon size={16} />
      </div>
      <div>
        <p className={`text-xl font-bold leading-none ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
          {value}
        </p>
        <p className="text-xs mt-0.5 text-slate-500">{label}</p>
      </div>
    </div>
  );
}

// ─── UserManagementSection ────────────────────────────────────────────────────

const UserManagementSection = ({ isDarkMode = true, mode = 'list' }) => {
  const [searchParams] = useSearchParams();
  const [userSearchQuery, setUserSearchQuery] = useState(() => searchParams.get('q') ?? '');
  const [statusFilter, setStatusFilter] = useState('all');

  const {
    users,         // current page rows
    total,         // total matching documents (from server)
    isLoadingUsers,
    newUser,
    setNewUser,
    resetNewUser,
    createUser,
    replaceUser,
    deleteUser,
    bulkUpdateUsers,
  } = useUsers({
    statusFilter,
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [manageUserId, setManageUserId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const normalizedSearchQuery = userSearchQuery.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    if (!normalizedSearchQuery) return users;

    return users.filter((u) => {
      const haystack = [
        u.username,
        u.firstName,
        u.lastName,
        u.email,
        u.contact,
        u.agency,
        u.position,
        u.role,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearchQuery);
    });
  }, [users, normalizedSearchQuery]);

  const managedUser = useMemo(
    () => users.find((u) => u.id === manageUserId) ?? null,
    [users, manageUserId]
  );

  const stats = useMemo(() => {
    const counts = { active: 0, pending: 0, suspended: 0 };
    for (const u of filteredUsers) {
      if (u.status in counts) counts[u.status]++;
    }
    return { total, ...counts };
  }, [filteredUsers, total]);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) setUserSearchQuery(q);
  }, [searchParams]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleAddSubmit = async (payload) => {
    const ok = await createUser(payload);
    if (ok) {
      setIsAddModalOpen(false);
      resetNewUser();
    }
  };

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);
  const selectAll = useCallback((ids) => setSelectedIds(new Set(ids)), []);

  const applyBulkAction = useCallback((action, payload) => {
    switch (action) {
      case 'delete':
        bulkUpdateUsers(selectedIds, 'delete');
        break;
      case 'activate':
        bulkUpdateUsers(selectedIds, (u) => ({ ...u, status: 'active', statusLabel: STATUS_LABELS.active }));
        break;
      case 'suspend':
        bulkUpdateUsers(selectedIds, (u) => ({ ...u, status: 'suspended', statusLabel: STATUS_LABELS.suspended }));
        break;
      case 'role':
        bulkUpdateUsers(selectedIds, (u) => ({ ...u, role: payload }));
        break;
      default:
        break;
    }
    clearSelection();
  }, [bulkUpdateUsers, clearSelection, selectedIds]);

  // ── Subtitle ─────────────────────────────────────────────────────────────────

  const subtitle = useMemo(() => {
    if (isLoadingUsers) return 'Loading…';
    const hasFilter = userSearchQuery.trim() || statusFilter;
    return hasFilter
      ? `Showing ${filteredUsers.length} result${filteredUsers.length !== 1 ? 's' : ''} on this page`
      : `${total} user${total !== 1 ? 's' : ''} registered`;
  }, [filteredUsers.length, isLoadingUsers, userSearchQuery, statusFilter, total]);

  // ── Roles mode ───────────────────────────────────────────────────────────────

  if (mode === 'roles') return <RolesSection isDarkMode={isDarkMode} />;

  const card = isDarkMode
    ? 'bg-slate-900/80 border border-slate-700/60'
    : 'bg-white border border-slate-200';

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatCard icon={Users} label="Total Users" value={stats.total} color="cyan" isDarkMode={isDarkMode} />
        <StatCard icon={UserCheck} label="Active" value={stats.active} color="emerald" isDarkMode={isDarkMode} />
        <StatCard icon={Clock} label="Pending" value={stats.pending} color="amber" isDarkMode={isDarkMode} />
        <StatCard icon={Ban} label="Suspended" value={stats.suspended} color="red" isDarkMode={isDarkMode} />
      </div>

      {/* Main card */}
      <div className={`rounded-2xl overflow-hidden ${card}`}>

        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'
            }`}
        >
          <div>
            <h3 className={`text-lg font-bold tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              User Directory
            </h3>
            <p className="text-xs mt-0.5 text-slate-500">{subtitle}</p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white
              bg-gradient-to-r from-cyan-500 to-blue-500
              hover:from-cyan-400 hover:to-blue-400
              transition-all shadow-md shadow-cyan-500/20 hover:shadow-cyan-400/30 hover:-translate-y-px"
          >
            <Plus size={15} />
            Add User
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pt-5 pb-6">
          <SearchBar
            query={userSearchQuery}
            onQueryChange={setUserSearchQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            isDarkMode={isDarkMode}
          />

          <UserTable
            // ── data ──────────────────────────────────────────────────────
            filteredUsers={filteredUsers}
            totalCount={normalizedSearchQuery ? filteredUsers.length : total}
            isLoading={isLoadingUsers}
            isServer={!normalizedSearchQuery}

            // ── UI ────────────────────────────────────────────────────────
            isDarkMode={isDarkMode}
            onManage={setManageUserId}

            // ── selection ─────────────────────────────────────────────────
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onSelectAll={selectAll}
            onClearSelection={clearSelection}
            onBulkAction={applyBulkAction}
          />
        </div>
      </div>

      {/* Modals */}
      {isAddModalOpen && (
        <AddUserModal
          isDarkMode={isDarkMode}
          newUser={newUser}
          setNewUser={setNewUser}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddSubmit}
        />
      )}

      {manageUserId !== null && managedUser && (
        <ManageUserModal
          user={managedUser}
          isDarkMode={isDarkMode}
          onClose={() => setManageUserId(null)}
          onSave={replaceUser}
          onDelete={deleteUser}
        />
      )}
    </>
  );
};

export default UserManagementSection;