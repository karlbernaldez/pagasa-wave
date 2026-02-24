import { useEffect, useMemo, useState } from 'react';
import { fetchAllUsers } from '@/api/userAPI';
import { INITIAL_USERS } from '../constants';
import { defaultNewUser, fullName } from '../utils';

let adminUsersBootstrapCache = null;
let adminUsersBootstrapPromise = null;

const normalizeUser = (user) => ({
  id: user._id,
  firstName: user.firstName ?? '',
  lastName: user.lastName ?? '',
  email: user.email ?? '',
  contact: user.contact ?? '',
  agency: user.agency ?? '',
  position: user.position ?? '',
  role: user.role ?? 'Forecaster',
  status: user.isApproved ? 'Active' : 'Pending',
  memberSince: user.createdAt ? new Date(user.createdAt).toISOString().slice(0, 10) : '—',
  lastLogin: user.lastLogin ?? 'Never',
  avatarUrl: user.avatarUrl ?? '',
});

const getBootstrappedAdminUsers = async () => {
  if (adminUsersBootstrapCache) return adminUsersBootstrapCache;

  if (!adminUsersBootstrapPromise) {
    adminUsersBootstrapPromise = fetchAllUsers()
      .then((response) => (Array.isArray(response) ? response : []).map(normalizeUser))
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
  const [users, setUsers] = useState(INITIAL_USERS);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [newUser, setNewUser] = useState(defaultNewUser());

  useEffect(() => {
    let isMounted = true;

    const loadUsers = async () => {
      setIsLoadingUsers(true);
      setUsersError('');

      try {
        const bootstrappedUsers = await getBootstrappedAdminUsers();
        if (!isMounted) return;
        setUsers(bootstrappedUsers);
      } catch (error) {
        if (!isMounted) return;
        setUsersError(error.message || 'Failed to load users from API.');
      } finally {
        if (isMounted) setIsLoadingUsers(false);
      }
    };

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  // ── Derived: filtered list ──────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    const q = query.toLowerCase();
    return users.filter((user) => {
      const textMatch =
        fullName(user).toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.agency.toLowerCase().includes(q) ||
        user.position.toLowerCase().includes(q) ||
        user.role.toLowerCase().includes(q) ||
        user.status.toLowerCase().includes(q);
      const statusMatch = statusFilter === 'All' || user.status === statusFilter;
      return textMatch && statusMatch;
    });
  }, [users, query, statusFilter]);

  // ── Mutations ───────────────────────────────────────────────────────────
  const createUser = () => {
    if (!newUser.firstName.trim() || !newUser.lastName.trim() || !newUser.email.trim()) return false;
    setUsers((prev) => [
      {
        id: Date.now(),
        ...newUser,
        firstName: newUser.firstName.trim(),
        lastName: newUser.lastName.trim(),
        email: newUser.email.trim(),
        lastLogin: 'Never',
      },
      ...prev,
    ]);
    setNewUser(defaultNewUser());
    return true;
  };

  const updateUser = (userId, field, value) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, [field]: value } : u))
    );
  };

  const resetNewUser = () => setNewUser(defaultNewUser());

  return {
    users,
    isLoadingUsers,
    usersError,
    filteredUsers,
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    newUser,
    setNewUser,
    createUser,
    updateUser,
    resetNewUser,
  };
}