export type PublicChart = {
  _id: string;
  name?: string;
  description?: string;
  publishedAt?: string;
  forecastDate?: string;
  chartType?: string;
  raster?: { tileUrl?: string; imageUrl?: string };
};

export type PublishedChartOutput = {
  raster?: PublicChart['raster'];
  featureCollection?: {
    type?: string;
    features?: unknown[];
  };
};

export type PublishedChartsResponse = {
  projects?: PublicChart[];
  page?: number;
  totalPages?: number;
};

const API_URL = process.env.EXPO_PUBLIC_API_URL;

function requireApiUrl() {
  if (!API_URL) throw new Error('EXPO_PUBLIC_API_URL is not configured.');
  return API_URL.replace(/\/$/, '');
}

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${requireApiUrl()}${path}`, {
    signal,
    headers: { Accept: 'application/json' },
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data && typeof data === 'object' && 'message' in data
      ? String(data.message)
      : `WaveLab request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

export function fetchPublicPublishedCharts({
  page = 1,
  limit = 80,
  mode = 'active',
  theme = 'dark',
  signal,
}: {
  page?: number;
  limit?: number;
  mode?: string;
  theme?: 'light' | 'dark';
  signal?: AbortSignal;
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    mode,
    theme,
  });

  return request<PublishedChartsResponse>(`/api/projects/public/published?${params.toString()}`, signal);
}

export function fetchPublicPublishedChartOutput(
  projectId: string,
  { theme = 'dark', signal }: { theme?: 'light' | 'dark'; signal?: AbortSignal } = {},
) {
  if (!projectId) return Promise.reject(new Error('A published chart ID is required.'));
  const params = new URLSearchParams({ theme });
  return request<PublishedChartOutput>(`/api/projects/public/published/${projectId}?${params.toString()}`, signal);
}