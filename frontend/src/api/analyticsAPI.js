import { fetchWithAuth } from './auth';

const ANALYTICS_API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/analytics`;

const buildQuery = (params = {}) => {
  const search = new URLSearchParams();
  if (params.start) search.set('start', params.start);
  if (params.end) search.set('end', params.end);
  const query = search.toString();
  return query ? `?${query}` : '';
};

const parseJsonResponse = async (response) => {
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

const request = async (path, options = {}) => {
  const response = await fetchWithAuth(`${ANALYTICS_API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  return parseJsonResponse(response);
};

const parseFilename = (headerValue, fallback) => {
  const match = String(headerValue || '').match(/filename="?([^";]+)"?/i);
  return match?.[1] || fallback;
};

export const fetchAnalyticsOverview = (params) => request(`/overview${buildQuery(params)}`);
export const fetchForecastAnalytics = (params) => request(`/forecast${buildQuery(params)}`);
export const fetchPublicReachAnalytics = (params) => request(`/public${buildQuery(params)}`);
export const fetchUserAnalytics = (params) => request(`/users${buildQuery(params)}`);
export const fetchSystemAnalytics = (params) => request(`/system${buildQuery(params)}`);

export const fetchAnalyticsExport = async (section, params = {}) => {
  if (!['forecast', 'users', 'system'].includes(section)) {
    throw new Error('Unsupported analytics export section.');
  }

  const response = await fetchWithAuth(
    `${ANALYTICS_API_BASE_URL}/${section}/export${buildQuery(params)}`,
    { method: 'GET' }
  );

  if (!response.ok) {
    let data = null;
    try {
      data = await response.json();
    } catch {
      /* ignore non-json responses */
    }
    throw new Error(data?.message || 'Failed to export analytics.');
  }

  const blob = await response.blob();
  return {
    blob,
    filename: parseFilename(
      response.headers.get('Content-Disposition'),
      `wavelab-${section}-analytics.csv`
    ),
  };
};
