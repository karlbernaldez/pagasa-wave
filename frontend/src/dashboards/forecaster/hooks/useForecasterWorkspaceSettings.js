import { useEffect, useState } from 'react';

export const FORECASTER_WORKSPACE_SETTINGS_KEY = 'admin.settings.forecasterWorkspace';
export const OPERATIONS_SETTINGS_KEY = 'admin.settings.operations';
export const SETTINGS_UPDATED_EVENT = 'wavelab:settings-updated';

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

function readSettings() {
  return {
    ...readJsonSettings(FORECASTER_WORKSPACE_SETTINGS_KEY, DEFAULT_FORECASTER_WORKSPACE_SETTINGS),
    operations: readJsonSettings(OPERATIONS_SETTINGS_KEY, DEFAULT_OPERATIONS_SETTINGS),
  };
}

export default function useForecasterWorkspaceSettings() {
  const [settings, setSettings] = useState(() => readSettings());

  useEffect(() => {
    const refreshSettings = () => setSettings(readSettings());

    const handleStorage = (event) => {
      if ([FORECASTER_WORKSPACE_SETTINGS_KEY, OPERATIONS_SETTINGS_KEY].includes(event.key)) {
        refreshSettings();
      }
    };

    const handleCustomUpdate = (event) => {
      if (!event.detail?.key || [FORECASTER_WORKSPACE_SETTINGS_KEY, OPERATIONS_SETTINGS_KEY].includes(event.detail.key)) {
        refreshSettings();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) refreshSettings();
    };

    refreshSettings();
    window.addEventListener('storage', handleStorage);
    window.addEventListener(SETTINGS_UPDATED_EVENT, handleCustomUpdate);
    window.addEventListener('focus', refreshSettings);
    window.addEventListener('pageshow', refreshSettings);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(SETTINGS_UPDATED_EVENT, handleCustomUpdate);
      window.removeEventListener('focus', refreshSettings);
      window.removeEventListener('pageshow', refreshSettings);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return settings;
}
