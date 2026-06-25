const TIME_PATTERN = /^(\d{2}):(\d{2})$/;

export function timeToMinutes(value) {
  const match = String(value || '').match(TIME_PATTERN);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return hours * 60 + minutes;
}

export function getOperationsScheduleValidationError(settings = {}) {
  const submissionDeadline = timeToMinutes(settings.packageSubmissionDeadline);
  const publishTarget = timeToMinutes(settings.packagePublishTarget);

  if (submissionDeadline === null || publishTarget === null) return null;

  if (publishTarget <= submissionDeadline) {
    return 'Publish Target must be later than Submission Deadline.';
  }

  return null;
}
