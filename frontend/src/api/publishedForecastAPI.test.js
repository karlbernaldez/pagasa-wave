import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  fetchPublicPublishedChartOutput,
  fetchPublicPublishedCharts,
} from './publishedForecastAPI';

const PROJECT_ID = '507f1f77bcf86cd799439011';

const okJson = (data) =>
  Promise.resolve({
    ok: true,
    json: async () => data,
    headers: new Headers(),
  });

describe('published forecast public view tracking', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, '', '/charts');
    vi.restoreAllMocks();
  });

  it('records at most one view when the chart detail reloads for a theme change', async () => {
    window.history.replaceState({}, '', `/charts/${PROJECT_ID}`);
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation((url, options = {}) => {
      if (String(url).endsWith(`/public/published/${PROJECT_ID}/view`)) {
        expect(options.method).toBe('POST');
        return okJson({ counted: true, dateKey: '2026-09-16' });
      }
      if (String(url).includes(`/public/published/${PROJECT_ID}`)) {
        return okJson({ project: { _id: PROJECT_ID, status: 'Published' } });
      }
      throw new Error(`Unexpected request: ${url}`);
    });

    await fetchPublicPublishedChartOutput(PROJECT_ID, { theme: 'light' });
    await vi.waitFor(() => {
      const posts = fetchMock.mock.calls.filter(([, options]) => options?.method === 'POST');
      expect(posts).toHaveLength(1);
    });

    await fetchPublicPublishedChartOutput(PROJECT_ID, { theme: 'dark' });
    await new Promise((resolve) => setTimeout(resolve, 0));

    const posts = fetchMock.mock.calls.filter(([, options]) => options?.method === 'POST');
    const gets = fetchMock.mock.calls.filter(([, options]) => options?.method !== 'POST');
    expect(gets).toHaveLength(2);
    expect(posts).toHaveLength(1);
  });

  it('does not record chart views from the public chart listing or preview context', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      if (String(url).includes('/public/published?')) {
        return okJson({ projects: [], total: 0, page: 1, limit: 12 });
      }
      if (String(url).includes(`/public/published/${PROJECT_ID}`)) {
        return okJson({ project: { _id: PROJECT_ID, status: 'Published' } });
      }
      throw new Error(`Unexpected request: ${url}`);
    });

    await fetchPublicPublishedCharts();
    await fetchPublicPublishedChartOutput(PROJECT_ID, { theme: 'light' });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(fetchMock.mock.calls.some(([, options]) => options?.method === 'POST')).toBe(false);
  });
});
