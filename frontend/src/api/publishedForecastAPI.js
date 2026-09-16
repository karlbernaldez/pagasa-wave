const PROJECT_API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/projects`;
const PUBLIC_VIEWER_TOKEN_KEY = 'wavelab:public-viewer-token';
const PUBLIC_VIEW_MARKER_PREFIX = 'wavelab:published-view';
const PUBLIC_CHART_TIME_ZONE = 'Asia/Manila';
const pendingViewMarkers = new Set();

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

const formatManilaDateKey = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: PUBLIC_CHART_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
};

const getStorage = () => {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
};

const createViewerToken = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const random = Math.random().toString(36).slice(2);
  return `${Date.now().toString(36)}-${random}-${Math.random().toString(36).slice(2)}`;
};

const getOrCreateViewerToken = () => {
  const storage = getStorage();
  if (!storage) return null;
  const existing = storage.getItem(PUBLIC_VIEWER_TOKEN_KEY);
  if (existing) return existing;
  const token = createViewerToken();
  storage.setItem(PUBLIC_VIEWER_TOKEN_KEY, token);
  return token;
};

const isPublishedChartDetailRoute = (projectId) => {
  if (typeof window === 'undefined' || !projectId) return false;
  const normalizedPath = window.location.pathname.replace(/\/+$/, '');
  return normalizedPath === `/charts/${encodeURIComponent(String(projectId))}`;
};

const trackSuccessfulPublicLoad = async (projectId) => {
  if (!isPublishedChartDetailRoute(projectId)) return;

  const storage = getStorage();
  const viewerToken = getOrCreateViewerToken();
  if (!storage || !viewerToken) return;

  const dateKey = formatManilaDateKey();
  const marker = `${PUBLIC_VIEW_MARKER_PREFIX}:${projectId}:${dateKey}`;
  if (storage.getItem(marker) || pendingViewMarkers.has(marker)) return;

  pendingViewMarkers.add(marker);
  try {
    await trackPublicPublishedChartView(projectId, viewerToken);
    storage.setItem(marker, '1');
  } catch {
    // View analytics must never block public chart rendering.
  } finally {
    pendingViewMarkers.delete(marker);
  }
};

export const fetchPublishedChartOutput = (projectId, { signal } = {}) => {
  if (!projectId) {
    return Promise.reject(new Error('Missing projectId when fetching published chart'));
  }

  return request(`${PROJECT_API_BASE_URL}/${projectId}/published-output`, { signal });
};

export const trackPublicPublishedChartView = (projectId, viewerToken, { signal } = {}) => {
  if (!projectId || !viewerToken) {
    return Promise.reject(new Error('Missing published chart view tracking data'));
  }

  return request(`${PROJECT_API_BASE_URL}/public/published/${projectId}/view`, {
    method: 'POST',
    signal,
    body: JSON.stringify({ viewerToken }),
  });
};

export const fetchPublicPublishedChartOutput = async (projectId, { signal, theme } = {}) => {
  if (!projectId) {
    throw new Error('Missing projectId when fetching public published chart');
  }

  const params = new URLSearchParams();
  if (theme) params.set('theme', theme);
  const query = params.toString();
  const data = await request(
    `${PROJECT_API_BASE_URL}/public/published/${projectId}${query ? `?${query}` : ''}`,
    { signal }
  );

  void trackSuccessfulPublicLoad(data?.project?._id || projectId);
  return data;
};

export const fetchPublicPublishedCharts = ({
  page = 1,
  limit = 12,
  search = '',
  mode = 'active',
  before = '',
  after = '',
  theme = '',
  signal,
} = {}) => {
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
