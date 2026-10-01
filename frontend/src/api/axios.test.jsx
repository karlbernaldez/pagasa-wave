import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requestUse: vi.fn(),
  withCsrfHeader: vi.fn(),
}));

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: {
          use: mocks.requestUse,
        },
      },
    })),
  },
}));

vi.mock('./auth', () => ({
  withCsrfHeader: mocks.withCsrfHeader,
}));

describe('shared axios CSRF handling', () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.requestUse.mockReset();
    mocks.withCsrfHeader.mockReset();
  });

  it('attaches CSRF headers to unsafe requests', async () => {
    mocks.withCsrfHeader.mockReturnValue({ 'X-CSRF-Token': 'csrf-token' });

    await import('./axios.jsx');

    const interceptor = mocks.requestUse.mock.calls[0][0];
    const headers = { set: vi.fn() };

    const config = interceptor({ method: 'patch', headers });

    expect(mocks.withCsrfHeader).toHaveBeenCalledWith({}, 'patch');
    expect(headers.set).toHaveBeenCalledWith('X-CSRF-Token', 'csrf-token');
    expect(config.headers).toBe(headers);
  });

  it('leaves safe requests unchanged when no CSRF header is returned', async () => {
    mocks.withCsrfHeader.mockReturnValue({});

    await import('./axios.jsx');

    const interceptor = mocks.requestUse.mock.calls[0][0];
    const headers = { set: vi.fn() };

    const config = interceptor({ method: 'get', headers });

    expect(mocks.withCsrfHeader).toHaveBeenCalledWith({}, 'get');
    expect(headers.set).not.toHaveBeenCalled();
    expect(config.headers).toBe(headers);
  });
});
