import { useEffect, useState } from 'react';

const FORECASTER_WORKSPACE_SETTINGS_KEY = 'admin.settings.forecasterWorkspace';

const DEFAULT_FORECASTER_WORKSPACE_SETTINGS = {
  deadlineReminderMessage: 'Complete and submit today\'s forecast package before the operational deadline.',
  revisionInstructionMessage: 'Review admin comments, update affected charts, and resubmit the package for approval.',
};

function readSettings() {
  try {
    const stored = localStorage.getItem(FORECASTER_WORKSPACE_SETTINGS_KEY);
    return stored
      ? { ...DEFAULT_FORECASTER_WORKSPACE_SETTINGS, ...JSON.parse(stored) }
      : DEFAULT_FORECASTER_WORKSPACE_SETTINGS;
  } catch {
    return DEFAULT_FORECASTER_WORKSPACE_SETTINGS;
  }
}

export default function useForecasterWorkspaceSettings() {
  const [settings, setSettings] = useState(DEFAULT_FORECASTER_WORKSPACE_SETTINGS);

  useEffect(() => {
    setSettings(readSettings());

    const handleStorage = (event) => {
      if (event.key === FORECASTER_WORKSPACE_SETTINGS_KEY) {
        setSettings(readSettings());
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return settings;
}
