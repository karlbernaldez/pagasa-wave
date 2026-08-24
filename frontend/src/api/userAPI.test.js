import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchUserDetails } from './userAPI';
import { fetchWithAuth } from './auth';

vi.mock('./auth', () => ({
  fetchWithAuth: vi.fn(),
}));

const jsonResponse = (status, body = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  json: vi.fn().mockResolvedValue(body),
});

describe('user API authenticated transport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses the central refresh-aware fetch helper for profile reads', async () => {
    fetchWithAuth.mockResolvedValue(
      jsonResponse(200, {
        _id: 'user-1',
        email: 'old@example.com',
        pendingEmail: 'new@example.com',
      })
    );

    const user = await fetchUserDetails('user-1');

    expect(fetchWithAuth).toHaveBeenCalledWith(
      expect.stringContaining('/api/users/user-1'),
      expect.objectContaining({ method: 'GET' })
    );
    expect(user).toEqual(
      expect.objectContaining({
        id: 'user-1',
        email: 'old@example.com',
        pendingEmail: 'new@example.com',
      })
    );
  });
});
