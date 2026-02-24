// ╔══════════════════════════════════════════════════════╗
// ║          hooks/useSettings.js  (Admin)               ║
// ║  Admin settings panel — load & save via API helper.  ║
// ╚══════════════════════════════════════════════════════╝
import { useState, useEffect, useCallback } from 'react';
import { getSettings, saveSettings } from '@/api/siteSettings';
import { DEFAULT_GENERAL, DEFAULT_ABOUT, DEFAULT_CONTACT } from '../constants/defaults';

const LS_KEY = 'admin.settings.general';

const useSettings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [generalData, setGeneralData] = useState(DEFAULT_GENERAL);
  const [contactData, setContactData] = useState(DEFAULT_CONTACT);
  const [aboutData, setAboutData] = useState(DEFAULT_ABOUT);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  // Tracks when ALL async sources have resolved so SettingsSection
  // knows to reset the undo/redo history with the real server data.
  const [dataLoaded, setDataLoaded] = useState(false);

  // ── Load on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    // General — localStorage only (synchronous, resolves immediately)
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) setGeneralData((p) => ({ ...p, ...JSON.parse(stored) }));
    } catch (_) { }

    // About + Contact — from API helper (async)
    const loadAll = async () => {
      const loadPage = async (page, setter) => {
        try {
          const data = await getSettings(page);
          if (data && Object.keys(data).length > 0) {
            setter((prev) => ({ ...prev, ...data }));
          }
        } catch (_) { } // silently fallback to defaults
      };

      await Promise.all([
        loadPage('about', setAboutData),
        loadPage('contact', setContactData),
      ]);

      // Signal that all remote data is ready — SettingsSection will now
      // reset the history so the user sees DB values, not stale defaults.
      setDataLoaded(true);
    };

    loadAll();
  }, []);

  // ── Auto-dismiss status after 4s ───────────────────────────────────────────
  useEffect(() => {
    if (!status) return;
    const t = setTimeout(() => setStatus(null), 4000);
    return () => clearTimeout(t);
  }, [status]);

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async (settings) => {
    setSaving(true);

    try {

      if (activeTab === 'general') {

        const payload = settings?.general ?? {};
        localStorage.setItem(LS_KEY, JSON.stringify(payload));

        setStatus({
          type: 'success',
          message: 'General settings saved.'
        });

      } else if (activeTab === 'about') {

        const payload = settings?.about ?? {};
        await saveSettings('about', payload);

        setStatus({
          type: 'success',
          message: 'About page saved to database.'
        });

      } else if (activeTab === 'contact') {

        const payload = settings?.contact ?? {};
        await saveSettings('contact', payload);

        setStatus({
          type: 'success',
          message: 'Contact page saved to database.'
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

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    if (activeTab === 'general') {
      setGeneralData(DEFAULT_GENERAL);
      localStorage.removeItem(LS_KEY);
    } else if (activeTab === 'about') {
      setAboutData(DEFAULT_ABOUT);
    } else if (activeTab === 'contact') {
      setContactData(DEFAULT_CONTACT);
    }
    setStatus({ type: 'success', message: 'Reset to default values.' });
  }, [activeTab]);

  return {
    activeTab, setActiveTab,
    generalData, setGeneralData,
    aboutData, setAboutData,
    contactData, setContactData,
    saving,
    status,
    dataLoaded,
    handleSave,
    handleReset,
  };
};

export default useSettings;