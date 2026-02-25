import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Users, UserCheck, Clock, Ban } from 'lucide-react';

import { useUsers } from './hooks/useUsers';
import { SearchBar } from './components/SearchBar';
import { UserTable } from './components/UserTable';
import { AddUserModal } from './components/AddUserModal';
import { ManageUserModal } from './components/ManageUserModal';
import { RolesSection } from './components/RolesSection';
import { STATUS_LABELS } from './constants';

function StatCard({ icon: Icon, label, value, color, isDarkMode }) {

  const colorMap = {
    cyan: { icon: isDarkMode ? 'text-cyan-400' : 'text-cyan-600', bg: isDarkMode ? 'bg-cyan-400/10 border-cyan-400/20' : 'bg-cyan-50 border-cyan-100' },
    emerald: { icon: isDarkMode ? 'text-emerald-400' : 'text-emerald-600', bg: isDarkMode ? 'bg-emerald-400/10 border-emerald-400/20' : 'bg-emerald-50 border-emerald-100' },
    amber: { icon: isDarkMode ? 'text-amber-400' : 'text-amber-600', bg: isDarkMode ? 'bg-amber-400/10 border-amber-400/20' : 'bg-amber-50 border-amber-100' },
    red: { icon: isDarkMode ? 'text-red-400' : 'text-red-600', bg: isDarkMode ? 'bg-red-400/10 border-red-400/20' : 'bg-red-50 border-red-100' },
  };
  const c = colorMap[color];

  return (
    <div className={`rounded-xl border p-4 flex items-center gap-3 ${isDarkMode ? 'bg-slate-900/60 border-slate-700/60' : 'bg-white border-slate-200'}`}>
      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${c.bg}`}>
        <Icon size={16} className={c.icon} />
      </div>
      <div>
        <p className={`text-xl font-bold leading-none ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{value}</p>
        <p className="text-xs mt-0.5 text-slate-500">{label}</p>
      </div>
    </div>
  );
}

const UserManagementSection = ({ isDarkMode = true, mode = 'list' }) => {

  const {
    users,
    filteredUsers,
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    newUser,
    setNewUser,
    createUser,
    bulkUpdateUsers,
    resetNewUser,
    replaceUser,
  } = useUsers();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [manageUserId, setManageUserId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const managedUser = useMemo(
    () => users.find(u => u.id === manageUserId) ?? null,
    [users, manageUserId]
  );

  // ✅ FIXED STATS (lowercase)
  const stats = useMemo(() => {
    const result = {
      total: users.length,
      active: 0,
      pending: 0,
      suspended: 0
    };

    for (const u of users) {
      if (result[u.status] !== undefined) result[u.status]++;
    }

    return result;
  }, [users]);

  const handleAddSubmit = async () => {
    const ok = await createUser();
    if (ok) {
      setIsAddModalOpen(false);
      resetNewUser();
    }
  };

  const handleCloseAdd = () => {
    setIsAddModalOpen(false);
  };

  const toggleSelect = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);
  const selectAll = useCallback((ids) => setSelectedIds(new Set(ids)), []);

  // ✅ FIXED BULK ACTIONS (lowercase)
  const applyBulkAction = useCallback((action, payload) => {
    switch (action) {
      case 'delete':
        bulkUpdateUsers(selectedIds, 'delete');
        break;
      case 'activate':
        bulkUpdateUsers(selectedIds, (user) => ({ ...user, status: 'active', statusLabel: STATUS_LABELS.active }));
        break;
      case 'suspend':
        bulkUpdateUsers(selectedIds, (user) => ({ ...user, status: 'suspended', statusLabel: STATUS_LABELS.suspended }));
        break;
      case 'role':
        bulkUpdateUsers(selectedIds, (user) => ({ ...user, role: payload }));
        break;
      default:
        break;
    }

    clearSelection();

  }, [bulkUpdateUsers, clearSelection, selectedIds]);

  if (mode === 'roles') {
    return <RolesSection isDarkMode={isDarkMode} />;
  }

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

      {/* Main */}
      <div className={`rounded-2xl overflow-hidden ${card}`}>
        <div className={`px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <div>
            <h3 className={`text-lg font-bold tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              User Directory
            </h3>
            <p className="text-xs mt-0.5 text-slate-500">
              {filteredUsers.length === users.length
                ? `${users.length} users registered`
                : `Showing ${filteredUsers.length} of ${users.length} users`}
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 transition-all shadow-md shadow-cyan-500/20 hover:shadow-cyan-400/30 hover:-translate-y-px"
          >
            <Plus size={15} />
            Add User
          </button>
        </div>

        <div className="px-6 pt-5 pb-6">
          <SearchBar
            query={query}
            onQueryChange={setQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            isDarkMode={isDarkMode}
          />

          <UserTable
            filteredUsers={filteredUsers}
            isDarkMode={isDarkMode}
            onManage={setManageUserId}

            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onSelectAll={selectAll}
            onClearSelection={clearSelection}
            onBulkAction={applyBulkAction}
          />
        </div>
      </div>

      {isAddModalOpen && (
        <AddUserModal
          isDarkMode={isDarkMode}
          newUser={newUser}
          setNewUser={setNewUser}
          onClose={handleCloseAdd}
          onSubmit={handleAddSubmit}
        />
      )}

      {manageUserId !== null && managedUser && (
        <ManageUserModal
          user={managedUser}
          isDarkMode={isDarkMode}
          onClose={() => setManageUserId(null)}
          onSave={replaceUser}
        />
      )}
    </>
  );
};

export default UserManagementSection;