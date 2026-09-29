import { describe, expect, it } from 'vitest';

import {
  getOperationsScheduleValidationError,
  timeToMinutes,
} from './operationsScheduleValidation';

describe('operations schedule validation', () => {
  it('parses valid HH:mm values', () => {
    expect(timeToMinutes('00:00')).toBe(0);
    expect(timeToMinutes('23:59')).toBe(1439);
  });

  it('accepts an ordered submission, publication, and cutoff schedule', () => {
    expect(
      getOperationsScheduleValidationError({
        packageSubmissionDeadline: '10:00',
        packagePublishTarget: '12:00',
        noPublicationCutoff: '18:00',
      })
    ).toBeNull();
  });

  it('rejects publication before submission', () => {
    expect(
      getOperationsScheduleValidationError({
        packageSubmissionDeadline: '12:00',
        packagePublishTarget: '11:00',
        noPublicationCutoff: '18:00',
      })
    ).toMatch(/Publish Target must be later/);
  });

  it('rejects cutoff before publication', () => {
    expect(
      getOperationsScheduleValidationError({
        packageSubmissionDeadline: '10:00',
        packagePublishTarget: '18:00',
        noPublicationCutoff: '17:00',
      })
    ).toMatch(/No-Publication Cutoff must be later/);
  });

  it('rejects invalid time formats', () => {
    expect(
      getOperationsScheduleValidationError({
        packageSubmissionDeadline: '10 AM',
        packagePublishTarget: '12:00',
        noPublicationCutoff: '18:00',
      })
    ).toMatch(/24-hour HH:mm/);
  });
});
