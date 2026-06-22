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

export const fetchCurrentForecastPackage = ({ forecastDate, signal } = {}) => {
  const params = new URLSearchParams();
  if (forecastDate) params.set('forecastDate', forecastDate);
  const query = params.toString();
  const url = query
    ? `${FORECAST_PACKAGE_API_BASE_URL}/current?${query}`
    : `${FORECAST_PACKAGE_API_BASE_URL}/current`;

  return request(url, { signal });
};

export const createForecastPackage = (packageData = {}) =>
  request(FORECAST_PACKAGE_API_BASE_URL, {
    method: 'POST',
    body: JSON.stringify(packageData),
  });

export const fetchForecastPackageById = (id, { signal } = {}) =>
  request(`${FORECAST_PACKAGE_API_BASE_URL}/${id}`, { signal });

export const updateForecastChartCompletion = (id, chartType, isComplete) =>
  request(`${FORECAST_PACKAGE_API_BASE_URL}/${id}/charts/${chartType}/completion`, {
    method: 'PATCH',
    body: JSON.stringify({ isComplete }),
  });

export const submitForecastPackage = (id) =>
  request(`${FORECAST_PACKAGE_API_BASE_URL}/${id}/submit`, {
    method: 'PATCH',
  });
