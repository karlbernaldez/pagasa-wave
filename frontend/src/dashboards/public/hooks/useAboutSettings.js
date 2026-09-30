import { useEffect, useState } from 'react';

import { getSettings } from '@/api/siteSettings';
import { DEFAULT_ABOUT } from '@/dashboards/admin/sections/settings/constants/defaults';

const useAboutSettings = () => {
  const [settings, setSettings] = useState(DEFAULT_ABOUT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchSettings = async () => {
      try {
        if (mounted) setLoading(true);
        const data = await getSettings('about');

        if (mounted) {
          setSettings({ ...DEFAULT_ABOUT, ...(data || {}) });
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          console.warn('[useAboutSettings] Using defaults:', err.message);
          setSettings(DEFAULT_ABOUT);
          setError(err.message);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void fetchSettings();

    const handleSettingsUpdate = (event) => {
      if (['about', 'admin.settings.about'].includes(event.detail?.key)) {
        void fetchSettings();
      }
    };

    window.addEventListener('wavelab:settings-updated', handleSettingsUpdate);

    return () => {
      mounted = false;
      window.removeEventListener('wavelab:settings-updated', handleSettingsUpdate);
    };
  }, []);

  return { settings, loading, error };
};

export default useAboutSettings;
