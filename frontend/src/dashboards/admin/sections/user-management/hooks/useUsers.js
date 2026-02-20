import { useMemo, useState } from 'react';
import { INITIAL_USERS } from '../constants';
import { defaultNewUser, fullName } from '../utils';

// ─── useUsers Hook ──────────────────────────────────────────────────────────

/**
 * Encapsulates all user-list state and mutations.
 * Returns the filtered list plus CRUD-style handlers.
 */
export function useUsers() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [newUser, setNewUser] = useState(defaultNewUser());

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