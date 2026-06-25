import { useCallback, useEffect, useState } from 'react';
import { getSettings } from '@/api/siteSettings';

export const FORECASTER_WORKSPACE_SETTINGS_KEY = 'admin.settings.forecasterWorkspace';
export const OPERATIONS_SETTINGS_KEY = 'admin.settings.operations';
export const SETTINGS_UPDATED_EVENT = 'wavelab:settings-updated';

const DEFAULT_TIMEZONE = 'Asia/Manila';

const DEFAULT_FORECASTER_WORKSPACE_SETTINGS = {
  workspaceWelcomeTitle: 'Daily Forecast Package',
  workspaceWelcomeDescription: 'Prepare the required wave charts, coordinate with active editors, and submit the package for admin review.',
  defaultMapView: 'Philippine Area of Responsibility',
  autosaveIntervalSeconds: 30,
  collaborationPresenceMessage: 'Another forecaster is editing this chart. Coordinate before overwriting shared work.',
  qaChecklistReminder: 'Before submitting, verify chart time labels, layer visibility, annotations, and package metadata.',
  deadlineReminderMessage: 'Complete and submit today\'s forecast package before the operational deadline.',
  deadlineApproachingMessage: 'Submission deadline is approaching. Finish the required charts and submit the package as soon as possible.',
  deadlinePassedMessage: 'The submission deadline has passed. Submit late if possible or coordinate with Admin before the no-publication cutoff.',
  publishTargetMissedMessage: 'The publish target has passed. Submit late if possible and coordinate with Admin so the daily record can be resolved.',
  noPublicationCutoffMessage: 'No-publication cutoff has been reached. Complete the package immediately or coordinate with Admin for an operational exception.',
  revisionInstructionMessage: 'Review admin comments, update affected charts, and resubmit the package for approval.',
  emptyPackageMessage: 'Create today\'s forecast package to generate the four required charts.',
  chartSequenceHelperMessage: 'Follow the production order: Wave Analysis, 24h, 36h, then 48h. Forecasters can co-edit; readiness waits until active editors release.',
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

function hasValues(value) {
  return value && typeof value === 'object' && Object.keys(value).length > 0;
}

function pickForecasterWorkspaceSettings(settings) {
  return Object.keys(DEFAULT_FORECASTER_WORKSPACE_SETTINGS).reduce((acc, key) => {
    acc[key] = settings[key];
    return acc;
  }, {});
}

function readLocalSettings() {
  return {
    ...readJsonSettings(FORECASTER_WORKSPACE_SETTINGS_KEY, DEFAULT_FORECASTER_WORKSPACE_SETTINGS),
    operations: readJsonSettings(OPERATIONS_SETTINGS_KEY, DEFAULT_OPERATIONS_SETTINGS),
  };
}

async function readDatabaseSettings() {
  const [forecasterWorkspace, operations] = await Promise.all([
    getSettings('forecasterWorkspace').catch(() => null),
    getSettings('operations').catch(() => null),
  ]);

  const localSettings = readLocalSettings();
  const nextSettings = {
    ...DEFAULT_FORECASTER_WORKSPACE_SETTINGS,
    ...(hasValues(forecasterWorkspace) ? forecasterWorkspace : localSettings),
    operations: {
      ...DEFAULT_OPERATIONS_SETTINGS,
      ...(hasValues(operations) ? operations : localSettings.operations),
    },
  };

  localStorage.setItem(FORECASTER_WORKSPACE_SETTINGS_KEY, JSON.stringify(pickForecasterWorkspaceSettings(nextSettings)));
  localStorage.setItem(OPERATIONS_SETTINGS_KEY, JSON.stringify(nextSettings.operations));

  return nextSettings;
}

export default function useForecasterWorkspaceSettings() {
  const [settings, setSettings] = useState(() => readLocalSettings());

  const refreshSettings = useCallback(() => {
    setSettings(readLocalSettings());
    readDatabaseSettings()
      .then(setSettings)
      .catch(() => setSettings(readLocalSettings()));
  }, []);

  useEffect(() => {
    const handleStorage = (event) => {
      if ([FORECASTER_WORKSPACE_SETTINGS_KEY, OPERATIONS_SETTINGS_KEY].includes(event.key)) {
        refreshSettings();
      }
    };

    const handleCustomUpdate = (event) => {
      if (!event.detail?.key || [FORECASTER_WORKSPACE_SETTINGS_KEY, OPERATIONS_SETTINGS_KEY, 'operations', 'forecasterWorkspace'].includes(event.detail.key)) {
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
  }, [refreshSettings]);

  return settings;
}
