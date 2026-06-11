import { NavLink } from 'react-router-dom';
import {
  Activity,
  Box,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  CloudSun,
  FileClock,
  FileText,
  Map,
  RadioTower,
  Waves,
  X,
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    label: 'Workspace',
    items: [
      { label: "Today's Forecast", path: '/today-forecast', icon: Activity },
      { label: 'Wave Analysis', path: '/studio?section=wave-analysis', icon: Waves, disabled: true },
      { label: '24-Hour Forecast', path: '/studio?section=forecast-24', icon: Waves, disabled: true },
      { label: '36-Hour Forecast', path: '/studio?section=forecast-36', icon: Waves, disabled: true },
      { label: '48-Hour Forecast', path: '/studio?section=forecast-48', icon: Waves, disabled: true },
    ],
  },
  {
    label: 'Data',
    items: [
      { label: 'Observations', path: '/studio?section=observations', icon: CloudSun, disabled: true },
      { label: 'Models', path: '/studio?section=models', icon: Box, disabled: true },
      { label: 'Nowcast', path: '/studio?section=nowcast', icon: RadioTower, disabled: true },
    ],
  },
  {
    label: 'Tools',
    items: [
      { label: 'Map Viewer', path: '/studio?section=map-viewer', icon: Map, disabled: true },
      { label: 'Report Builder', path: '/pdf', icon: FileText },
    ],
  },
  {
    label: 'History',
    items: [
      { label: 'Forecast Archive', path: '/studio?section=archive', icon: FileClock, disabled: true },
    ],
  },
];

const getShellClasses = (isDarkMode) =>
  isDarkMode
    ? 'bg-[#020c1b] border-[#0f2747]'
    : 'bg-gradient-to-b from-white via-gray-50 to-white border-gray-200/50';

const getNavClasses = ({ isActive, isDarkMode, disabled }) => {
  if (disabled) {
    return isDarkMode ? 'text-gray-500 opacity-60' : 'text-slate-400 opacity-70';
  }

  if (isActive) {
    return isDarkMode
      ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-900/40'
      : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-700';
  }

  return isDarkMode
    ? 'text-slate-300 hover:bg-[#0d2348] hover:text-white'
    : 'text-gray-700 hover:bg-gray-100/60';
};

export default function ForecasterSidebar({
  isDarkMode,
  isMobileOpen,
  setIsMobileOpen,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
}) {
  const toggleCollapse = () => setIsSidebarCollapsed((prev) => !prev);

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-30 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 flex flex-col overflow-y-auto border-r backdrop-blur-xl transition-all duration-300 ${
          isSidebarCollapsed ? 'w-[88px]' : 'w-72'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${getShellClasses(isDarkMode)}`}
      >
        {/* Header / Logo */}
        <div className={`flex items-center justify-between p-5 border-b ${isDarkMode ? 'border-[#0f2747]' : 'border-gray-200/30'}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg">
              <img src="/pagasa-logo.png" alt="PAGASA Logo" className="h-7 w-7 object-contain" />
            </div>

            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <h1 className={`text-base font-black leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  WaveLab
                </h1>
                <p className={`text-[11px] font-semibold leading-tight ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
                  Marine Forecast System
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleCollapse}
              className={`hidden lg:flex p-2 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-[#0d2348] text-slate-300' : 'hover:bg-gray-100 text-gray-700'
              }`}
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>

            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className={`lg:hidden p-2 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-[#0d2348] text-slate-300' : 'hover:bg-gray-100 text-gray-700'
              }`}
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-7 p-4 mt-2">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              {!isSidebarCollapsed && (
                <p className={`px-3 mb-2 text-[11px] font-semibold tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                  {section.label.toUpperCase()}
                </p>
              )}

              <div className="space-y-1">
                {section.items.map(({ label, path, icon: Icon, disabled }) => {
                  const baseClass = `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group ${
                    isSidebarCollapsed ? 'justify-center' : ''
                  }`;

                  if (disabled) {
                    return (
                      <button
                        key={label}
                        type="button"
                        disabled
                        title={isSidebarCollapsed ? label : undefined}
                        className={`${baseClass} ${getNavClasses({ isDarkMode, disabled: true })}`}
                      >
                        <Icon size={18} />
                        {!isSidebarCollapsed && <span>{label}</span>}
                      </button>
                    );
                  }

                  return (
                    <NavLink
                      key={path}
                      to={path}
                      title={isSidebarCollapsed ? label : undefined}
                      className={({ isActive }) =>
                        `${baseClass} ${getNavClasses({ isActive, isDarkMode })}`
                      }
                      onClick={() => setIsMobileOpen(false)}
                    >
                      <Icon size={18} />
                      {!isSidebarCollapsed && <span>{label}</span>}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className={`space-y-3 border-t p-4 ${isDarkMode ? 'border-[#0f2747]' : 'border-gray-200/30'}`}>
          <div className={`flex items-center gap-2 px-3 text-sm ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'} ${isSidebarCollapsed ? 'justify-center' : ''}`}>
            <CheckCircle2 size={16} className="shrink-0" />
            {!isSidebarCollapsed && <span>All changes saved</span>}
          </div>

          <button
            type="button"
            title={isSidebarCollapsed ? 'Help & Support' : undefined}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              isSidebarCollapsed ? 'justify-center' : ''
            } ${
              isDarkMode
                ? 'text-slate-300 hover:bg-[#0d2348] hover:text-white'
                : 'border border-gray-200 text-gray-700 hover:bg-gray-100/60'
            }`}
          >
            <CircleHelp size={18} />
            {!isSidebarCollapsed && <span>Help &amp; Support</span>}
          </button>

          {!isSidebarCollapsed && (
            <div className={`flex items-start gap-3 pt-2 text-[11px] font-semibold leading-snug ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
              <img src="/pagasa-logo.png" alt="" className="h-9 w-9 object-contain" aria-hidden="true" />
              <p>Philippine Atmospheric, Geophysical and Astronomical Services Administration</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}