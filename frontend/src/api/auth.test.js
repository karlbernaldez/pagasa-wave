import { beforeEach, describe, expect, it, vi } from 'vitest';

const jsonResponse = (status, body = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: String(status),
  json: vi.fn().mockResolvedValue(body),
});

const loadAuthApi = async () => {
  vi.resetModules();
  return import('./auth.js');
};

describe('authenticated API retries', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('does not refresh after a 403 authorization denial', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(403, {
        message: 'Access denied.',
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const { fetchWithAuth } = await loadAuthApi();
    const response = await fetchWithAuth('/api/admin-only');

    expect(response.status).toBe(403);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('refreshes once after a 401 and retries the original request', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { message: 'Expired.' }))
      .mockResolvedValueOnce(jsonResponse(200, { message: 'Session refreshed.' }))
      .mockResolvedValueOnce(jsonResponse(200, { data: 'ok' }));
    vi.stubGlobal('fetch', fetchMock);

    const { fetchWithAuth } = await loadAuthApi();
    const response = await fetchWithAuth('/api/projects');

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toContain('/api/auth/refresh-token');
  });

  it('shares one refresh request across concurrent 401 responses', async () => {
    const resourceAttempts = new Map();
    let refreshCalls = 0;

    const fetchMock = vi.fn(async (url) => {
      if (String(url).includes('/api/auth/refresh-token')) {
        refreshCalls += 1;
        await Promise.resolve();
        return jsonResponse(200, { message: 'Session refreshed.' });
      }

      const key = String(url);
      const attempt = (resourceAttempts.get(key) || 0) + 1;
      resourceAttempts.set(key, attempt);
      return attempt === 1
        ? jsonResponse(401, { message: 'Expired.' })
        : jsonResponse(200, { data: key });
    });
    vi.stubGlobal('fetch', fetchMock);

    const { fetchWithAuth } = await loadAuthApi();
    const [first, second] = await Promise.all([
      fetchWithAuth('/api/projects'),
      fetchWithAuth('/api/notifications'),
    ]);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(refreshCalls).toBe(1);
  });

  it('reports auth verification as unavailable instead of logged out on a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    const { checkAuthSession } = await loadAuthApi();
    const result = await checkAuthSession({ force: true });

    expect(result).toEqual({ authenticated: false, user: null, unavailable: true });
  });

  it('reports a temporary auth-service failure as unavailable instead of logged out', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(503, { message: 'Unavailable' })));

    const { checkAuthSession } = await loadAuthApi();
    const result = await checkAuthSession({ force: true });

    expect(result).toEqual({ authenticated: false, user: null, unavailable: true });
  });

  it('still reports a definitively invalid session as logged out', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { message: 'Expired.' }))
      .mockResolvedValueOnce(jsonResponse(401, { message: 'Invalid refresh token.' }));
    vi.stubGlobal('fetch', fetchMock);

    const { checkAuthSession } = await loadAuthApi();
    const result = await checkAuthSession({ force: true });

    expect(result).toEqual({ authenticated: false, user: null, unavailable: false });
  });
});
