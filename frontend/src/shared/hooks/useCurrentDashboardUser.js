import { useCallback, useEffect, useMemo, useState } from 'react';

import { checkAuthSession, logoutUser } from '@/api/auth';
import { fetchUserDetails } from '@/api/userAPI';

let userCache = null;
let userRequest = null;

function getInitials(user) {
  const firstName = String(user?.firstName || '').trim();
  const lastName = String(user?.lastName || '').trim();
  const username = String(user?.username || '').trim();
  const email = String(user?.email || '').trim();

  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
  if (firstName) return firstName.slice(0, 2).toUpperCase();
  if (username) return username.slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return 'WL';
}

function getDisplayName(user) {
  const firstName = String(user?.firstName || '').trim();
  const lastName = String(user?.lastName || '').trim();
  const username = String(user?.username || '').trim();
  const email = String(user?.email || '').trim();

  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  return fullName || username || email || 'WaveLab User';
}

function getRoleLabel(role) {
  if (role === 'admin') return 'Administrator';
  if (role === 'forecaster') return 'Forecaster';
  return role ? String(role).replace(/_/g, ' ') : 'User';
}

function normalizeUser(user) {
  if (!user) {
    return {
      raw: null,
      initials: 'WL',
      name: 'Loading…',
      role: 'User',
      email: '',
      avatarUrl: null,
    };
  }

  return {
    raw: user,
    initials: getInitials(user),
    name: getDisplayName(user),
    role: getRoleLabel(user.role),
    email: user.email || '',
    avatarUrl: user.avatarUrl || null,
  };
}

export function resetCurrentDashboardUserCache() {
  userCache = null;
  userRequest = null;
}

async function loadCurrentUser() {
  if (userCache) return userCache;
  if (userRequest) return userRequest;

  userRequest = (async () => {
    const session = await checkAuthSession({ force: true });
    if (!session?.authenticated || !session?.user) return null;

    const sessionUser = session.user;
    const userId = sessionUser.id || sessionUser._id;

    if (!userId) {
      userCache = sessionUser;
      return userCache;
    }

    try {
      const fullUser = await fetchUserDetails(userId);
      userCache = fullUser || sessionUser;
    } catch (error) {
      console.error('[useCurrentDashboardUser] Failed to fetch user details:', error);
      userCache = sessionUser;
    }

    return userCache;
  })().finally(() => {
    userRequest = null;
  });

  return userRequest;
}

export default function useCurrentDashboardUser(fallbackUser = null) {
  const [rawUser, setRawUser] = useState(() => userCache || fallbackUser);

  useEffect(() => {
    let active = true;

    loadCurrentUser()
      .then((user) => {
        if (active) setRawUser(user || fallbackUser || null);
      })
      .catch((error) => {
        console.error('[useCurrentDashboardUser] Failed to load user:', error);
        if (active) setRawUser(fallbackUser || null);
      });

    return () => {
      active = false;
    };
  }, [fallbackUser]);

  const logout = useCallback(async () => {
    resetCurrentDashboardUserCache();
    setRawUser(null);
    await logoutUser();
  }, []);

  const user = useMemo(() => normalizeUser(rawUser), [rawUser]);

  return { user, rawUser, logout };
}
