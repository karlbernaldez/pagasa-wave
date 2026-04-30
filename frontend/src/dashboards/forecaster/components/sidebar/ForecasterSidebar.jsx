import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Box,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  CloudSun,
  FolderKanban,
  Map,
  RadioTower,
  Settings,
  Waves,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Project Library', path: '/studio', icon: FolderKanban },
  { label: 'Models', path: '/studio?section=models', icon: Box, disabled: true },
  { label: 'Observations', path: '/studio?section=observations', icon: CloudSun, disabled: true },
  { label: 'Nowcast', path: '/studio?section=nowcast', icon: RadioTower, disabled: true },
  { label: 'Analytics', path: '/studio?section=analytics', icon: BarChart3, disabled: true },
  { label: 'Map Viewer', path: '/studio?section=map-viewer', icon: Map, disabled: true },
  { label: 'Report Builder', path: '/pdf', icon: Waves, disabled: true },
  { label: 'Settings', path: '/profile', icon: Settings },
];

const getShellClasses = (isDarkMode) =>
  isDarkMode
    ? 'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-gray-700/50'
    : 'bg-gradient-to-b from-white via-gray-50 to-white border-gray-200/50';

const getNavClasses = ({ isActive, isDarkMode, disabled }) => {
  if (disabled) {
    return isDarkMode ? 'text-gray-500 opacity-70' : 'text-slate-500 opacity-80';
  }

  if (isActive) {
    return isDarkMode
      ? 'bg-gradient-to-r from-blue-600/80 to-cyan-600/80 text-white shadow-lg shadow-blue-500/30'
      : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-700';
  }

  return isDarkMode
    ? 'text-gray-300 hover:bg-gray-700/40'
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
        className={`fixed lg:static inset-y-0 left-0 z-40 overflow-y-auto border-r backdrop-blur-xl transition-all duration-300 ${
          isSidebarCollapsed ? 'w-[88px]' : 'w-72'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${getShellClasses(isDarkMode)}`}
      >
        <div className={`flex items-center justify-between p-5 border-b ${isDarkMode ? 'border-gray-700/30' : 'border-gray-200/30'}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-400 via-cyan-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shrink-0 overflow-hidden">
              <img src="/pagasa-logo.png" alt="PAGASA Logo" className="w-7 h-7 object-contain" />
            </div>

            {!isSidebarCollapsed && (
              <div>
                <h1 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  WaveLab
                </h1>
                <p className={`text-xs font-semibold ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
                  Forecaster Studio
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleCollapse}
              className={`hidden lg:flex p-2 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
              }`}
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>

            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className={`lg:hidden p-2 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
              }`}
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="p-4 space-y-2 mt-4">
          {NAV_ITEMS.map(({ label, path, icon: Icon, disabled }) => {
            const baseClass = `w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-300 relative group ${
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
                  <Icon size={20} />
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
                <Icon size={20} />
                {!isSidebarCollapsed && <span>{label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {!isSidebarCollapsed && (
          <div className={`mt-auto space-y-5 border-t p-5 ${isDarkMode ? 'border-gray-700/30' : 'border-gray-200/30'}`}>
            <button
              type="button"
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                isDarkMode
                  ? 'border-gray-700 text-gray-300 hover:bg-gray-700/40'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-100/60'
              }`}
            >
              <span className="inline-flex items-center gap-3">
                <CircleHelp size={18} />
                Help & Support
              </span>
              <span className="text-lg leading-none">›</span>
            </button>

            <div className={`flex items-start gap-3 text-[11px] font-semibold leading-snug ${isDarkMode ? 'text-gray-500' : 'text-slate-500'}`}>
              <img src="/pagasa-logo.png" alt="" className="h-9 w-9 object-contain" aria-hidden="true" />
              <p>Philippine Atmospheric, Geophysical and Astronomical Services Administration</p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
