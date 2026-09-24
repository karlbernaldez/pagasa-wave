import { fetchWithAuth } from './auth';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/notifications`;

const apiFetch = async (url, { signal, ...options } = {}) => {
  const res = await fetchWithAuth(url, {
    credentials: 'include',
    signal,
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.message || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }

  return res.json();
};

export const fetchNotifications = ({ limit = 20, skip = 0, signal } = {}) =>
  apiFetch(`${API_BASE_URL}?${new URLSearchParams({ limit, skip })}`, { signal });

export const markOneRead = (notificationId, signal) =>
  apiFetch(`${API_BASE_URL}/${encodeURIComponent(notificationId)}/read`, {
    method: 'PATCH',
    signal,
  });

export const markAllRead = (signal) =>
  apiFetch(`${API_BASE_URL}/read-all`, { method: 'PATCH', signal });
