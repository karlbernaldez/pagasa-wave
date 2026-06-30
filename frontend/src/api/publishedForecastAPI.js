const PROJECT_API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/projects`;

const request = async (url, options = {}) => {
  const response = await fetch(url, {
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
    throw new Error(data?.message || 'Published chart request failed');
  }

  return data;
};

export const fetchPublishedChartOutput = (projectId, { signal } = {}) => {
  if (!projectId) {
    return Promise.reject(new Error('Missing projectId when fetching published chart'));
  }

  return request(`${PROJECT_API_BASE_URL}/${projectId}/published-output`, { signal });
};

export const fetchPublicPublishedChartOutput = (projectId, { signal, theme } = {}) => {
  if (!projectId) {
    return Promise.reject(new Error('Missing projectId when fetching public published chart'));
  }

  const params = new URLSearchParams();
  if (theme) params.set('theme', theme);
  const query = params.toString();

  return request(`${PROJECT_API_BASE_URL}/public/published/${projectId}${query ? `?${query}` : ''}`, { signal });
};

export const fetchPublicPublishedCharts = ({ page = 1, limit = 12, search = '', mode = 'active', before = '', after = '', theme = '', signal } = {}) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    mode,
  });

  if (search.trim()) params.set('search', search.trim());
  if (before) params.set('before', before);
  if (after) params.set('after', after);
  if (theme) params.set('theme', theme);

  return request(`${PROJECT_API_BASE_URL}/public/published?${params.toString()}`, { signal });
};

export const fetchPublishedForecastOutput = fetchPublishedChartOutput;
export const fetchPublicPublishedForecastOutput = fetchPublicPublishedChartOutput;
export const fetchPublicPublishedForecasts = fetchPublicPublishedCharts;
