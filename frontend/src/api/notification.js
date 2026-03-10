const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/notifications`;

// ─── Shared fetch helper ──────────────────────────────────────────────────────

/**
 * Thin wrapper around fetch that:
 *  - always sends cookies
 *  - throws a typed Error on non-2xx responses
 *  - supports AbortSignal for cancellation
 */
const apiFetch = async (url, { signal, ...options } = {}) => {
  const res = await fetch(url, {
    credentials: 'include',
    signal,
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err  = new Error(body.message || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }

  return res.json();
};

// ─── API functions ────────────────────────────────────────────────────────────

/**
 * Fetch paginated notifications for the logged-in user.
 * @param {{ limit?: number, skip?: number, signal?: AbortSignal }} options
 */
export const fetchNotifications = ({ limit = 20, skip = 0, signal } = {}) =>
  apiFetch(`${API_BASE_URL}?${new URLSearchParams({ limit, skip })}`, { signal });

/**
 * Mark a single notification as read.
 * @param {string}      notificationId
 * @param {AbortSignal} [signal]
 */
export const markOneRead = (notificationId, signal) =>
  apiFetch(`${API_BASE_URL}/${encodeURIComponent(notificationId)}/read`, {
    method: 'PATCH',
    signal,
  });

/**
 * Mark every notification as read for the logged-in user.
 * @param {AbortSignal} [signal]
 */
export const markAllRead = (signal) =>
  apiFetch(`${API_BASE_URL}/read-all`, { method: 'PATCH', signal });