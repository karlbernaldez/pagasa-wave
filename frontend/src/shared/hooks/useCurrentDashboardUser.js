import { useCallback, useEffect, useMemo, useState } from 'react';

import { checkAuthSession, logoutUser } from '@/api/auth';
import { USER_UPDATED_EVENT, fetchUserDetails } from '@/api/userAPI';

let userCache = null;
let userRequest = null;

function clean(value) {
  return String(value || '').trim();
}

function getInitials(user) {
  const firstName = clean(user?.firstName);
  const lastName = clean(user?.lastName);
  const username = clean(user?.username);
  const email = clean(user?.email);

  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
  if (firstName) return firstName.slice(0, 2).toUpperCase();
  if (username) return username.slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return 'WL';
}

function getFullName(user) {
  return [clean(user?.firstName), clean(user?.lastName)].filter(Boolean).join(' ').trim();
}

function getPrimaryName(user) {
  const fullName = getFullName(user);
  const username = clean(user?.username);
  const email = clean(user?.email);

  return fullName || username || email || 'WaveLab User';
}

function capitalizeDisplayName(value) {
  const name = clean(value);
  if (!name) return name;

  return name.charAt(0).toUpperCase() + name.slice(1);
}

function getSecondaryLabel(user, roleOverride) {
  if (roleOverride) return roleOverride;

  const role = clean(user?.role);
  const position = clean(user?.position);
  const fullName = getFullName(user);

  if (role === 'admin') return 'Administrator';
  if (role === 'forecaster') return 'Forecaster';
  if (position) return position;
  if (fullName) return fullName;
  if (role && role !== 'user') return role.replace(/_/g, ' ');
  return 'User';
}

function normalizeUser(user, options = {}) {
  if (!user) {
    return {
      raw: null,
      initials: 'WL',
      name: 'Loading…',
      role: options.roleOverride || 'User',
      email: '',
      avatarUrl: null,
    };
  }

  return {
    raw: user,
    initials: getInitials(user),
    name: capitalizeDisplayName(getPrimaryName(user)),
    role: getSecondaryLabel(user, options.roleOverride),
    email: user.email || '',
    avatarUrl: user.avatarUrl || null,
  };
}

export function resetCurrentDashboardUserCache() {
  userCache = null;
  userRequest = null;
}

function primeCurrentDashboardUserCache(user) {
  if (!user) return;
  userCache = user;
  userRequest = null;
}

async function loadCurrentUser() {
  if (userCache) return userCache;
  if (userRequest) return userRequest;

  userRequest = (async () => {
    const session = await checkAuthSession({ force: true });
    if (session?.unavailable) {
      throw new Error('Unable to verify the current session.');
    }
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

export default function useCurrentDashboardUser(fallbackUser = null, options = {}) {
  const [rawUser, setRawUser] = useState(() => userCache || fallbackUser);

  useEffect(() => {
    let active = true;

    loadCurrentUser()
      .then((user) => {
        if (active) setRawUser(user || fallbackUser || null);
      })
      .catch((error) => {
        console.error('[useCurrentDashboardUser] Failed to load user:', error);
        if (active && !userCache) setRawUser(fallbackUser || null);
      });

    return () => {
      active = false;
    };
  }, [fallbackUser]);

  useEffect(() => {
    const handleUserUpdate = (event) => {
      const updatedUser = event.detail?.user;
      if (!updatedUser) return;

      primeCurrentDashboardUserCache(updatedUser);
      setRawUser((prev) => ({ ...(prev || {}), ...updatedUser }));
    };

    window.addEventListener(USER_UPDATED_EVENT, handleUserUpdate);
    return () => window.removeEventListener(USER_UPDATED_EVENT, handleUserUpdate);
  }, []);

  const logout = useCallback(async () => {
    resetCurrentDashboardUserCache();
    setRawUser(null);
    await logoutUser();
  }, []);

  const user = useMemo(() => normalizeUser(rawUser, options), [options, rawUser]);

  return { user, rawUser, logout };
}
