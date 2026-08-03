const FORECAST_PACKAGE_API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/forecast-packages`;

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
    // Some API responses may not include a JSON body.
  }

  if (!response.ok) {
    throw new Error(data?.message || 'Request failed');
  }

  return data;
};

const appendQueryParam = (params, key, value) => {
  if (value === undefined || value === null || value === '' || value === 'All') return;
  params.set(key, String(value));
};

export const fetchCurrentForecastPackage = ({ forecastDate, signal } = {}) => {
  const params = new URLSearchParams();
  if (forecastDate) params.set('forecastDate', forecastDate);
  const query = params.toString();
  const url = query ? `${FORECAST_PACKAGE_API_BASE_URL}/current?${query}` : `${FORECAST_PACKAGE_API_BASE_URL}/current`;
  return request(url, { signal });
};

export const fetchAdminForecastPackages = ({
  page = 1,
  limit = 12,
  status = '',
  signal,
} = {}) => {
  const params = new URLSearchParams();
  appendQueryParam(params, 'page', page);
  appendQueryParam(params, 'limit', limit);
  appendQueryParam(params, 'status', status);

  return request(`${FORECAST_PACKAGE_API_BASE_URL}/admin/packages?${params}`, { signal });
};

export const createForecastPackage = (packageData = {}) =>
  request(FORECAST_PACKAGE_API_BASE_URL, { method: 'POST', body: JSON.stringify(packageData) });

export const fetchForecastPackageById = (id, { signal } = {}) =>
  request(`${FORECAST_PACKAGE_API_BASE_URL}/${id}`, { signal });

export const startForecastPackageReview = (id) =>
  request(`${FORECAST_PACKAGE_API_BASE_URL}/${id}/start-review`, { method: 'PATCH' });

export const requestForecastPackageRevision = (id, comment = '', chartTypes = []) =>
  request(`${FORECAST_PACKAGE_API_BASE_URL}/${id}/request-revision`, {
    method: 'PATCH',
    body: JSON.stringify({ comment, chartTypes }),
  });

export const approveForecastPackage = (id) =>
  request(`${FORECAST_PACKAGE_API_BASE_URL}/${id}/approve`, { method: 'PATCH' });

export const publishForecastPackage = (id) =>
  request(`${FORECAST_PACKAGE_API_BASE_URL}/${id}/publish`, { method: 'PATCH' });

export const fetchForecastPackageChartContextByProject = (projectId, { signal, autoJoin = true } = {}) => {
  const params = new URLSearchParams();
  if (!autoJoin) params.set('autoJoin', 'false');
  const query = params.toString();
  return request(`${FORECAST_PACKAGE_API_BASE_URL}/charts/project/${projectId}/context${query ? `?${query}` : ''}`, { signal });
};

export const claimForecastPackageChartByProject = (projectId) =>
  request(`${FORECAST_PACKAGE_API_BASE_URL}/charts/project/${projectId}/claim`, { method: 'PATCH' });

export const releaseForecastPackageChartByProject = (projectId) =>
  request(`${FORECAST_PACKAGE_API_BASE_URL}/charts/project/${projectId}/release`, { method: 'PATCH' });

export const updateForecastChartCompletion = (id, chartType, isComplete) =>
  request(`${FORECAST_PACKAGE_API_BASE_URL}/${id}/charts/${chartType}/completion`, { method: 'PATCH', body: JSON.stringify({ isComplete }) });

export const updateForecastChartCompletionByProject = (projectId, isComplete) =>
  request(`${FORECAST_PACKAGE_API_BASE_URL}/charts/project/${projectId}/completion`, { method: 'PATCH', body: JSON.stringify({ isComplete }) });

export const submitForecastPackage = (id) =>
  request(`${FORECAST_PACKAGE_API_BASE_URL}/${id}/submit`, { method: 'PATCH' });
