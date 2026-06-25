import { useMemo, useEffect } from 'react';
import { RotateCcw, Save, Undo2, Redo2 } from 'lucide-react';

import useSettings from './settings/hooks/useSettings';

import TabBar from './settings/components/TabBar';
import SaveBar from './settings/components/ui/SaveBar';

import OperationsTab from './settings/components/tabs/OperationsTab';
import ForecasterWorkspaceTab from './settings/components/tabs/ForecasterWorkspaceTab';
import AdminReviewTab from './settings/components/tabs/AdminReviewTab';
import GeneralTab from './settings/components/tabs/GeneralTab';
import AboutTab from './settings/components/tabs/AboutTab';
import ContactTab from './settings/components/tabs/ContactTab';

import { SETTINGS_GROUPS, TABS } from './settings/constants/tabs';
import { ensureIdsInSettings } from './settings/utils/ensureIds';
import { useUndoRedoState } from './settings/hooks/useUndoRedoState';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const COMPONENTS = {
  operations: OperationsTab,
  forecasterWorkspace: ForecasterWorkspaceTab,
  adminReview: AdminReviewTab,
  general: GeneralTab,
  about: AboutTab,
  contact: ContactTab,
};

const pagesConfig = TABS.reduce((acc, tab) => {
  acc[tab.id] = { ...tab, component: COMPONENTS[tab.id] };
  return acc;
}, {});

function ActionButton({ icon: Icon, children, disabled, onClick, isDarkMode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-black shadow-sm backdrop-blur-xl transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        'focus:outline-none focus:ring-2 focus:ring-cyan-400/50',
        isDarkMode
          ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white'
          : 'border-white/80 bg-white/70 text-slate-600 hover:bg-white hover:text-slate-950',
      )}
    >
      <Icon size={15} />
      {children}
    </button>
  );
}

const SettingsSection = ({ isDarkMode }) => {
  const dark = isDarkMode;

  const {
    activeTab, setActiveTab,
    operationsData,
    forecasterWorkspaceData,
    adminReviewData,
    generalData,
    aboutData,
    contactData,
    saving,
    status,
    dataLoaded,
    handleSave,
    handleReset,
  } = useSettings();

  const rawSettings = {
    operations: operationsData,
    forecasterWorkspace: forecasterWorkspaceData,
    adminReview: adminReviewData,
    general: generalData,
    about: aboutData,
    contact: contactData,
  };

  const combinedInitial = useMemo(() => {
    const normalized = {};

    Object.keys(pagesConfig).forEach((key) => {
      normalized[key] = ensureIdsInSettings(rawSettings[key] || {});
    });

    return normalized;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operationsData, forecasterWorkspaceData, adminReviewData, generalData, aboutData, contactData]);

  const history = useUndoRedoState(combinedInitial, {
    maxHistory: 100,
    hotkeys: true,
  });

  useEffect(() => {
    if (dataLoaded) {
      history.reset(combinedInitial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLoaded]);

  const allSettings = history.present;

  const makeSetter = (key) => (updater) =>
    history.set((prev) => ({
      ...prev,
      [key]: typeof updater === 'function'
        ? updater(prev[key])
        : updater,
    }));

  const onSave = () => handleSave(allSettings);

  const onReset = () => {
    history.reset(combinedInitial);
    handleReset?.();
  };

  const activeConfig = pagesConfig[activeTab];
  const activeGroup = SETTINGS_GROUPS.find((group) => group.id === activeConfig?.group);
  const ActiveComponent = activeConfig?.component;
  const pageSurface = dark
    ? 'border-white/10 bg-slate-950/50 shadow-black/20'
    : 'border-white/70 bg-white/70 shadow-slate-300/40';
  const contentSurface = dark ? 'bg-slate-950' : 'bg-slate-50';
  const text = dark ? 'text-white' : 'text-slate-950';
  const muted = dark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="mx-auto max-w-[1500px] p-4 sm:p-6">
      <section className={cn('overflow-hidden rounded-2xl border shadow-xl backdrop-blur-xl', pageSurface)}>
        <header className={cn('border-b px-5 py-5 sm:px-6', dark ? 'border-white/10 bg-white/[0.03]' : 'border-white/70 bg-white/75')}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className={cn('text-xs font-black uppercase tracking-[0.16em]', dark ? 'text-cyan-200' : 'text-cyan-700')}>
                Admin settings
              </p>
              <h2 className={cn('mt-2 text-2xl font-black tracking-tight', text)}>
                Dashboard Settings Control Center
              </h2>
              <p className={cn('mt-1 max-w-3xl text-sm font-semibold leading-6', muted)}>
                Select a work area first, then edit only the configurable copy, schedules, and public content for that area. Fixed forecast-package rules stay out of Settings.
              </p>
              {activeGroup && (
                <div className={cn('mt-4 rounded-2xl border px-4 py-3', dark ? 'border-white/10 bg-white/[0.03]' : 'border-white/80 bg-white/70')}>
                  <p className={cn('text-xs font-black uppercase tracking-[0.14em]', muted)}>Selected area</p>
                  <p className={cn('mt-1 text-sm font-black', text)}>{activeGroup.label} · {activeConfig?.label}</p>
                  <p className={cn('mt-1 text-xs font-semibold leading-5', muted)}>{activeGroup.description}</p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <ActionButton icon={Undo2} onClick={history.undo} disabled={!history.canUndo} isDarkMode={dark}>
                Undo
              </ActionButton>
              <ActionButton icon={Redo2} onClick={history.redo} disabled={!history.canRedo} isDarkMode={dark}>
                Redo
              </ActionButton>
              <ActionButton icon={RotateCcw} onClick={onReset} disabled={!dataLoaded || saving} isDarkMode={dark}>
                Reset
              </ActionButton>
              <ActionButton icon={Save} onClick={onSave} disabled={!dataLoaded || saving} isDarkMode={dark}>
                {saving ? 'Saving' : 'Save'}
              </ActionButton>
            </div>
          </div>
        </header>

        <TabBar activeTab={activeTab} setActiveTab={setActiveTab} dark={dark} />

        <div className={cn('min-h-[560px] p-4 sm:p-6', contentSurface)}>
          {!dataLoaded ? (
            <div className={cn('flex items-center justify-center rounded-2xl border py-24 text-sm font-semibold', dark ? 'border-white/10 bg-white/[0.03] text-slate-400' : 'border-white/80 bg-white/70 text-slate-500')}>
              <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
              </svg>
              Loading settings...
            </div>
          ) : ActiveComponent ? (
            <ActiveComponent settings={allSettings[activeTab]} setSettings={makeSetter(activeTab)} dark={dark} />
          ) : null}
        </div>

        <SaveBar onSave={onSave} onReset={onReset} saving={saving} status={status} dark={dark} />
      </section>
    </div>
  );
};

export default SettingsSection;
