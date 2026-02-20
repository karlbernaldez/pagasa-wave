import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';

const STORAGE_KEY = 'admin.settings';

const DEFAULT_SETTINGS = {
  publicDashboardTitle: 'PAGASA Wave Intelligence Dashboard',
  publicDescription: 'Near-real-time marine conditions, forecasts, and advisories.',
  contactEmail: 'alerts@pagasa.gov.ph',
  defaultRegion: 'Pacific Area of Responsibility',
  maintenanceMode: false,
  maintenanceMessage: 'System is under scheduled maintenance. Please check back shortly.',
  logoPreview: '/pagasa-logo.png',
};

const SettingsSection = ({ isDarkMode }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const persisted = localStorage.getItem(STORAGE_KEY);
    if (persisted) {
      setSettings((prev) => ({ ...prev, ...JSON.parse(persisted) }));
    }
  }, []);

  const onFieldChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const onLogoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => onFieldChange('logoPreview', String(reader.result));
    reader.readAsDataURL(file);
  };

  const saveSettings = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setStatusMessage('Settings saved successfully.');
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(STORAGE_KEY);
    setStatusMessage('Settings reset to default values.');
  };

  return (
    <div className={`rounded-2xl border p-6 space-y-6 ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/80 border-gray-200'}`}>
      <div>
        <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>System Settings</h3>
        <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Manage public dashboard content, logo, contact details, and maintenance mode.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className={`block text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Public Dashboard Title</label>
            <input type="text" value={settings.publicDashboardTitle} onChange={(e) => onFieldChange('publicDashboardTitle', e.target.value)} className={`w-full px-4 py-3 rounded-xl border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
          </div>

          <div>
            <label className={`block text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Public Description</label>
            <textarea value={settings.publicDescription} onChange={(e) => onFieldChange('publicDescription', e.target.value)} rows={3} className={`w-full px-4 py-3 rounded-xl border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={`block text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Alert Email</label>
              <input type="email" value={settings.contactEmail} onChange={(e) => onFieldChange('contactEmail', e.target.value)} className={`w-full px-4 py-3 rounded-xl border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
            </div>
            <div>
              <label className={`block text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Default Region</label>
              <input type="text" value={settings.defaultRegion} onChange={(e) => onFieldChange('defaultRegion', e.target.value)} className={`w-full px-4 py-3 rounded-xl border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
            </div>
          </div>
        </div>

        <div className={`rounded-xl border p-4 ${isDarkMode ? 'border-gray-700 bg-gray-900/30' : 'border-gray-200 bg-gray-50'}`}>
          <h4 className={`font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Branding & Maintenance</h4>
          <label className={`block text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Upload Public Logo</label>
          <input type="file" accept="image/*" onChange={onLogoUpload} className={`w-full text-sm mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} />
          <img src={settings.logoPreview} alt="Public dashboard logo" className="h-16 w-auto object-contain rounded-lg bg-white p-2" />

          <label className="mt-4 flex items-center gap-3">
            <input type="checkbox" checked={settings.maintenanceMode} onChange={(e) => onFieldChange('maintenanceMode', e.target.checked)} />
            <span className={isDarkMode ? 'text-gray-200' : 'text-gray-800'}>Enable maintenance mode</span>
          </label>

          <div className="mt-3">
            <label className={`block text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Maintenance Message</label>
            <textarea value={settings.maintenanceMessage} onChange={(e) => onFieldChange('maintenanceMessage', e.target.value)} rows={3} className={`w-full px-4 py-3 rounded-xl border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={saveSettings} className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 text-white inline-flex items-center gap-2">
          <Save size={16} /> Save Settings
        </button>
        <button onClick={resetSettings} className={`px-4 py-2.5 rounded-lg text-sm font-semibold border ${isDarkMode ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-700'}`}>
          Reset
        </button>
        {statusMessage && <p className={`text-sm self-center ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>{statusMessage}</p>}
      </div>
    </div>
  );
};

export default SettingsSection;
