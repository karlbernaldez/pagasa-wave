import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Ban, Clock3, Plus, RefreshCw, UserCheck, Users } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import { fetchRoles } from '@/api/roleAPI';

import { ManageUserModal } from './components/ManageUserModal';
import { RolesSection } from './components/RolesSection';
import { SearchBar } from './components/SearchBar';
import { UserTable } from './components/UserTable';
import { useUsers } from './hooks/useUsers';
import { LEGACY_ROLE_OPTIONS, setRoleOptions, STATUS_LABELS } from './constants';

const AddUserModal = lazy(() =>
  import('./components/AddUserModal').then((module) => ({ default: module.AddUserModal }))
);

const cn = (...classes) => classes.filter(Boolean).join(' ');

const STAT_TONES = {
  cyan: {
    light: 'bg-cyan-50/80 text-cyan-700',
    dark: 'bg-cyan-400/10 text-cyan-200',
  },
  emerald: {
    light: 'bg-emerald-50/80 text-emerald-700',
    dark: 'bg-emerald-400/10 text-emerald-200',
  },
  amber: {
    light: 'bg-amber-50/80 text-amber-700',
    dark: 'bg-amber-400/10 text-amber-200',
  },
  red: {
    light: 'bg-red-50/80 text-red-700',
    dark: 'bg-red-400/10 text-red-200',
  },
};

