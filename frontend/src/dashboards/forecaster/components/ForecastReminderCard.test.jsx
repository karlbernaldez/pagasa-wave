import { describe, expect, it } from 'vitest';

import { getReminderState } from './ForecastReminderCard';

describe('ForecastReminderCard settings', () => {
  it('uses configured operations timing and workspace warning copy', () => {
    const state = getReminderState({
      packageData: { status: 'Draft' },
      settings: {
        deadlineApproachingMessage: 'Custom deadline warning.',
        operations: {
          timezone: 'UTC',
          packageSubmissionDeadline: '10:00',
          packagePublishTarget: '12:00',
          noPublicationCutoff: '18:00',
          deadlineWarningMinutes: 60,
        },
      },
      now: new Date('2026-09-28T09:30:00.000Z'),
    });

    expect(state.tone).toBe('warning');
    expect(state.message).toBe('Custom deadline warning.');
  });

  it('uses configured revision instructions independently of schedule timing', () => {
    const state = getReminderState({
      packageData: { status: 'Revision Requested' },
      settings: {
        revisionInstructionMessage: 'Open the requested chart changes and re-certify.',
        operations: {},
      },
      now: new Date('2026-09-28T00:00:00.000Z'),
    });

    expect(state.tone).toBe('revision');
    expect(state.message).toBe('Open the requested chart changes and re-certify.');
  });

  it('uses the configured no-publication cutoff message after cutoff', () => {
    const state = getReminderState({
      packageData: { status: 'Draft' },
      settings: {
        noPublicationCutoffMessage: 'Custom cutoff escalation.',
        operations: {
          timezone: 'UTC',
          packageSubmissionDeadline: '10:00',
          packagePublishTarget: '12:00',
          noPublicationCutoff: '18:00',
          deadlineWarningMinutes: 60,
        },
      },
      now: new Date('2026-09-28T18:30:00.000Z'),
    });

    expect(state.tone).toBe('critical');
    expect(state.message).toBe('Custom cutoff escalation.');
  });
});
