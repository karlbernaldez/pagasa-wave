const DEFAULT_TIMEZONE = 'Asia/Manila';

function parseTimeToMinutes(value) {
  const raw = String(value || '').trim();
  const twentyFourHourMatch = raw.match(/^(\d{1,2}):(\d{2})$/);

  if (twentyFourHourMatch) {
    const hours = Number(twentyFourHourMatch[1]);
    const minutes = Number(twentyFourHourMatch[2]);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    return hours * 60 + minutes;
  }

  const twelveHourMatch = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!twelveHourMatch) return null;

  let hours = Number(twelveHourMatch[1]);
  const minutes = Number(twelveHourMatch[2] || 0);
  const period = twelveHourMatch[3].toUpperCase();

  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null;
  if (period === 'AM') hours = hours === 12 ? 0 : hours;
  if (period === 'PM') hours = hours === 12 ? 12 : hours + 12;

  return hours * 60 + minutes;
}

function getZonedMinutes(date, timezone = DEFAULT_TIMEZONE) {
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: timezone || DEFAULT_TIMEZONE,
  }).formatToParts(date);

  const getPart = (type) => parts.find((part) => part.type === type)?.value;
  const hours = Number(getPart('hour'));
  const minutes = Number(getPart('minute'));

  return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : null;
}

function getConfiguredMessage(settings, field, fallback) {
  return String(settings?.[field] || '').trim() || fallback;
}

export function getReminderState({ packageData, settings, now }) {
  if (packageData?.status === 'Revision Requested') {
    return {
      tone: 'revision',
      label: 'Revision required',
      badge: 'Action needed',
      message: getConfiguredMessage(
        settings,
        'revisionInstructionMessage',
        'Review admin comments, update affected charts, and resubmit the package for approval.'
      ),
    };
  }

  const editable =
    !packageData || ['Draft', 'Revision Requested'].includes(packageData.status || 'Draft');
  if (!editable) return null;

  const operations = settings.operations || {};
  const timezone = operations.timezone || DEFAULT_TIMEZONE;
  const nowMinutes = getZonedMinutes(now, timezone);
  const deadlineMinutes = parseTimeToMinutes(operations.packageSubmissionDeadline);
  const publishTargetMinutes = parseTimeToMinutes(operations.packagePublishTarget);
  const noPublicationCutoffMinutes = parseTimeToMinutes(operations.noPublicationCutoff);
  const warningMinutes = Number(operations.deadlineWarningMinutes ?? 60);
  const reminderMessage = getConfiguredMessage(
    settings,
    'deadlineReminderMessage',
    "Complete and submit today's forecast package before the operational deadline."
  );

  if (nowMinutes === null || deadlineMinutes === null) {
    return {
      tone: 'normal',
      label: 'Action reminder',
      badge: 'Priority',
      message: reminderMessage,
    };
  }

  if (noPublicationCutoffMinutes !== null && nowMinutes >= noPublicationCutoffMinutes) {
    return {
      tone: 'critical',
      label: 'No-publication cutoff reached',
      badge: 'Admin action',
      message: getConfiguredMessage(
        settings,
        'noPublicationCutoffMessage',
        'No-publication cutoff has been reached. Complete the package immediately or coordinate with Admin for an operational exception.'
      ),
    };
  }

  if (publishTargetMinutes !== null && nowMinutes >= publishTargetMinutes) {
    return {
      tone: 'critical',
      label: 'Publish target missed',
      badge: 'Escalate',
      message: getConfiguredMessage(
        settings,
        'publishTargetMissedMessage',
        'The publish target has passed. Submit late if possible and coordinate with Admin so the daily record can be resolved.'
      ),
    };
  }

  if (nowMinutes >= deadlineMinutes) {
    return {
      tone: 'overdue',
      label: 'Deadline passed',
      badge: 'Late',
      message: getConfiguredMessage(
        settings,
        'deadlinePassedMessage',
        'The submission deadline has passed. Submit late if possible or coordinate with Admin before the no-publication cutoff.'
      ),
    };
  }

  if (Number.isFinite(warningMinutes) && nowMinutes >= deadlineMinutes - warningMinutes) {
    return {
      tone: 'warning',
      label: 'Deadline approaching',
      badge: 'Due soon',
      message: getConfiguredMessage(
        settings,
        'deadlineApproachingMessage',
        'Submission deadline is approaching. Finish the required charts and submit the package as soon as possible.'
      ),
    };
  }

  return {
    tone: 'normal',
    label: 'Action reminder',
    badge: 'Priority',
    message: reminderMessage,
  };
}
