import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchDashboardOverview } from './dashboardAPI';
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

describe('dashboardAPI', () => {
  it('loads the single overview endpoint', async () => {
    const payload = { meta: { partial: false }, summaryCards: [] };
    vi.mocked(fetchWithAuth).mockResolvedValue(jsonResponse(payload));

    const result = await fetchDashboardOverview();

    expect(vi.mocked(fetchWithAuth).mock.calls[0][0]).toContain('/api/dashboard/overview');
    expect(result).toEqual(payload);
  });

  it('forwards optional dashboard date bounds', async () => {
    vi.mocked(fetchWithAuth).mockResolvedValue(jsonResponse({}));

    await fetchDashboardOverview({ start: '2026-09-01', end: '2026-09-15' });

    expect(vi.mocked(fetchWithAuth).mock.calls[0][0]).toContain(
      '/api/dashboard/overview?start=2026-09-01&end=2026-09-15'
    );
  });

  it('surfaces server failures without exposing response internals', async () => {
    vi.mocked(fetchWithAuth).mockResolvedValue(
      jsonResponse({ message: 'Dashboard unavailable.' }, { ok: false, status: 503 })
    );

    await expect(fetchDashboardOverview()).rejects.toThrow('Dashboard unavailable.');
  });
});
