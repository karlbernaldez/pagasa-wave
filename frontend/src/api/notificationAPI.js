import { fetchWithAuth } from './auth';

const NOTIFICATION_API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/notifications`;

const request = async (url, options = {}) => {
  const response = await fetchWithAuth(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Empty response body
  }

  if (!response.ok) {
    throw new Error(data?.message || 'Notification request failed');
  }

  return data;
};

export const fetchNotifications = ({ limit = 20, skip = 0, signal } = {}) => {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  params.set('skip', String(skip));

  return request(`${NOTIFICATION_API_BASE_URL}?${params}`, { signal });
};

export const markNotificationRead = (id) =>
  request(`${NOTIFICATION_API_BASE_URL}/${id}/read`, {
    method: 'PATCH',
  });

export const markAllNotificationsRead = () =>
  request(`${NOTIFICATION_API_BASE_URL}/read-all`, {
    method: 'PATCH',
  });
