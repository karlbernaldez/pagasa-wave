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
  } catch {}

  if (!response.ok) {
    throw new Error(data?.message || 'Request failed');
  }

  return data;
};

const append = (p, k, v) => {
  if (v === undefined || v === null || v === '' || v === 'All') return;
  p.set(k, String(v));
};

export const fetchUserProjects = ({
  page = 1,
  limit = 10,
  search = '',
  status = '',
  type = '',
  dateRange = '',
  sortBy = 'updatedAt',
  sortDir = 'desc',
  signal,
} = {}) => {
  const params = new URLSearchParams();
  append(params, 'page', page);
  append(params, 'limit', limit);
  append(params, 'search', search.trim());
  append(params, 'status', status);
  append(params, 'type', type);
  append(params, 'dateRange', dateRange);
  append(params, 'sortBy', sortBy);
  append(params, 'sortDir', sortDir);

  return request(`${PROJECT_API_BASE_URL}?${params}`, { signal });
};