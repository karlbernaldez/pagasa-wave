import { useState, useEffect, useCallback } from 'react';
import { getSettings, saveSettings } from '@/api/siteSettings';
import {
  DEFAULT_ADMIN_REVIEW,
  DEFAULT_ABOUT,
  DEFAULT_CONTACT,
  DEFAULT_FORECASTER_WORKSPACE,
  DEFAULT_GENERAL,
  DEFAULT_MAP_VIEW,
  DEFAULT_OPERATIONS,
} from '../constants/defaults';
import { getOperationsScheduleValidationError } from '../utils/operationsScheduleValidation';

const SETTINGS_UPDATED_EVENT = 'wavelab:settings-updated';

const DEFAULTS = {
  operations: DEFAULT_OPERATIONS,
  forecasterWorkspace: DEFAULT_FORECASTER_WORKSPACE,
  mapView: DEFAULT_MAP_VIEW,
  adminReview: DEFAULT_ADMIN_REVIEW,
  general: DEFAULT_GENERAL,
  about: DEFAULT_ABOUT,
  contact: DEFAULT_CONTACT,
};

const API_PAGES = {
  mapView: 'mapview',
};

const LEGACY_LOCAL_KEYS = {
  general: 'admin.settings.general',
  operations: 'admin.settings.operations',
  forecasterWorkspace: 'admin.settings.forecasterWorkspace',
  adminReview: 'admin.settings.adminReview',
};

const SETTINGS_PAGES = Object.keys(DEFAULTS);

function readLocal(key, fallback) {
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

function broadcastSettingsUpdate(key, value = null) {
  window.dispatchEvent(new CustomEvent(SETTINGS_UPDATED_EVENT, {
    detail: { key, value, updatedAt: Date.now() },
  }));
}

function getApiPage(tab) {
  return API_PAGES[tab] || tab;
}

async function loadPersistedSettings() {
  const entries = await Promise.all(
    SETTINGS_PAGES.map(async (page) => {
      const data = await getSettings(getApiPage(page)).catch(() => null);
      return [page, data];
    }),
  );

  return entries.reduce((acc, [page, data]) => {
    const legacyLocal = LEGACY_LOCAL_KEYS[page]
      ? readLocal(LEGACY_LOCAL_KEYS[page], DEFAULTS[page])
      : DEFAULTS[page];

    acc[page] = hasValues(data)
      ? { ...DEFAULTS[page], ...data }
      : legacyLocal;

    return acc;
  }, {});
}

function getValidationError(tab, payload) {
  if (tab === 'operations') {
    return getOperationsScheduleValidationError(payload);
  }

  return null;
}

export default function useSettings() {
  const [activeTab, setActiveTab] = useState('operations');
  const [pages, setPages] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadPersistedSettings().then((data) => {
      if (cancelled) return;
      setPages((prev) => ({ ...prev, ...data }));
      setDataLoaded(true);
    });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(() => setStatus(null), 4000);
    return () => clearTimeout(timer);
  }, [status]);

  const handleSave = useCallback(async (settings) => {
    const payload = settings?.[activeTab] ?? {};
    const validationError = getValidationError(activeTab, payload);

    if (validationError) {
      setStatus({ type: 'error', message: validationError });
      return;
    }

    setSaving(true);

    try {
      const saved = await saveSettings(getApiPage(activeTab), payload);
      const nextData = { ...DEFAULTS[activeTab], ...saved };

      setPages((prev) => ({ ...prev, [activeTab]: nextData }));

      if (LEGACY_LOCAL_KEYS[activeTab]) {
        localStorage.setItem(LEGACY_LOCAL_KEYS[activeTab], JSON.stringify(nextData));
      }

      broadcastSettingsUpdate(activeTab, nextData);
      broadcastSettingsUpdate(getApiPage(activeTab), nextData);
      if (LEGACY_LOCAL_KEYS[activeTab]) broadcastSettingsUpdate(LEGACY_LOCAL_KEYS[activeTab], nextData);

      setStatus({ type: 'success', message: `${activeTab[0].toUpperCase() + activeTab.slice(1)} settings saved to database.` });
    } catch (err) {
      setStatus({ type: 'error', message: `Save failed: ${err.message}` });
    } finally {
      setSaving(false);
    }
  }, [activeTab]);

  const handleReset = useCallback(async () => {
    const defaults = DEFAULTS[activeTab];
    setSaving(true);

    try {
      const saved = await saveSettings(getApiPage(activeTab), defaults);
      const nextData = { ...defaults, ...saved };

      setPages((prev) => ({ ...prev, [activeTab]: nextData }));

      if (LEGACY_LOCAL_KEYS[activeTab]) {
        localStorage.setItem(LEGACY_LOCAL_KEYS[activeTab], JSON.stringify(nextData));
      }

      broadcastSettingsUpdate(activeTab, nextData);
      broadcastSettingsUpdate(getApiPage(activeTab), nextData);
      if (LEGACY_LOCAL_KEYS[activeTab]) broadcastSettingsUpdate(LEGACY_LOCAL_KEYS[activeTab], nextData);

      setStatus({ type: 'success', message: 'Reset to default values and saved to database.' });
    } catch (err) {
      setStatus({ type: 'error', message: `Reset failed: ${err.message}` });
    } finally {
      setSaving(false);
    }
  }, [activeTab]);

  return {
    activeTab,
    setActiveTab,
    operationsData: pages.operations,
    forecasterWorkspaceData: pages.forecasterWorkspace,
    mapViewData: pages.mapView,
    adminReviewData: pages.adminReview,
    generalData: pages.general,
    aboutData: pages.about,
    contactData: pages.contact,
    setOperationsData: (value) => setPages((prev) => ({ ...prev, operations: value })),
    setForecasterWorkspaceData: (value) => setPages((prev) => ({ ...prev, forecasterWorkspace: value })),
    setMapViewData: (value) => setPages((prev) => ({ ...prev, mapView: value })),
    setAdminReviewData: (value) => setPages((prev) => ({ ...prev, adminReview: value })),
    setGeneralData: (value) => setPages((prev) => ({ ...prev, general: value })),
    setAboutData: (value) => setPages((prev) => ({ ...prev, about: value })),
    setContactData: (value) => setPages((prev) => ({ ...prev, contact: value })),
    saving,
    status,
    dataLoaded,
    handleSave,
    handleReset,
  };
}