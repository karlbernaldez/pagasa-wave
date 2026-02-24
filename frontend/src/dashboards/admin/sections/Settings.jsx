import { useMemo, useEffect } from "react";

import useSettings from './settings/hooks/useSettings';

import TabBar from './settings/components/TabBar';
import SaveBar from './settings/components/ui/SaveBar';

import GeneralTab from './settings/components/tabs/GeneralTab';
import AboutTab from './settings/components/tabs/AboutTab';
import ContactTab from './settings/components/tabs/ContactTab';

import { ensureIdsInSettings } from "./settings/utils/ensureIds";
import { useUndoRedoState } from "./settings/hooks/useUndoRedoState";


/* =========================================================
   1️⃣ PAGE REGISTRY (ADD NEW PAGES HERE ONLY)
========================================================= */

const pagesConfig = {
  general: { label: "General", component: GeneralTab },
  about:   { label: "About",   component: AboutTab   },
  contact: { label: "Contact", component: ContactTab },

  // Example future page:
  // faq: { label: "FAQ", component: FAQTab },
};


/* ========================================================= */

const SettingsSection = ({ isDarkMode }) => {

  const dark = isDarkMode;

  const {
    activeTab, setActiveTab,
    generalData,
    aboutData,
    contactData,
    saving,
    status,
    dataLoaded,         // ← true once all API calls resolve
    handleSave,
    handleReset,
  } = useSettings();


  /* =========================================================
     2️⃣ BUILD RAW SETTINGS OBJECT DYNAMICALLY
  ========================================================= */

  const rawSettings = {
    general: generalData,
    about:   aboutData,
    contact: contactData,
  };


  /* =========================================================
     3️⃣ NORMALIZE IDS FOR ALL PAGES
  ========================================================= */

  const combinedInitial = useMemo(() => {

    const normalized = {};

    Object.keys(pagesConfig).forEach(key => {
      normalized[key] = ensureIdsInSettings(rawSettings[key] || {});
    });

    return normalized;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generalData, aboutData, contactData]);


  /* =========================================================
     4️⃣ GLOBAL HISTORY
     Initialized with defaults; reset to real DB data once
     dataLoaded flips to true (see effect below).
  ========================================================= */

  const history = useUndoRedoState(combinedInitial, {
    maxHistory: 100,
    hotkeys: true,
  });

  // When the async data finishes loading, replace the history baseline
  // with the real server values so the user always sees DB data on mount.
  useEffect(() => {
    if (dataLoaded) {
      history.reset(combinedInitial);
    }
    // Only run when dataLoaded transitions to true — not on subsequent edits.
    // combinedInitial is intentionally omitted from deps here; its value at
    // the moment dataLoaded becomes true is exactly what we want.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLoaded]);

  const allSettings = history.present;


  /* =========================================================
     5️⃣ GENERIC SETTER FACTORY
  ========================================================= */

  const makeSetter = key => updater =>
    history.set(prev => ({
      ...prev,
      [key]: typeof updater === "function"
        ? updater(prev[key])
        : updater
    }));


  /* =========================================================
     6️⃣ SAVE / RESET
  ========================================================= */

  const onSave = () => handleSave(allSettings);

  const onReset = () => {
    history.reset(combinedInitial);
    handleReset?.();
  };


  /* =========================================================
     7️⃣ ACTIVE TAB COMPONENT (dynamic)
  ========================================================= */

  const ActiveComponent = pagesConfig[activeTab]?.component;


  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className={`rounded-2xl border overflow-hidden flex flex-col ${
      dark
        ? 'bg-slate-950 border-slate-800'
        : 'bg-slate-50 border-slate-200'
    }`}>

      {/* HEADER */}
      <div className={`px-6 py-5 border-b ${
        dark
          ? 'border-slate-800 bg-slate-900/50'
          : 'border-slate-200 bg-white'
      }`}>

        <h3 className={`text-xl font-black tracking-tight ${
          dark ? 'text-white' : 'text-slate-900'
        }`}>
          Settings
        </h3>

        <p className={`mt-0.5 text-sm ${
          dark ? 'text-slate-400' : 'text-slate-500'
        }`}>
          Manage public page content, branding, and system configuration.
        </p>

        {/* GLOBAL UNDO / REDO */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={history.undo}
            disabled={!history.canUndo}
            className="px-3 py-1 rounded bg-slate-700 text-white disabled:opacity-40"
          >
            Undo
          </button>

          <button
            onClick={history.redo}
            disabled={!history.canRedo}
            className="px-3 py-1 rounded bg-slate-700 text-white disabled:opacity-40"
          >
            Redo
          </button>
        </div>

      </div>


      {/* TAB BAR */}
      <TabBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dark={dark}
        tabs={Object.entries(pagesConfig).map(([key, val]) => ({
          id: key,
          label: val.label
        }))}
      />


      {/* TAB CONTENT — show a subtle loading state until DB data arrives */}
      <div className={`flex-1 p-6 overflow-y-auto ${
        dark ? 'bg-slate-950' : 'bg-slate-50'
      }`}>

        {!dataLoaded ? (
          <div className={`flex items-center justify-center py-20 text-sm ${
            dark ? 'text-slate-500' : 'text-slate-400'
          }`}>
            <svg
              className="animate-spin mr-2 h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
            </svg>
            Loading settings…
          </div>
        ) : ActiveComponent ? (
          <ActiveComponent
            settings={allSettings[activeTab]}
            setSettings={makeSetter(activeTab)}
            dark={dark}
          />
        ) : null}

      </div>


      {/* SAVE BAR */}
      <SaveBar
        onSave={onSave}
        onReset={onReset}
        saving={saving}
        status={status}
        dark={dark}
      />

    </div>
  );
};

export default SettingsSection;