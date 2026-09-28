import { useState, useEffect } from 'react';
import { getSettings } from '@/api/siteSettings';
import { DEFAULT_CONTACT } from '@/dashboards/admin/sections/settings/constants/defaults';

let contactCache = null;

const useContactSettings = () => {
  const [settings, setSettings] = useState(contactCache || DEFAULT_CONTACT);

  useEffect(() => {
    let mounted = true;

    const fetchSettings = async ({ force = false } = {}) => {
      if (contactCache && !force) {
        if (mounted) setSettings((prev) => ({ ...prev, ...contactCache }));
        return;
      }

      try {
        const data = await getSettings('contact');
        if (data && Object.keys(data).length > 0) {
          contactCache = data;
          if (mounted) setSettings((prev) => ({ ...prev, ...data }));
        }
      } catch (err) {
        console.warn('[useContactSettings] Using defaults:', err.message);
      }
    };

    void fetchSettings();

    const handleSettingsUpdate = (event) => {
      if (['contact', 'admin.settings.contact'].includes(event.detail?.key)) {
        contactCache = null;
        void fetchSettings({ force: true });
      }
    };

    window.addEventListener('wavelab:settings-updated', handleSettingsUpdate);

    return () => {
      mounted = false;
      window.removeEventListener('wavelab:settings-updated', handleSettingsUpdate);
    };
  }, []);

  return settings;
};

export default useContactSettings;