function StatCard({ icon: Icon, label, value, helper, color, isDarkMode }) {
  const tone =
    STAT_TONES[color]?.[isDarkMode ? 'dark' : 'light'] ??
    STAT_TONES.cyan[isDarkMode ? 'dark' : 'light'];

  return (
    <div
      className={cn(
        'rounded-2xl border p-4 shadow-xl backdrop-blur-xl',
        isDarkMode
          ? 'border-white/10 bg-slate-950/50 shadow-black/20'
          : 'border-white/70 bg-white/70 shadow-slate-300/40'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={cn(
              'truncate text-xs font-black uppercase tracking-wide',
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            )}
          >
            {label}
          </p>
          <p
            className={cn(
              'mt-2 text-3xl font-black tabular-nums',
              isDarkMode ? 'text-white' : 'text-slate-950'
            )}
          >
            {value}
          </p>
        </div>
        <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl', tone)}>
          <Icon size={21} />
        </span>
      </div>
      <p
        className={cn(
          'mt-3 text-sm font-semibold',
          isDarkMode ? 'text-slate-400' : 'text-slate-500'
        )}
      >
        {helper}
      </p>
    </div>
  );
}

export default function UserManagementSection({ isDarkMode = true, mode = 'list' }) {
  const [searchParams] = useSearchParams();
  const [userSearchQuery, setUserSearchQuery] = useState(() => searchParams.get('q') ?? '');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleOptions, setRoleOptionsState] = useState(() => [...LEGACY_ROLE_OPTIONS]);
  const [rolesReady, setRolesReady] = useState(false);
  const [rolesError, setRolesError] = useState('');

  const {
    users,
    total,
    isLoadingUsers,
    usersError,
    refreshUsers,
    newUser,
    setNewUser,
    resetNewUser,
    createUser,
    replaceUser,
    deleteUser,
    bulkUpdateUsers,
  } = useUsers({ statusFilter });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [manageUserId, setManageUserId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const normalizedSearchQuery = userSearchQuery.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    if (!normalizedSearchQuery) return users;

    return users.filter((user) => {
      const haystack = [
        user.username,
        user.firstName,
        user.lastName,
        user.email,
        user.contact,
        user.agency,
        user.position,
        user.role,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearchQuery);
    });
  }, [normalizedSearchQuery, users]);

  const managedUser = useMemo(
    () => users.find((user) => user.id === manageUserId) ?? null,
    [manageUserId, users]
  );

  const stats = useMemo(() => {
    const counts = { active: 0, pending: 0, suspended: 0 };

    for (const user of filteredUsers) {
      if (user.status in counts) counts[user.status] += 1;
    }

    return { total, ...counts };
  }, [filteredUsers, total]);

  useEffect(() => {
    if (mode !== 'list') return undefined;

    let cancelled = false;
    setRolesReady(false);

    const loadRoleOptions = async () => {
      try {
        const response = await fetchRoles();
        if (cancelled) return;
        const nextOptions = setRoleOptions(response?.roles ?? []);
        setRoleOptionsState([...nextOptions]);
        setRolesError('');
      } catch (error) {
        if (cancelled) return;
        console.error('[UserManagement] Failed to load dynamic user types:', error);
        const fallbackOptions = setRoleOptions([]);
        setRoleOptionsState([...fallbackOptions]);
        setRolesError(
          'Dynamic user types could not be loaded. Admin, Forecaster, and User remain available.'
        );
      } finally {
        if (!cancelled) setRolesReady(true);
      }
    };

    void loadRoleOptions();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const handleAddSubmit = async (payload) => {
    const ok = await createUser(payload);
    if (ok) {
      setIsAddModalOpen(false);
      resetNewUser?.();
    }
  };

  const toggleSelect = useCallback((id) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);
  const selectAll = useCallback((ids) => setSelectedIds(new Set(ids)), []);

  const applyBulkAction = useCallback(
    (action, payload) => {
      switch (action) {
        case 'delete':
          bulkUpdateUsers(selectedIds, 'delete');
          break;
        case 'activate':
          bulkUpdateUsers(selectedIds, (user) => ({
            ...user,
            status: 'active',
            statusLabel: STATUS_LABELS.active,
          }));
          break;
        case 'suspend':
          bulkUpdateUsers(selectedIds, (user) => ({
            ...user,
            status: 'suspended',
            statusLabel: STATUS_LABELS.suspended,
          }));
          break;
        case 'role':
          bulkUpdateUsers(selectedIds, (user) => ({ ...user, role: payload }));
          break;
        default:
          break;
      }
      clearSelection();
    },
    [bulkUpdateUsers, clearSelection, selectedIds]
  );

  if (mode === 'roles') return <RolesSection isDarkMode={isDarkMode} />;

  const hasFilter = Boolean(userSearchQuery.trim()) || statusFilter !== 'all';
  const resultText = isLoadingUsers
    ? 'Loading user directory'
    : hasFilter
      ? `${filteredUsers.length} result${filteredUsers.length === 1 ? '' : 's'} on this page`
      : `${total} user${total === 1 ? '' : 's'} registered`;

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 p-4 sm:p-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
            User directory
          </p>
          <p
            className={cn(
              'mt-1 text-xs font-semibold',
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            )}
          >
            {resultText}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={refreshUsers}
            disabled={isLoadingUsers}
            className={cn(
              'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-black shadow-sm backdrop-blur-xl transition-colors disabled:cursor-not-allowed disabled:opacity-60',
              isDarkMode
                ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white'
                : 'border-white/80 bg-white/70 text-slate-600 hover:bg-white hover:text-slate-950'
            )}
          >
            <RefreshCw size={15} className={isLoadingUsers ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            disabled={!rolesReady}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-cyan-600/20 transition-colors hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus size={15} />
            Add User
          </button>
        </div>
      </section>

      {(usersError || rolesError) && (
        <section
          className={cn(
            'rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm backdrop-blur-xl',
            isDarkMode
              ? 'border-amber-300/20 bg-amber-400/10 text-amber-200'
              : 'border-amber-200 bg-amber-50/80 text-amber-800'
          )}
        >
          {usersError || rolesError}
        </section>
      )}

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats.total}
          helper="Registered accounts"
          color="cyan"
          isDarkMode={isDarkMode}
        />
        <StatCard
          icon={UserCheck}
          label="Active"
          value={stats.active}
          helper="Can access tools"
          color="emerald"
          isDarkMode={isDarkMode}
        />
        <StatCard
          icon={Clock3}
          label="Pending"
          value={stats.pending}
          helper="Needs admin review"
          color="amber"
          isDarkMode={isDarkMode}
        />
        <StatCard
          icon={Ban}
          label="Suspended"
          value={stats.suspended}
          helper="Access restricted"
          color="red"
          isDarkMode={isDarkMode}
        />
      </section>

      <section
        className={cn(
          'overflow-hidden rounded-2xl border shadow-xl backdrop-blur-xl',
          isDarkMode
            ? 'border-white/10 bg-slate-950/50 shadow-black/20'
            : 'border-white/70 bg-white/70 shadow-slate-300/40'
        )}
      >
        <div
          className={cn(
            'border-b px-4 py-4 sm:px-5',
            isDarkMode ? 'border-white/10' : 'border-white/70'
          )}
        >
          <SearchBar
            query={userSearchQuery}
            onQueryChange={setUserSearchQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            isDarkMode={isDarkMode}
          />
        </div>

        <div className="px-4 py-4 sm:px-5">
          <UserTable
            filteredUsers={filteredUsers}
            totalCount={normalizedSearchQuery ? filteredUsers.length : total}
            isLoading={isLoadingUsers}
            isServer={!normalizedSearchQuery}
            isDarkMode={isDarkMode}
            onManage={setManageUserId}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onSelectAll={selectAll}
            onClearSelection={clearSelection}
            onBulkAction={applyBulkAction}
          />
        </div>
      </section>

      {isAddModalOpen && rolesReady && (
        <Suspense fallback={null}>
          <AddUserModal
            isDarkMode={isDarkMode}
            newUser={newUser}
            setNewUser={setNewUser}
            onClose={() => setIsAddModalOpen(false)}
            onSubmit={handleAddSubmit}
          />
        </Suspense>
      )}

      {manageUserId !== null && managedUser && (
        <ManageUserModal
          user={managedUser}
          roleOptions={roleOptions}
          isDarkMode={isDarkMode}
          onClose={() => setManageUserId(null)}
          onSave={replaceUser}
          onDelete={deleteUser}
        />
      )}
    </div>
  );
}
