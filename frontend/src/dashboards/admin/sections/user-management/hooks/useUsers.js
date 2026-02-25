import { useEffect, useMemo, useState, useCallback } from 'react';
import { fetchAllUsers } from '@/api/userAPI';
import { defaultNewUser, fullName } from '../utils';
import { STATUS_LABELS } from '../constants';

let adminUsersBootstrapCache = null;
let adminUsersBootstrapPromise = null;

const safeLower = (v) => (v || '').toString().toLowerCase();

const formatDate = (iso) => {
  if (!iso) return 'Never';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? 'Never' : d.toLocaleString();
};

const normalizeUser = (user) => {
  const status = user.status || 'pending';

  return {
    id: user.id ?? user._id ?? crypto.randomUUID(),

    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    email: user.email ?? '',
    contact: user.contact ?? '',
    agency: user.agency ?? '',
    position: user.position ?? '',
    role: user.role ?? 'user',

    status,
    statusLabel: STATUS_LABELS[status] ?? STATUS_LABELS.pending,

    memberSince: user.activatedAt
      ? new Date(user.activatedAt).toISOString().slice(0, 10)
      : '—',

    lastLogin: formatDate(user.lastLogin),
    avatarUrl: user.avatarUrl ?? '',
  };
};

const getBootstrappedAdminUsers = async () => {
  if (adminUsersBootstrapCache) return adminUsersBootstrapCache;

  if (!adminUsersBootstrapPromise) {
    adminUsersBootstrapPromise = fetchAllUsers()
      .then((response) =>
        (Array.isArray(response) ? response : []).map(normalizeUser)
      )
      .then((data) => {
        adminUsersBootstrapCache = data;
        return data;
      })
      .finally(() => {
        adminUsersBootstrapPromise = null;
      });
  }

  return adminUsersBootstrapPromise;
};

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [newUser, setNewUser] = useState(defaultNewUser());

  // ---- LOAD USERS ----
  const loadUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    setUsersError('');

    try {
      const bootstrappedUsers = await getBootstrappedAdminUsers();
      setUsers(bootstrappedUsers);
    } catch (error) {
      setUsersError(error.message || 'Failed to load users from API.');
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // ---- MANUAL REFRESH (clears cache) ----
  const refreshUsers = useCallback(async () => {
    adminUsersBootstrapCache = null;
    adminUsersBootstrapPromise = null;
    await loadUsers();
  }, [loadUsers]);

  // ---- FILTERED USERS ----
  const filteredUsers = useMemo(() => {
    const q = safeLower(query);

    return users.filter((user) => {
      const textMatch =
        safeLower(fullName(user)).includes(q) ||
        safeLower(user.email).includes(q) ||
        safeLower(user.agency).includes(q) ||
        safeLower(user.position).includes(q) ||
        safeLower(user.role).includes(q) ||
        safeLower(user.statusLabel).includes(q);

      const statusMatch =
        statusFilter === 'all' || user.status === statusFilter;

      return textMatch && statusMatch;
    });
  }, [users, query, statusFilter]);

  // ---- LOCAL CREATE (optimistic) ----
  const createUser = () => {
    if (
      !newUser.firstName?.trim() ||
      !newUser.lastName?.trim() ||
      !newUser.email?.trim()
    )
      return false;

    const created = normalizeUser({
      id: Date.now().toString(),
      ...newUser,
      firstName: newUser.firstName.trim(),
      lastName: newUser.lastName.trim(),
      email: newUser.email.trim(),
      status: 'pending',
      lastLogin: null,
      createdAt: new Date().toISOString(),
    });

    setUsers((prev) => [created, ...prev]);
    setNewUser(defaultNewUser());

    return true;
  };

  // ---- LOCAL UPDATE ----
  const updateUser = useCallback((userId, field, value) => {
    setUsers(prev =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        if (field === 'status') {
          return {
            ...u,
            status: value,
            statusLabel: STATUS_LABELS[value] ?? STATUS_LABELS.pending,
          };
        }

        return { ...u, [field]: value };
      })
    );
  }, []);

  const bulkUpdateUsers = useCallback((ids, updater) => {
    if (!ids?.size) return;

    setUsers((prev) => prev
      .map((user) => {
        if (!ids.has(user.id)) return user;
        return updater(user);
      })
      .filter(Boolean));
  }, []);

  const resetNewUser = () => setNewUser(defaultNewUser());

  const deleteUser = useCallback((id) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  }, []);

  const replaceUser = useCallback((updated) => {
    setUsers(prev =>
      prev.map(u => u.id === updated.id ? normalizeUser(updated) : u)
    );
  }, []);

  return {
    users,
    filteredUsers,
    isLoadingUsers,
    usersError,

    query,
    setQuery,

    statusFilter,
    setStatusFilter,

    newUser,
    setNewUser,

    createUser,
    updateUser,
    bulkUpdateUsers,
    resetNewUser,
    deleteUser,
    refreshUsers,
    replaceUser,
  };
}