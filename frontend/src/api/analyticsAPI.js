import { fetchWithAuth } from './auth';

const ANALYTICS_API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/analytics`;

const request = async (path, options = {}) => {
  const response = await fetchWithAuth(`${ANALYTICS_API_BASE_URL}${path}`, {
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
    throw new Error(data?.message || 'Failed to load analytics.');
  }

  return data;
};

export const fetchForecastAnalytics = () => request('/forecast');
export const fetchUserAnalytics = () => request('/users');
export const fetchSystemAnalytics = () => request('/system');
