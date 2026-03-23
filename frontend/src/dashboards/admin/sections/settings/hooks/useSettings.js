import { useState, useEffect, useCallback } from 'react';
import { getSettings, saveSettings } from '@/api/siteSettings';
import { DEFAULT_GENERAL, DEFAULT_ABOUT, DEFAULT_CONTACT } from '../constants/defaults';

const LS_KEY = 'admin.settings.general';

/* ======================================================
   BOOTSTRAP CACHE (module-level, shared across mounts)
====================================================== */
let bootstrapPromise = null;
let bootstrapCache = null;

const loadBootstrap = () => {
  if (bootstrapCache) return Promise.resolve(bootstrapCache);
  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = Promise.all([
    getSettings('about').catch(() => null),
    getSettings('contact').catch(() => null),
  ])
    .then(([about, contact]) => {
      bootstrapCache = {
        about: about && Object.keys(about).length ? about : null,
        contact: contact && Object.keys(contact).length ? contact : null,
      };
      return bootstrapCache;
    });

  return bootstrapPromise;
};

/* ======================================================
   HOOK
====================================================== */
export default function useSettings() {

  const [activeTab, setActiveTab] = useState('general');

  const [pages, setPages] = useState({
    general: DEFAULT_GENERAL,
    about: DEFAULT_ABOUT,
    contact: DEFAULT_CONTACT,
  });

  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  /* ======================================================
     LOAD ON MOUNT
  ====================================================== */
  useEffect(() => {

    // ---- load local general settings
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPages(prev => ({ ...prev, general: { ...prev.general, ...parsed } }));
      }
    } catch { }

    // ---- load API bootstrap
    let cancelled = false;

    loadBootstrap().then(data => {
      if (cancelled) return;

      setPages(prev => ({
        general: prev.general,
        about: data?.about ? { ...prev.about, ...data.about } : prev.about,
        contact: data?.contact ? { ...prev.contact, ...data.contact } : prev.contact,
      }));

      setDataLoaded(true);
    });

    return () => { cancelled = true; };

  }, []);

  /* ======================================================
     AUTO CLEAR STATUS
  ====================================================== */
  useEffect(() => {
    if (!status) return;
    const t = setTimeout(() => setStatus(null), 4000);
    return () => clearTimeout(t);
  }, [status]);

  /* ======================================================
     SAVE
  ====================================================== */
  const handleSave = useCallback(async (settings) => {

    const payload = settings?.[activeTab] ?? {};
    setSaving(true);

    try {

      if (activeTab === 'general') {

        localStorage.setItem(LS_KEY, JSON.stringify(payload));

        setPages(prev => ({
          ...prev,
          general: { ...prev.general, ...payload }
        }));

        setStatus({ type: 'success', message: 'General settings saved.' });

      } else {

        await saveSettings(activeTab, payload);

        setPages(prev => ({
          ...prev,
          [activeTab]: { ...prev[activeTab], ...payload }
        }));

        bootstrapCache = {
          ...(bootstrapCache || {}),
          [activeTab]: {
            ...(bootstrapCache?.[activeTab] || {}),
            ...payload
          }
        };

        setStatus({
          type: 'success',
          message: `${activeTab[0].toUpperCase() + activeTab.slice(1)} page saved to database.`
        });

      }

    } catch (err) {

      setStatus({
        type: 'error',
        message: `Save failed: ${err.message}`
      });

    } finally {
      setSaving(false);
    }

  }, [activeTab]);

  /* ======================================================
     RESET
  ====================================================== */
  const handleReset = useCallback(() => {

    const defaults = {
      general: DEFAULT_GENERAL,
      about: DEFAULT_ABOUT,
      contact: DEFAULT_CONTACT,
    };

    setPages(prev => ({
      ...prev,
      [activeTab]: defaults[activeTab]
    }));

    if (activeTab === 'general') {
      localStorage.removeItem(LS_KEY);
    } else {
      bootstrapCache = {
        ...(bootstrapCache || {}),
        [activeTab]: defaults[activeTab]
      };
    }

    setStatus({ type: 'success', message: 'Reset to default values.' });

  }, [activeTab]);

  /* ======================================================
     RETURN
  ====================================================== */
  return {
    activeTab,
    setActiveTab,

    generalData: pages.general,
    aboutData: pages.about,
    contactData: pages.contact,

    setGeneralData: v => setPages(p => ({ ...p, general: v })),
    setAboutData: v => setPages(p => ({ ...p, about: v })),
    setContactData: v => setPages(p => ({ ...p, contact: v })),

    saving,
    status,
    dataLoaded,

    handleSave,
    handleReset,
  };
}