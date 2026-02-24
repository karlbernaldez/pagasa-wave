import { useState, useEffect } from 'react';
import { getSettings } from '@/api/siteSettings';
import { DEFAULT_CONTACT } from '@/dashboards/admin/sections/settings/constants/defaults';

let contactCache = null;

const useContactSettings = () => {
  const [settings, setSettings] = useState(contactCache || DEFAULT_CONTACT);

  useEffect(() => {
    if (contactCache) return;

    const fetchSettings = async () => {
      try {
        const data = await getSettings('contact');
        if (data && Object.keys(data).length > 0) {
          contactCache = data;
          setSettings(prev => ({ ...prev, ...data }));
        }
      } catch (err) {
        console.warn('[useContactSettings] Using defaults:', err.message);
      }
    };

    fetchSettings();
  }, []);

  return settings;
};

export default useContactSettings;
