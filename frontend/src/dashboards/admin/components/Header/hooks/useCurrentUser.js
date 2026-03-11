import { useCallback, useEffect, useMemo, useState } from 'react';

import { getFullName, getUserInitials } from '@dashboards/admin/utils/user';
import { fetchUserDetails             } from '@/api/userAPI';
import { checkAuthSession, logoutUser } from '@/api/auth';

// ─── Module-level request deduplication ──────────────────────────────────────
// Shared across all Header instances so parallel mounts share one network round-trip.

let _userCache   = null;
let _userRequest = null;

const resetUserCache = () => { _userCache = _userRequest = null; };

const loadUser = () => {
  if (_userCache)   return Promise.resolve(_userCache);
  if (_userRequest) return _userRequest;

  _userRequest = (async () => {
    const { authenticated, user } = await checkAuthSession();
    if (!authenticated || !user?.id) return null;
    _userCache = await fetchUserDetails(user.id);
    return _userCache;
  })().finally(() => { _userRequest = null; });

  return _userRequest;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Loads and caches the current authenticated user.
 * @returns {{ user: DerivedUser, logout: () => Promise<void> }}
 */
const useCurrentUser = () => {
  const [rawUser, setRawUser] = useState(null);

  useEffect(() => {
    let active = true;
    loadUser()
      .then((d) => { if (active) setRawUser(d); })
      .catch(console.error);
    return () => { active = false; };
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    resetUserCache();
    setRawUser(null);
  }, []);

  const user = useMemo(() => ({
    initials:  getUserInitials(rawUser?.firstName, rawUser?.lastName, rawUser?.username),
    name:      getFullName(rawUser?.firstName, rawUser?.lastName, rawUser?.username),
    role:      rawUser?.role === 'admin' ? 'Administrator' : 'User',
    email:     rawUser?.email ?? 'Loading…',
    avatarUrl: rawUser?.avatarUrl ?? null,
  }), [rawUser]);

  return { user, logout };
};

export default useCurrentUser;