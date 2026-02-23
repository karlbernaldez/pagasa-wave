// ╔══════════════════════════════════════════════════════╗
// ║                   useSettings.js                     ║
// ║  Handles: load from API / localStorage               ║
// ║           save per active tab                        ║
// ║           reset to defaults                          ║
// ║           status auto-dismiss                        ║
// ╚══════════════════════════════════════════════════════╝
import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_GENERAL, DEFAULT_ABOUT } from '../constants/defaults';

const LS_KEY = 'admin.settings.general';

const useSettings = () => {
  const [activeTab,   setActiveTab]   = useState('general');
  const [generalData, setGeneralData] = useState(DEFAULT_GENERAL);
  const [aboutData,   setAboutData]   = useState(DEFAULT_ABOUT);
  const [saving,      setSaving]      = useState(false);
  const [status,      setStatus]      = useState(null); // { type: 'success'|'error', message }

  // ── Load on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    // General — localStorage
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) setGeneralData((p) => ({ ...p, ...JSON.parse(stored) }));
    } catch (_) {}

    // About — Express API
    fetch('/api/settings/about')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setAboutData((p) => ({ ...p, ...data })); })
      .catch(() => {}); // fallback to defaults silently
  }, []);

  // ── Auto-dismiss status after 4 s ─────────────────────────────────────────
  useEffect(() => {
    if (!status) return;
    const t = setTimeout(() => setStatus(null), 4000);
    return () => clearTimeout(t);
  }, [status]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      if (activeTab === 'general') {
        localStorage.setItem(LS_KEY, JSON.stringify(generalData));
        setStatus({ type: 'success', message: 'General settings saved.' });

      } else if (activeTab === 'about') {
        const res = await fetch('/api/settings/about', {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(aboutData),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setStatus({ type: 'success', message: 'About page saved to database.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: `Save failed: ${err.message}` });
    } finally {
      setSaving(false);
    }
  }, [activeTab, generalData, aboutData]);

  // ── Reset ─────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    if (activeTab === 'general') {
      setGeneralData(DEFAULT_GENERAL);
      localStorage.removeItem(LS_KEY);
    } else if (activeTab === 'about') {
      setAboutData(DEFAULT_ABOUT);
    }
    setStatus({ type: 'success', message: 'Reset to default values.' });
  }, [activeTab]);

  return {
    activeTab,    setActiveTab,
    generalData,  setGeneralData,
    aboutData,    setAboutData,
    saving,
    status,
    handleSave,
    handleReset,
  };
};

export default useSettings;