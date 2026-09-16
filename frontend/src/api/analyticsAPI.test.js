import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  fetchAnalyticsExport,
  fetchForecastAnalytics,
  fetchSystemAnalytics,
  fetchUserAnalytics,
} from './analyticsAPI';
import { fetchWithAuth } from './auth';

vi.mock('./auth', () => ({
  fetchWithAuth: vi.fn(),
}));

const jsonResponse = (data, { ok = true, status = 200 } = {}) => ({
  ok,
  status,
  json: vi.fn().mockResolvedValue(data),
});

beforeEach(() => {
  vi.mocked(fetchWithAuth).mockReset();
});

describe('analyticsAPI', () => {
  it('adds selected date bounds to subsection requests', async () => {
    vi.mocked(fetchWithAuth).mockResolvedValue(jsonResponse({ total: 1 }));

    await fetchForecastAnalytics({ start: '2026-09-01', end: '2026-09-15' });
    await fetchUserAnalytics({ start: '2026-09-01', end: '2026-09-15' });
    await fetchSystemAnalytics({ start: '2026-09-01', end: '2026-09-15' });

    expect(vi.mocked(fetchWithAuth).mock.calls[0][0]).toContain(
      '/api/analytics/forecast?start=2026-09-01&end=2026-09-15'
    );
    expect(vi.mocked(fetchWithAuth).mock.calls[1][0]).toContain(
      '/api/analytics/users?start=2026-09-01&end=2026-09-15'
    );
    expect(vi.mocked(fetchWithAuth).mock.calls[2][0]).toContain(
      '/api/analytics/system?start=2026-09-01&end=2026-09-15'
    );
  });

  it('downloads subsection exports with the same date bounds and server filename', async () => {
    const blob = new Blob(['metric,value\n']);
    vi.mocked(fetchWithAuth).mockResolvedValue({
      ok: true,
      status: 200,
      blob: vi.fn().mockResolvedValue(blob),
      headers: new Headers({
        'Content-Disposition':
          'attachment; filename="wavelab-system-analytics-2026-09-01-to-2026-09-15.csv"',
      }),
    });

    const result = await fetchAnalyticsExport('system', {
      start: '2026-09-01',
      end: '2026-09-15',
    });

    expect(vi.mocked(fetchWithAuth).mock.calls[0][0]).toContain(
      '/api/analytics/system/export?start=2026-09-01&end=2026-09-15'
    );
    expect(result.blob).toBe(blob);
    expect(result.filename).toBe('wavelab-system-analytics-2026-09-01-to-2026-09-15.csv');
  });

  it('rejects unsupported export subsection names before making a request', async () => {
    await expect(fetchAnalyticsExport('users-private', {})).rejects.toThrow(
      'Unsupported analytics export section.'
    );
    expect(fetchWithAuth).not.toHaveBeenCalled();
  });
});
