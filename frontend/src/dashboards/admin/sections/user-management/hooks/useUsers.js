import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  fetchAllUsers,
  createUserAPI,
  updateUserDetailsAPI,
  updateUserStatusAPI,
  deleteUserAPI,
} from '@/api/userAPI';

import { defaultNewUser } from '../utils';
import { STATUS_LABELS } from '../constants';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (iso) => {
  if (!iso) return 'Never';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? 'Never' : d.toLocaleString();
};

/**
 * Normalises a raw API user object into the shape the UI expects.
 * Works for both the old { _id } and new { id } server shapes.
 */
const normalizeUser = (user) => {
  const _id = (user._id ?? user.id)?.toString();

  if (!_id) {
    console.warn('[useUsers] User missing ID:', user);
  }

  const status = user.status?.toLowerCase?.() ?? 'pending';

  return {
    _id,
    id: _id,

    username: user.username ?? '',
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

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useUsers
 *
 * Fetches a paginated list of users from the server.
 * Pagination state lives in the URL (?page & ?limit) so it survives
 * full page reloads and stays in sync with UserTable automatically.
 *
 * Status is passed in by the section so UI state ownership stays local
 * to User Management and never couples to global header or URL state.
 *
 * NOTE: fetchAllUsers must accept { page, limit, status } and return
 *       { data: User[], total: number } — update your userAPI accordingly.
 */
export function useUsers({ statusFilter = 'all' } = {}) {
  const [params] = useSearchParams();
  const page = params.get('page') ?? 1;
  const limit = params.get('limit') ?? 10;

  // ── Server state ─────────────────────────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState('');

  // ── Add-user form state ───────────────────────────────────────────────────
  const [newUser, setNewUser] = useState(defaultNewUser);

  const lastRequestKeyRef = useRef('');

  // ── Fetch ─────────────────────────────────────────────────────────────────

  /**
   * Core fetch function.
   * Reads pagination from URL so it re-runs whenever the user navigates pages.
   */
  const fetchUsers = useCallback(async ({ force = false } = {}) => {
    const requestKey = `${page}|${limit}|${statusFilter}`;
    if (!force && requestKey === lastRequestKeyRef.current) return;
    lastRequestKeyRef.current = requestKey;
    setIsLoadingUsers(true);
    setUsersError('');

    try {

      const response = await fetchAllUsers({
        page,
        limit,
        // 'all' is a UI-only sentinel — don't send it to the server
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });

      // Support both old (array) and new ({ data, total }) API shapes
      if (Array.isArray(response)) {
        console.warn(
          '[useUsers] fetchAllUsers returned a plain array instead of ' +
          '{ data, total }. Server-side pagination will not work correctly. ' +
          'Please update your API endpoint.'
        );
        const normalized = response.map(normalizeUser);
        setUsers(normalized);
        setTotal(normalized.length);
      } else {
        setUsers((response.data ?? []).map(normalizeUser));
        setTotal(response.total ?? 0);
      }
    } catch (err) {
      console.error('[useUsers] fetchUsers error:', err);
      setUsersError(err.message || 'Failed to load users.');
    } finally {
      setIsLoadingUsers(false);
    }
  }, [page, limit, statusFilter]);

  // Re-fetch whenever page / limit / status changes
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Refresh ───────────────────────────────────────────────────────────────

  /** Forces a re-fetch of the current page. */
  const refreshUsers = useCallback(() => {
    fetchUsers({ force: true });
  }, [fetchUsers]);

  // ── Create ────────────────────────────────────────────────────────────────

  const createUser = useCallback(async (payload) => {
    try {
      const response = await createUserAPI(payload);

      if (!response?.user?._id) {
        throw new Error('Invalid response from server.');
      }

      // Optimistically prepend to current page view
      const created = normalizeUser(response.user);
      setUsers((prev) => [created, ...prev]);
      setTotal((prev) => prev + 1);

      // Full refresh to keep pagination counts correct
      await fetchUsers({ force: true });

      return true;
    } catch (err) {
      console.error('[useUsers] createUser error:', err);
      throw err;
    }
  }, [fetchUsers]);

  // ── Update ────────────────────────────────────────────────────────────────

  /**
   * Applies one or more field updates to a user.
   * - If `updates` contains `status`, the dedicated status endpoint is called first.
   * - Remaining fields are sent to the details endpoint.
   * Both can be called in a single `updateUser` invocation.
   */
  const updateUser = useCallback(async (userId, updates) => {
    try {
      let updated = null;

      if (updates.status) {
        updated = await updateUserStatusAPI(userId, updates.status);
      }

      const detailKeys = Object.keys(updates).filter((k) => k !== 'status');
      if (detailKeys.length > 0) {
        const detailPayload = Object.fromEntries(detailKeys.map((k) => [k, updates[k]]));
        const detailResponse = await updateUserDetailsAPI(userId, detailPayload);
        updated = detailResponse ?? updated;
      }

      if (!updated?._id && !updated?.id) return;

      const normalized = normalizeUser(updated);
      setUsers((prev) => prev.map((u) => (u.id === normalized.id ? normalized : u)));
    } catch (err) {
      console.error('[useUsers] updateUser error:', err);
      throw err;
    }
  }, []);

  /**
   * Replaces a user in local state after an external update (e.g. ManageUserModal).
   * Skips a full refetch for a snappier feel.
   */
  const replaceUser = useCallback((updated) => {
    const normalized = normalizeUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === normalized.id ? normalized : u)));
  }, []);

  // ── Delete ────────────────────────────────────────────────────────────────

  const deleteUser = useCallback(async (id) => {
    try {
      await deleteUserAPI(id);

      // Optimistic local removal
      setUsers((prev) => prev.filter((u) => String(u.id) !== String(id)));
      setTotal((prev) => Math.max(0, prev - 1));

      // Refresh to fix pagination (e.g. last item on page was deleted)
      await fetchUsers({ force: true });
    } catch (err) {
      console.error('[useUsers] deleteUser error:', err);
      throw err;
    }
  }, [fetchUsers]);

  // ── Bulk ──────────────────────────────────────────────────────────────────

  /**
   * Runs a bulk operation against a Set of user ids in parallel.
   *
   * - action === 'delete'   → calls deleteUserAPI for each id
   * - action === Function   → calls the appropriate update API with action(user)
   *
   * Optimistically updates local state first, then does a full refresh.
   * On error it re-fetches from the server to revert any bad optimistic state.
   */
  const bulkUpdateUsers = useCallback(async (ids, action) => {
    if (!ids?.size) return;

    const idArray = [...ids];

    try {
      if (action === 'delete') {
        await Promise.all(idArray.map((id) => deleteUserAPI(id)));

        setUsers((prev) => prev.filter((u) => !ids.has(u.id)));
        setTotal((prev) => Math.max(0, prev - idArray.length));

      } else if (typeof action === 'function') {
        // Fire all API requests in parallel
        await Promise.all(
          idArray.map((id) => {
            const user = users.find((u) => u.id === id);
            if (!user) return Promise.resolve();

            const updated = action(user);
            const onlyStatus =
              updated.status !== user.status &&
              Object.keys(updated).filter((k) => updated[k] !== user[k]).length === 1;

            return onlyStatus
              ? updateUserStatusAPI(id, updated.status)
              : updateUserDetailsAPI(id, updated);
          })
        );

        // Apply optimistic update to local state
        setUsers((prev) =>
          prev.map((u) => {
            if (!ids.has(u.id)) return u;
            return normalizeUser({ ...u, ...action(u) });
          })
        );
      }

      // Sync with server to confirm final state
      await fetchUsers();
    } catch (err) {
      console.error('[useUsers] bulkUpdateUsers error:', err);
      // Revert optimistic changes by re-fetching
      await fetchUsers();
      throw err;
    }
  }, [users, fetchUsers]);

  // ── Computed stats ────────────────────────────────────────────────────────

  /**
   * Per-status counts from the current page.
   *
   * ⚠️  These only reflect users visible on the current page.
   * For accurate global counts add a GET /users/stats endpoint that returns
   * { active, pending, suspended } aggregated across the full collection.
   */
  const stats = useMemo(() => {
    const counts = { total, active: 0, pending: 0, suspended: 0 };
    for (const u of users) {
      if (u.status in counts) counts[u.status]++;
    }
    return counts;
  }, [users, total]);

  const resetNewUser = useCallback(() => setNewUser(defaultNewUser), []);

  // ── Public API ────────────────────────────────────────────────────────────

  return {
    // data
    users,           // current page rows (normalized)
    total,           // total matching documents on the server
    stats,           // { total, active, pending, suspended }
    isLoadingUsers,
    usersError,

    // add-user form
    newUser,
    setNewUser,
    resetNewUser,

    // mutations
    createUser,
    updateUser,
    replaceUser,
    deleteUser,
    bulkUpdateUsers,

    // manual refresh
    refreshUsers,
  };
}