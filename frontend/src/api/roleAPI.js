import { fetchWithAuth } from './auth';

const ROLE_API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/admin/roles`;

const request = async (url, options = {}) => {
  const response = await fetchWithAuth(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    /* ignore non-json responses */
  }

  if (!response.ok) {
    throw new Error(data?.message || 'Request failed');
  }

  return data;
};

export const fetchRoles = () => request(ROLE_API_BASE_URL, { method: 'GET' });
export const fetchPermissionCatalog = () =>
  request(`${ROLE_API_BASE_URL}/catalog`, { method: 'GET' });
export const createRole = (payload) =>
  request(ROLE_API_BASE_URL, { method: 'POST', body: JSON.stringify(payload) });
export const updateRole = (key, payload) =>
  request(`${ROLE_API_BASE_URL}/${encodeURIComponent(key)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
export const deleteRole = (key) =>
  request(`${ROLE_API_BASE_URL}/${encodeURIComponent(key)}`, { method: 'DELETE' });
