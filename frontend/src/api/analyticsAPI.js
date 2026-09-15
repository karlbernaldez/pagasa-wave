import { fetchWithAuth } from './auth';

const ANALYTICS_API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/analytics`;

const buildQuery = (params = {}) => {
  const search = new URLSearchParams();
  if (params.start) search.set('start', params.start);
  if (params.end) search.set('end', params.end);
  const query = search.toString();
  return query ? `?${query}` : '';
};

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

export const fetchForecastAnalytics = (params) => request(`/forecast${buildQuery(params)}`);
export const fetchUserAnalytics = (params) => request(`/users${buildQuery(params)}`);
export const fetchSystemAnalytics = (params) => request(`/system${buildQuery(params)}`);
