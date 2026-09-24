import { describe, expect, it } from 'vitest';

import {
  buildPackageEvents,
  normalizeManualEvents,
  sortCalendarEvents,
} from './calendarEvents';

describe('operational calendar event derivation', () => {

  it('derives actual package workflow events from persisted timestamps', () => {
    const events = buildPackageEvents([
      {
        id: 'pkg-1',
        dateKey: '2026-09-24',
        title: '24SEP2026',
        status: 'Published',
        chartCount: 4,
        contributorLabel: 'Forecast Team',
        submittedAt: '2026-09-24T01:30:00.000Z',
        reviewStartedAt: '2026-09-24T01:45:00.000Z',
        reviewedAt: '2026-09-24T02:10:00.000Z',
        publishedAt: '2026-09-24T02:30:00.000Z',
      },
    ]);

    expect(events.map((event) => event.id)).toEqual([
      'pkg-1-submitted',
      'pkg-1-review-started',
      'pkg-1-approved',
      'pkg-1-published',
    ]);

    const submitted = events.find((event) => event.id === 'pkg-1-submitted');
    expect(submitted).toMatchObject({
      startsAt: '2026-09-24T01:30:00.000Z',
      timing: 'actual',
      href: '/forecasts/review',
    });

    const published = events.find((event) => event.id === 'pkg-1-published');
    expect(published.href).toBe('/forecasts/pkg-1');
  });

  it('uses reviewedAt for active revision evidence', () => {
    const events = buildPackageEvents([
      {
        id: 'pkg-2',
        dateKey: '2026-09-24',
        title: '24SEP2026',
        status: 'Revision Requested',
        reviewedAt: '2026-09-24T03:00:00.000Z',
        reviewComment: 'Update the 24h chart.',
        chartCount: 4,
      },
    ]);

    const returned = events.find((event) => event.id === 'pkg-2-returned');
    expect(returned).toMatchObject({
      type: 'Returned',
      detail: 'Update the 24h chart.',
      href: '/forecasts/pkg-2',
    });
  });

  it('normalizes shared manual events and preserves scheduling metadata', () => {
    const [event] = normalizeManualEvents([
      {
        id: 'evt-1',
        title: 'CWA coordination',
        startsAt: '2026-09-24T08:00:00.000Z',
        type: 'meeting',
        status: 'scheduled',
        ownerLabel: 'WaveLab Team',
        description: 'Technical coordination.',
        location: 'Google Meet',
      },
    ]);

    expect(event).toMatchObject({
      source: 'manual',
      timing: 'scheduled',
      type: 'Meeting',
      owner: 'WaveLab Team',
      readOnly: false,
    });
    expect(event.date).toBe('2026-09-24');
  });

  it('sorts mixed scheduled and actual events chronologically', () => {
    const sorted = sortCalendarEvents([
      { id: 'b', startsAt: '2026-09-24T10:00:00+08:00', title: 'B' },
      { id: 'a', startsAt: '2026-09-24T06:00:00+08:00', title: 'A' },
    ]);

    expect(sorted.map((event) => event.id)).toEqual(['a', 'b']);
  });
});
