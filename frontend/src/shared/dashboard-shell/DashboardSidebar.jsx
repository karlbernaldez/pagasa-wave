import { ChevronLeft, ChevronRight, CircleHelp, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';

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

const getSubNavClasses = ({ isActive, isDarkMode }) => {
  if (isActive) {
    return isDarkMode
      ? 'bg-gradient-to-r from-blue-600/40 to-cyan-600/30 text-cyan-200'
      : 'bg-blue-50 text-blue-700';
  }

  return isDarkMode
    ? 'text-gray-400 hover:bg-gray-700/40 hover:text-gray-200'
    : 'text-slate-500 hover:bg-gray-100/60 hover:text-blue-700';
};

const DashboardSidebar = ({
  activeId,
  footerText = 'Philippine Atmospheric, Geophysical and Astronomical Services Administration',
  isDarkMode,
  isMobileOpen,
  isSidebarCollapsed,
  items,
  label,
  onItemSelect,
  setIsMobileOpen,
  setIsSidebarCollapsed,
  title = 'WaveLab',
}) => {
  const toggleCollapse = () => setIsSidebarCollapsed((prev) => !prev);
  const closeMobile = () => setIsMobileOpen(false);

  const renderNavItem = (item) => {
    const Icon = item.icon;
    const isActive = item.isActive?.(activeId) ?? activeId === item.id ?? false;
    const hasChildren = Array.isArray(item.children) && item.children.length > 0;
    const isExpanded = item.isExpanded?.(activeId) ?? (hasChildren && item.children.some((child) => child.id === activeId));
    const baseClass = `relative group flex w-full items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-300 ${
      isSidebarCollapsed ? 'justify-center' : 'justify-between'
    } ${getNavClasses({ isActive: isActive || isExpanded, isDarkMode, disabled: item.disabled })}`;

    const content = (
      <>
        <div className="flex min-w-0 items-center gap-3">
          <Icon size={20} />
          {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
        </div>
        {!isSidebarCollapsed && hasChildren && item.expandIcon?.(isExpanded)}
      </>
    );

    return (
      <div key={item.id ?? item.path ?? item.label}>
        {item.path && !item.disabled ? (
          <NavLink
            to={item.path}
            title={isSidebarCollapsed ? item.label : undefined}
            className={({ isActive: routeActive }) =>
              `relative group flex w-full items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-300 ${
                isSidebarCollapsed ? 'justify-center' : ''
              } ${getNavClasses({ isActive: routeActive || isActive, isDarkMode })}`
            }
            onClick={closeMobile}
          >
            <Icon size={20} />
            {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ) : (
          <button
            type="button"
            disabled={item.disabled}
            onClick={() => {
              if (!item.disabled) {
                onItemSelect?.(item);
                closeMobile();
              }
            }}
            title={isSidebarCollapsed ? item.label : undefined}
            className={baseClass}
          >
            {content}
          </button>
        )}

        {!isSidebarCollapsed && hasChildren && isExpanded && (
          <div className="ml-6 mt-2 space-y-1">
            {item.children.map((child) => {
              const childActive = child.isActive?.(activeId) ?? activeId === child.id;
              return (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => {
                    onItemSelect?.(child);
                    closeMobile();
                  }}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors ${getSubNavClasses({ isActive: childActive, isDarkMode })}`}
                >
                  {child.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-30 backdrop-blur-sm"
          onClick={closeMobile}
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
                  {title}
                </h1>
                <p className={`text-xs font-semibold ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
                  {label}
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
              onClick={closeMobile}
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
          {items.map(renderNavItem)}
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
              <p>{footerText}</p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default DashboardSidebar;
