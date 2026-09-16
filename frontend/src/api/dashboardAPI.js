import { fetchWithAuth } from './auth';

const DASHBOARD_API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/dashboard`;

const buildQuery = (params = {}) => {
  const search = new URLSearchParams();
  if (params.start) search.set('start', params.start);
  if (params.end) search.set('end', params.end);
  const query = search.toString();
  return query ? `?${query}` : '';
};

export const fetchDashboardOverview = async (params = {}) => {
  const response = await fetchWithAuth(`${DASHBOARD_API_BASE_URL}/overview${buildQuery(params)}`, {
    headers: { 'Content-Type': 'application/json' },
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    /* ignore non-json responses */
  }

  if (!response.ok) {
    throw new Error(data?.message || 'Failed to load dashboard overview.');
  }

  return data;
};
