import { describe, expect, it } from 'vitest';

import {
  buildPresetRange,
  initialAnalyticsRange,
  isAnalyticsDataStale,
  toManilaDateKey,
} from './analyticsDateRange';

describe('analyticsDateRange', () => {
  it('builds inclusive preset ranges using the Manila calendar', () => {
    const now = new Date('2026-09-15T07:30:00.000Z'); // 15:30 Asia/Manila

    expect(buildPresetRange(1, now)).toEqual({ start: '2026-09-15', end: '2026-09-15' });
    expect(buildPresetRange(7, now)).toEqual({ start: '2026-09-09', end: '2026-09-15' });
    expect(buildPresetRange(14, now)).toEqual({ start: '2026-09-02', end: '2026-09-15' });
  });

  it('uses the 14-day preset as the initial range', () => {
    const now = new Date('2026-09-15T07:30:00.000Z');

    expect(initialAnalyticsRange(now)).toEqual({
      preset: '14d',
      start: '2026-09-02',
      end: '2026-09-15',
    });
  });

  it('uses Manila date boundaries even when UTC is still on the previous date', () => {
    expect(toManilaDateKey(new Date('2026-09-14T16:30:00.000Z'))).toBe('2026-09-15');
  });

  it('marks loaded analytics stale only after the configured interval', () => {
    const loadedAt = '2026-09-15T07:00:00.000Z';
    const loadedMs = new Date(loadedAt).getTime();

    expect(isAnalyticsDataStale(loadedAt, loadedMs + 4 * 60 * 1000)).toBe(false);
    expect(isAnalyticsDataStale(loadedAt, loadedMs + 6 * 60 * 1000)).toBe(true);
  });
});
