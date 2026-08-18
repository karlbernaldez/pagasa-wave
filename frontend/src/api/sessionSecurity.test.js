import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchWithAuth } from './auth';
import { logoutAllDevices } from './sessionSecurity';

vi.mock('./auth', () => ({
  fetchWithAuth: vi.fn(),
}));

const jsonResponse = (status, body = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  json: vi.fn().mockResolvedValue(body),
});

describe('sessionSecurity API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('uses the refresh-aware authenticated transport for logout-all', async () => {
    localStorage.setItem('authToken', 'legacy-token');
    localStorage.setItem('user', JSON.stringify({ id: 'user-1' }));
    fetchWithAuth.mockResolvedValue(
      jsonResponse(200, { message: 'Logged out from all devices.' })
    );

    const result = await logoutAllDevices();

    expect(fetchWithAuth).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/logout-all'),
      {
        method: 'POST',
      }
    );
    expect(result).toEqual({ message: 'Logged out from all devices.' });
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('preserves server failure messages and does not clear legacy storage on failure', async () => {
    localStorage.setItem('authToken', 'legacy-token');
    localStorage.setItem('user', JSON.stringify({ id: 'user-1' }));
    fetchWithAuth.mockResolvedValue(
      jsonResponse(503, { message: 'Unable to revoke sessions.' })
    );

    await expect(logoutAllDevices()).rejects.toThrow('Unable to revoke sessions.');

    expect(localStorage.getItem('authToken')).toBe('legacy-token');
    expect(localStorage.getItem('user')).not.toBeNull();
  });
});
