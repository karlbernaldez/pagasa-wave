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
    throw new Error(data?.message || 'Published forecast request failed');
  }

  return data;
};

export const fetchPublishedForecastOutput = (projectId, { signal } = {}) => {
  if (!projectId) {
    return Promise.reject(new Error('Missing projectId when fetching published forecast'));
  }

  return request(`${PROJECT_API_BASE_URL}/${projectId}/published-output`, { signal });
};

export const fetchPublicPublishedForecastOutput = (projectId, { signal } = {}) => {
  if (!projectId) {
    return Promise.reject(new Error('Missing projectId when fetching public published forecast'));
  }

  return request(`${PROJECT_API_BASE_URL}/public/published/${projectId}`, { signal });
};

export const fetchPublicPublishedForecasts = ({ page = 1, limit = 12, search = '', signal } = {}) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (search.trim()) params.set('search', search.trim());

  return request(`${PROJECT_API_BASE_URL}/public/published?${params.toString()}`, { signal });
};
