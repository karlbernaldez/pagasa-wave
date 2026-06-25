import { useState, useEffect, useCallback } from 'react';
import { getSettings, saveSettings } from '@/api/siteSettings';
import { DEFAULT_GENERAL, DEFAULT_OPERATIONS, DEFAULT_ABOUT, DEFAULT_CONTACT } from '../constants/defaults';

const LS_GENERAL_KEY = 'admin.settings.general';
const LS_OPERATIONS_KEY = 'admin.settings.operations';
const LOCAL_TABS = new Set(['general', 'operations']);

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

const getLocalKey = (tab) => {
  if (tab === 'general') return LS_GENERAL_KEY;
  if (tab === 'operations') return LS_OPERATIONS_KEY;
  return null;
};

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

export default function useSettings() {
  const [activeTab, setActiveTab] = useState('operations');
  const [pages, setPages] = useState({
    operations: DEFAULT_OPERATIONS,
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
      operations: readLocal(LS_OPERATIONS_KEY, prev.operations),
      general: readLocal(LS_GENERAL_KEY, prev.general),
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
    setSaving(true);

    try {
      if (LOCAL_TABS.has(activeTab)) {
        localStorage.setItem(getLocalKey(activeTab), JSON.stringify(payload));
        setPages((prev) => ({ ...prev, [activeTab]: { ...prev[activeTab], ...payload } }));
        setStatus({ type: 'success', message: `${activeTab[0].toUpperCase() + activeTab.slice(1)} settings saved.` });
      } else {
        await saveSettings(activeTab, payload);
        setPages((prev) => ({ ...prev, [activeTab]: { ...prev[activeTab], ...payload } }));
        bootstrapCache = {
          ...(bootstrapCache || {}),
          [activeTab]: { ...(bootstrapCache?.[activeTab] || {}), ...payload },
        };
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
      general: DEFAULT_GENERAL,
      about: DEFAULT_ABOUT,
      contact: DEFAULT_CONTACT,
    };

    setPages((prev) => ({ ...prev, [activeTab]: defaults[activeTab] }));

    if (LOCAL_TABS.has(activeTab)) {
      localStorage.removeItem(getLocalKey(activeTab));
    } else {
      bootstrapCache = { ...(bootstrapCache || {}), [activeTab]: defaults[activeTab] };
    }

    setStatus({ type: 'success', message: 'Reset to default values.' });
  }, [activeTab]);

  return {
    activeTab,
    setActiveTab,
    operationsData: pages.operations,
    generalData: pages.general,
    aboutData: pages.about,
    contactData: pages.contact,
    setOperationsData: (value) => setPages((prev) => ({ ...prev, operations: value })),
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
