import { useEffect, useState } from 'react';

const FORECASTER_WORKSPACE_SETTINGS_KEY = 'admin.settings.forecasterWorkspace';
const OPERATIONS_SETTINGS_KEY = 'admin.settings.operations';

const DEFAULT_FORECASTER_WORKSPACE_SETTINGS = {
  deadlineReminderMessage: 'Complete and submit today\'s forecast package before the operational deadline.',
  revisionInstructionMessage: 'Review admin comments, update affected charts, and resubmit the package for approval.',
};

const DEFAULT_OPERATIONS_SETTINGS = {
  packageSubmissionDeadline: '15:00',
  packagePublishTarget: '17:00',
  noPublicationCutoff: '18:00',
  deadlineWarningMinutes: 60,
  timezone: 'Asia/Manila',
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
    setSettings(readSettings());

    const handleStorage = (event) => {
      if ([FORECASTER_WORKSPACE_SETTINGS_KEY, OPERATIONS_SETTINGS_KEY].includes(event.key)) {
        setSettings(readSettings());
      }
    };

    const handleFocus = () => setSettings(readSettings());

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return settings;
}
