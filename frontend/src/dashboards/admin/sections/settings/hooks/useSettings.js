import { useState, useEffect, useCallback } from 'react';
import { getSettings, saveSettings } from '@/api/siteSettings';
import {
  DEFAULT_ADMIN_REVIEW,
  DEFAULT_ABOUT,
  DEFAULT_CONTACT,
  DEFAULT_FORECASTER_WORKSPACE,
  DEFAULT_GENERAL,
  DEFAULT_OPERATIONS,
} from '../constants/defaults';
import { getOperationsScheduleValidationError } from '../utils/operationsScheduleValidation';

const LS_GENERAL_KEY = 'admin.settings.general';
const LS_OPERATIONS_KEY = 'admin.settings.operations';
const LS_FORECASTER_WORKSPACE_KEY = 'admin.settings.forecasterWorkspace';
const LS_ADMIN_REVIEW_KEY = 'admin.settings.adminReview';
const SETTINGS_UPDATED_EVENT = 'wavelab:settings-updated';

const LOCAL_KEYS = {
  general: LS_GENERAL_KEY,
  operations: LS_OPERATIONS_KEY,
  forecasterWorkspace: LS_FORECASTER_WORKSPACE_KEY,
  adminReview: LS_ADMIN_REVIEW_KEY,
};

let bootstrapPromise = null;
let bootstrapCache = null;

const readLocal = (key, fallback) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? { ...fallback, ...JSON.parse(stored) } : fallback;
  } catch {
    return fallback;
  }
};

function broadcastSettingsUpdate(key, value = null) {
  window.dispatchEvent(new CustomEvent(SETTINGS_UPDATED_EVENT, {
    detail: { key, value, updatedAt: Date.now() },
  }));
}

const loadBootstrap = () => {
  if (bootstrapCache) return Promise.resolve(bootstrapCache);
  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = Promise.all([
    getSettings('about').catch(() => null),
    getSettings('contact').catch(() => null),
  ]).then(([about, contact]) => {
    bootstrapCache = {
      about: about && Object.keys(about).length ? about : null,
      contact: contact && Object.keys(contact).length ? contact : null,
    };
    return bootstrapCache;
  });

  return bootstrapPromise;
};

function getValidationError(tab, payload) {
  if (tab === 'operations') {
    return getOperationsScheduleValidationError(payload);
  }

  return null;
}

export default function useSettings() {
  const [activeTab, setActiveTab] = useState('operations');
  const [pages, setPages] = useState({
    operations: DEFAULT_OPERATIONS,
    forecasterWorkspace: DEFAULT_FORECASTER_WORKSPACE,
    adminReview: DEFAULT_ADMIN_REVIEW,
    general: DEFAULT_GENERAL,
    about: DEFAULT_ABOUT,
    contact: DEFAULT_CONTACT,
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    setPages((prev) => ({
      ...prev,
      operations: readLocal(LOCAL_KEYS.operations, prev.operations),
      forecasterWorkspace: readLocal(LOCAL_KEYS.forecasterWorkspace, prev.forecasterWorkspace),
      adminReview: readLocal(LOCAL_KEYS.adminReview, prev.adminReview),
      general: readLocal(LOCAL_KEYS.general, prev.general),
    }));

    let cancelled = false;
    loadBootstrap().then((data) => {
      if (cancelled) return;
      setPages((prev) => ({
        ...prev,
        about: data?.about ? { ...prev.about, ...data.about } : prev.about,
        contact: data?.contact ? { ...prev.contact, ...data.contact } : prev.contact,
      }));
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
      if (LOCAL_KEYS[activeTab]) {
        localStorage.setItem(LOCAL_KEYS[activeTab], JSON.stringify(payload));
        broadcastSettingsUpdate(LOCAL_KEYS[activeTab], payload);
        setPages((prev) => ({ ...prev, [activeTab]: { ...prev[activeTab], ...payload } }));
        setStatus({ type: 'success', message: `${activeTab[0].toUpperCase() + activeTab.slice(1)} settings saved.` });
      } else {
        await saveSettings(activeTab, payload);
        setPages((prev) => ({ ...prev, [activeTab]: { ...prev[activeTab], ...payload } }));
        bootstrapCache = {
          ...(bootstrapCache || {}),
          [activeTab]: { ...(bootstrapCache?.[activeTab] || {}), ...payload },
        };
        broadcastSettingsUpdate(activeTab, payload);
        setStatus({ type: 'success', message: `${activeTab[0].toUpperCase() + activeTab.slice(1)} page saved to database.` });
      }
    } catch (err) {
      setStatus({ type: 'error', message: `Save failed: ${err.message}` });
    } finally {
      setSaving(false);
    }
  }, [activeTab]);

  const handleReset = useCallback(() => {
    const defaults = {
      operations: DEFAULT_OPERATIONS,
      forecasterWorkspace: DEFAULT_FORECASTER_WORKSPACE,
      adminReview: DEFAULT_ADMIN_REVIEW,
      general: DEFAULT_GENERAL,
      about: DEFAULT_ABOUT,
      contact: DEFAULT_CONTACT,
    };

    setPages((prev) => ({ ...prev, [activeTab]: defaults[activeTab] }));

    if (LOCAL_KEYS[activeTab]) {
      localStorage.removeItem(LOCAL_KEYS[activeTab]);
      broadcastSettingsUpdate(LOCAL_KEYS[activeTab], defaults[activeTab]);
    } else {
      bootstrapCache = { ...(bootstrapCache || {}), [activeTab]: defaults[activeTab] };
      broadcastSettingsUpdate(activeTab, defaults[activeTab]);
    }

    setStatus({ type: 'success', message: 'Reset to default values.' });
  }, [activeTab]);

  return {
    activeTab,
    setActiveTab,
    operationsData: pages.operations,
    forecasterWorkspaceData: pages.forecasterWorkspace,
    adminReviewData: pages.adminReview,
    generalData: pages.general,
    aboutData: pages.about,
    contactData: pages.contact,
    setOperationsData: (value) => setPages((prev) => ({ ...prev, operations: value })),
    setForecasterWorkspaceData: (value) => setPages((prev) => ({ ...prev, forecasterWorkspace: value })),
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
