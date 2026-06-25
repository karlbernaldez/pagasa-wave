import { useEffect, useMemo, useState } from 'react';

const FORECASTER_WORKSPACE_SETTINGS_KEY = 'admin.settings.forecasterWorkspace';
const OPERATIONS_SETTINGS_KEY = 'admin.settings.operations';
const DEFAULT_TIMEZONE = 'Asia/Manila';

const DEFAULT_FORECASTER_WORKSPACE_SETTINGS = {
  deadlineReminderMessage: 'Complete and submit today\'s forecast package before the operational deadline.',
  revisionInstructionMessage: 'Review admin comments, update affected charts, and resubmit the package for approval.',
};

const DEFAULT_OPERATIONS_SETTINGS = {
  packageSubmissionDeadline: '15:00',
  packagePublishTarget: '17:00',
  noPublicationCutoff: '18:00',
  deadlineWarningMinutes: 60,
  timezone: DEFAULT_TIMEZONE,
};

function readJsonSettings(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? { ...fallback, ...JSON.parse(stored) } : fallback;
  } catch {
    return fallback;
  }
}

function parseTimeToMinutes(value) {
  const match = String(value || '').match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

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

function getDeadlineAwareMessage(settings, now) {
  const operations = settings.operations || DEFAULT_OPERATIONS_SETTINGS;
  const nowMinutes = getZonedMinutes(now, operations.timezone || DEFAULT_TIMEZONE);
  const deadlineMinutes = parseTimeToMinutes(operations.packageSubmissionDeadline);
  const publishTargetMinutes = parseTimeToMinutes(operations.packagePublishTarget);
  const noPublicationCutoffMinutes = parseTimeToMinutes(operations.noPublicationCutoff);
  const warningMinutes = Number(operations.deadlineWarningMinutes ?? 60);

  if (nowMinutes === null || deadlineMinutes === null) {
    return settings.deadlineReminderMessage;
  }

  if (noPublicationCutoffMinutes !== null && nowMinutes >= noPublicationCutoffMinutes) {
    return 'NO-PUBLICATION CUTOFF REACHED — Complete the package immediately or coordinate with Admin for an operational exception.';
  }

  if (publishTargetMinutes !== null && nowMinutes >= publishTargetMinutes) {
    return 'PUBLISH TARGET MISSED — Submit late if possible and coordinate with Admin so the daily record can be resolved.';
  }

  if (nowMinutes >= deadlineMinutes) {
    return 'DEADLINE PASSED — Submit late if possible or coordinate with Admin before the no-publication cutoff.';
  }

  if (Number.isFinite(warningMinutes) && nowMinutes >= deadlineMinutes - warningMinutes) {
    return 'DEADLINE APPROACHING — Finish the required charts and submit the package as soon as possible.';
  }

  return settings.deadlineReminderMessage;
}

function readSettings() {
  return {
    ...readJsonSettings(FORECASTER_WORKSPACE_SETTINGS_KEY, DEFAULT_FORECASTER_WORKSPACE_SETTINGS),
    operations: readJsonSettings(OPERATIONS_SETTINGS_KEY, DEFAULT_OPERATIONS_SETTINGS),
  };
}

export default function useForecasterWorkspaceSettings() {
  const [settings, setSettings] = useState(() => readSettings());
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    setSettings(readSettings());

    const handleStorage = (event) => {
      if ([FORECASTER_WORKSPACE_SETTINGS_KEY, OPERATIONS_SETTINGS_KEY].includes(event.key)) {
        setSettings(readSettings());
      }
    };

    const handleFocus = () => {
      setSettings(readSettings());
      setNow(new Date());
    };

    const timer = window.setInterval(() => setNow(new Date()), 30_000);

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return useMemo(() => ({
    ...settings,
    deadlineReminderMessage: getDeadlineAwareMessage(settings, now),
  }), [settings, now]);
}
