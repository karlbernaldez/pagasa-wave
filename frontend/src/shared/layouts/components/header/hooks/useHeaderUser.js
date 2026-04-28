import { useState, useEffect } from 'react';
import { loadHeaderUser, invalidateHeaderUserCache } from '../utils/userCache';

/**
 * Loads the authenticated user's profile from the module-level cache.
 *
 * Returns a stable object so consumers can destructure safely:
 *   const { currentUser, isLoggedIn, isLoading } = useHeaderUser();
 */
export function useHeaderUser() {
  const [state, setState] = useState({
    currentUser: null,
    isLoggedIn:  false,
    isLoading:   true,
  });

  useEffect(() => {
    let cancelled = false;
    
    invalidateHeaderUserCache(); // Clear cache on mount to ensure fresh data (e.g., after logout).

    loadHeaderUser()
      .then(({ currentUser, isLoggedIn }) => {
        if (!cancelled) setState({ currentUser, isLoggedIn, isLoading: false });
      })
      .catch(() => {
        if (!cancelled) setState({ currentUser: null, isLoggedIn: false, isLoading: false });
      });

    return () => { cancelled = true; };
  }, []);

  return state;
}