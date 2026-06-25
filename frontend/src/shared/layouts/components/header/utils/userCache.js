import { checkAuthSession } from '@/api/auth';
import { USER_UPDATED_EVENT, fetchUserDetails } from '@/api/userAPI';

let _cache = null;

/** In-flight promise - prevents duplicate concurrent fetches (request deduplication). */
let _inflightRequest = null;

function primeHeaderUserCache(user) {
  if (!user) return;
  _cache = { currentUser: user, isLoggedIn: true };
  _inflightRequest = null;
}

if (typeof window !== 'undefined') {
  window.addEventListener(USER_UPDATED_EVENT, (event) => {
    primeHeaderUserCache(event.detail?.user);
  });
}

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


export function invalidateHeaderUserCache() {
  _cache            = null;
  _inflightRequest  = null;
}

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
