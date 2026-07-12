export type PublicChart = {
  _id: string;
  name?: string;
  description?: string;
  publishedAt?: string;
  forecastDate?: string;
  chartType?: string;
  raster?: { tileUrl?: string; imageUrl?: string };
};

export type PublishedChartsResponse = {
  projects?: PublicChart[];
};

const API_URL = process.env.EXPO_PUBLIC_API_URL;

function requireApiUrl() {
  if (!API_URL) throw new Error('EXPO_PUBLIC_API_URL is not configured.');
  return API_URL.replace(/\/$/, '');
}

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response