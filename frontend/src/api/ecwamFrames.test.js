import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import api from './axios';
import { ensureEcwamFrameReady } from './ecwamFrames';

const ready = (forecastHour = 4) => ({
  state: 'ready',
  packageDate: '2026-09-01',
  forecastHour,
});

const available = (forecastHour = 4) => ({
  state: 'available',
  packageDate: '2026-09-01',
  forecastHour,
});

describe('ensureEcwamFrameReady', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('returns immediately when the requested frame is already cached', async () => {
    api.get.mockResolvedValueOnce({ data: ready(4) });

    await expect(ensureEcwamFrameReady('2026-09-01', 4)).resolves.toMatchObject({
      state: 'ready',
      forecastHour: 4,
    });
    expect(api.post).not.toHaveBeenCalled();
  });

  it('builds an available frame and polls until it becomes ready', async () => {
    api.get
      .mockResolvedValueOnce({ data: available(25) })
      .mockResolvedValueOnce({ data: ready(25) });
    api.post.mockResolvedValueOnce({
      data: { state: 'building', packageDate: '2026-09-01', forecastHour: 25 },
    });

    await expect(
      ensureEcwamFrameReady('2026-09-01', 25, { pollIntervalMs: 0, timeoutMs: 1000 })
    ).resolves.toMatchObject({ state: 'ready', forecastHour: 25 });

    expect(api.post).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it('does not build when package metadata is unavailable', async () => {
    api.get.mockResolvedValueOnce({
      data: { state: 'unavailable', message: 'ECWAM package metadata is not available yet.' },
    });

    await expect(ensureEcwamFrameReady('2026-09-01', 48)).resolves.toMatchObject({
      state: 'unavailable',
    });
    expect(api.post).not.toHaveBeenCalled();
  });

  it('surfaces backend rate limiting instead of continuing to poll', async () => {
    api.get.mockResolvedValueOnce({ data: available(23) });
    api.post.mockResolvedValueOnce({
      data: { state: 'rate_limited', message: 'Too many ECWAM frame build requests.' },
    });

    await expect(ensureEcwamFrameReady('2026-09-01', 23)).resolves.toMatchObject({
      state: 'rate_limited',
    });
    expect(api.post).toHaveBeenCalledTimes(1);
  });

  it('waits before retrying a build that was rejected as busy', async () => {
    vi.useFakeTimers();

    api.get
      .mockResolvedValueOnce({ data: available(24) })
      .mockResolvedValueOnce({ data: available(24) })
      .mockResolvedValueOnce({ data: available(24) })
      .mockResolvedValueOnce({ data: available(24) })
      .mockResolvedValueOnce({ data: available(24) })
      .mockResolvedValueOnce({ data: ready(24) });
    api.post
      .mockResolvedValueOnce({
        data: { state: 'busy', message: 'Another ECWAM frame is currently being generated.' },
      })
      .mockResolvedValueOnce({
        data: { state: 'building', packageDate: '2026-09-01', forecastHour: 24 },
      });

    const resultPromise = ensureEcwamFrameReady('2026-09-01', 24, {
      pollIntervalMs: 1500,
      timeoutMs: 20000,
    });

    await vi.advanceTimersByTimeAsync(4500);
    expect(api.post).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1500);
    expect(api.post).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(1500);
    await expect(resultPromise).resolves.toMatchObject({ state: 'ready', forecastHour: 24 });
  });
});
