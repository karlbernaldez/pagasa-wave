import useSettings  from './settings/hooks/useSettings';
import TabBar        from './settings/components/TabBar';
import SaveBar       from './settings/components/ui/SaveBar';
import GeneralTab    from './settings/components/tabs/GeneralTab';
import AboutTab      from './settings/components/tabs/AboutTab';

const SettingsSection = ({ isDarkMode }) => {
  const dark = isDarkMode;

  const {
    activeTab,    setActiveTab,
    generalData,  setGeneralData,
    aboutData,    setAboutData,
    saving,
    status,
    handleSave,
    handleReset,
  } = useSettings();

  return (
    <div className={`rounded-2xl border overflow-hidden flex flex-col ${
      dark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
    }`}>

      {/* ── Header ──────────────────────────────────────── */}
      <div className={`px-6 py-5 border-b ${
        dark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white'
      }`}>
        <h3 className={`text-xl font-black tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>
          Settings
        </h3>
        <p className={`mt-0.5 text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
          Manage public page content, branding, and system configuration.
        </p>
      </div>

      {/* ── Tab Bar ─────────────────────────────────────── */}
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} dark={dark} />

      {/* ── Tab Content ─────────────────────────────────── */}
      <div className={`flex-1 p-6 overflow-y-auto ${dark ? 'bg-slate-950' : 'bg-slate-50'}`}>
        {activeTab === 'general' && (
          <GeneralTab settings={generalData} setSettings={setGeneralData} dark={dark} />
        )}
        {activeTab === 'about' && (
          <AboutTab settings={aboutData} setSettings={setAboutData} dark={dark} />
        )}
      </div>

      {/* ── Sticky Save Bar ─────────────────────────────── */}
      <SaveBar
        onSave={handleSave}
        onReset={handleReset}
        saving={saving}
        status={status}
        dark={dark}
      />

    </div>
  );
};

export default SettingsSection;