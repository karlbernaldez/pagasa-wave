import { checkAuthSession } from '@/api/auth';
import { fetchUserDetails } from '@/api/userAPI';

/**
 * Module-level singleton cache for the authenticated user's details.
 *
 * Keeping this outside React means that multiple Header mounts during the
 * same browser session share a single network round-trip, and the data
 * survives fast-refresh cycles during development.
 *
 * Shape: { currentUser: UserDetails | null, isLoggedIn: boolean }
 */
let _cache = null;

/** In-flight promise – prevents duplicate concurrent fetches (request deduplication). */
let _inflightRequest = null;

/**
 * Fetches and caches the authenticated user's profile.
 * Subsequent calls return the cached value immediately.
 *
 * @returns {Promise<{ currentUser: object|null, isLoggedIn: boolean }>}
 */
export async function loadHeaderUser() {
  if (_cache) return _cache;

  // Deduplicate concurrent callers by sharing the same promise.
  if (!_inflightRequest) {
    _inflightRequest = _fetchUser().finally(() => {
      _inflightRequest = null;
    });
  }

  return _inflightRequest;
}

/**
 * Clears the cache – call this on logout so the next page load re-fetches.
 */
export function invalidateHeaderUserCache() {
  _cache            = null;
  _inflightRequest  = null;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function _fetchUser() {
  const { authenticated, user } = await checkAuthSession();

  if (authenticated && user?.id) {
    const userDetails = await fetchUserDetails(user.id);
    _cache = { currentUser: userDetails, isLoggedIn: true };
  } else {
    _cache = { currentUser: null, isLoggedIn: false };
  }

  return _cache;
}