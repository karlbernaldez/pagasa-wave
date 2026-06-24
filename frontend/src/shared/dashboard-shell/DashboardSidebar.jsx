import { ChevronLeft, ChevronRight, CircleHelp, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const getShellClasses = (isDarkMode) =>
  isDarkMode
    ? 'border-white/10 bg-slate-950/72 text-slate-100 shadow-2xl shadow-black/35 backdrop-blur-2xl'
    : 'border-white/70 bg-white/72 text-slate-950 shadow-xl shadow-slate-300/50 backdrop-blur-2xl';

const getMutedText = (isDarkMode) => (isDarkMode ? 'text-slate-500' : 'text-slate-400');

const getControlClasses = (isDarkMode) =>
  isDarkMode
    ? 'border-white/10 bg-white/[0.03] text-slate-400 shadow-inner shadow-white/[0.03] hover:border-cyan-300/20 hover:bg-white/[0.08] hover:text-slate-100'
    : 'border-white/80 bg-white/55 text-slate-500 shadow-sm shadow-slate-200/60 hover:border-cyan-200 hover:bg-white/90 hover:text-slate-950';

const getNavClasses = ({ disabled, isActive, isDarkMode }) => {
  if (disabled) {
    return isDarkMode
      ? 'text-slate-600 hover:bg-white/[0.03]'
      : 'text-slate-400 hover:bg-white/55';
  }

  if (isActive) {
    return isDarkMode
      ? 'border border-cyan-300/15 bg-white/[0.10] text-white shadow-lg shadow-cyan-950/25'
      : 'border border-white/90 bg-white/85 text-slate-950 shadow-lg shadow-slate-200/70';
  }

  return isDarkMode
    ? 'border border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.06] hover:text-slate-100'
    : 'border border-transparent text-slate-600 hover:border-white/80 hover:bg-white/65 hover:text-slate-950';
};

const getSubNavClasses = ({ isActive, isDarkMode }) => {
  if (isActive) {
    return isDarkMode ? 'text-cyan-200' : 'text-cyan-700';
  }

  return isDarkMode
    ? 'text-slate-500 hover:text-slate-200'
    : 'text-slate-500 hover:text-slate-900';
};

const DashboardSidebar = ({
  activeId,
  footerText = 'Philippine Atmospheric, Geophysical and Astronomical Services Administration',
  groups,
  isDarkMode,
  isMobileOpen,
  isSidebarCollapsed,
  items = [],
  label,
  onItemSelect,
  setIsMobileOpen,
  setIsSidebarCollapsed,
  title = 'WaveLab',
}) => {
  const toggleCollapse = () => setIsSidebarCollapsed((prev) => !prev);
  const closeMobile = () => setIsMobileOpen(false);
  const navGroups = Array.isArray(groups) && groups.length > 0
    ? groups
    : [{ label: 'Navigation', items }];

  const renderActiveMark = (isActive) =>
    isActive ? (
      <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-cyan-400" />
    ) : null;

  const renderSoonBadge = (disabled) =>
    !isSidebarCollapsed && disabled ? (
      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] ${
        isDarkMode ? 'bg-white/[0.04] text-slate-600' : 'bg-white/70 text-slate-400'
      }`}>
        Soon
      </span>
    ) : null;

  const renderItemContent = ({ Icon, disabled, expandIcon, isActive, label: itemLabel }) => (
    <>
      <span className="flex min-w-0 items-center gap-3">
        {renderActiveMark(isActive)}
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
          isActive
            ? isDarkMode ? 'bg-cyan-300/12 text-cyan-200 shadow-inner shadow-cyan-300/10' : 'bg-cyan-50/80 text-cyan-700 shadow-inner shadow-white'
            : 'text-current'
        }`}>
          <Icon size={18} />
        </span>
        {!isSidebarCollapsed && <span className="min-w-0 truncate">{itemLabel}</span>}
      </span>

      {!isSidebarCollapsed && (
        <span className="flex shrink-0 items-center gap-2">
          {renderSoonBadge(disabled)}
          {expandIcon}
        </span>
      )}
    </>
  );

  const renderNavItem = (item) => {
    const Icon = item.icon;
    const isActive = item.isActive?.(activeId) ?? activeId === item.id ?? false;
    const hasChildren = Array.isArray(item.children) && item.children.length > 0;
    const isExpanded = item.isExpanded?.(activeId) ?? (hasChildren && item.children.some((child) => child.id === activeId));
    const stateActive = isActive || isExpanded;
    const itemClass = `relative flex min-h-[46px] w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold transition-colors ${
      isSidebarCollapsed ? 'justify-center' : 'justify-between'
    } ${getNavClasses({ disabled: item.disabled, isActive: stateActive, isDarkMode })}`;

    return (
      <div key={item.id ?? item.path ?? item.label}>
        {item.path && !item.disabled ? (
          <NavLink
            to={item.path}
            title={isSidebarCollapsed ? item.label : undefined}
            className={({ isActive: routeActive }) =>
              `relative flex min-h-[46px] w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold transition-colors ${
                isSidebarCollapsed ? 'justify-center' : ''
              } ${getNavClasses({ isActive: routeActive || isActive, isDarkMode })}`
            }
            onClick={closeMobile}
          >
            {({ isActive: routeActive }) =>
              renderItemContent({
                Icon,
                isActive: routeActive || isActive,
                label: item.label,
              })
            }
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
            className={itemClass}
          >
            {renderItemContent({
              Icon,
              disabled: item.disabled,
              expandIcon: hasChildren ? item.expandIcon?.(isExpanded) : null,
              isActive: stateActive,
              label: item.label,
            })}
          </button>
        )}

        {!isSidebarCollapsed && hasChildren && isExpanded && (
          <div className={`ml-7 mt-1 space-y-1 border-l pl-4 ${
            isDarkMode ? 'border-white/10' : 'border-white/80'
          }`}>
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
                  className={`block w-full rounded-lg px-2 py-2 text-left text-sm font-bold transition-colors ${getSubNavClasses({ isActive: childActive, isDarkMode })}`}
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

  const renderNavGroup = (group, index) => (
    <div key={group.id ?? group.label ?? index} className={index > 0 ? 'mt-5' : ''}>
      {!isSidebarCollapsed && (
        <div className={`mb-2 px-3 text-[10px] font-black uppercase tracking-[0.16em] ${getMutedText(isDarkMode)}`}>
          {group.label}
        </div>
      )}
      <div className="space-y-1">
        {(group.items ?? []).map(renderNavItem)}
      </div>
    </div>
  );

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={closeMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-dvh max-h-dvh flex-col overflow-hidden border-r transition-all duration-300 ${
          isSidebarCollapsed ? 'w-[86px]' : 'w-[292px]'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${getShellClasses(isDarkMode)}`}
      >
        <div className={`border-b px-4 py-4 ${isDarkMode ? 'border-white/10' : 'border-white/70'}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border ${
                isDarkMode ? 'border-white/10 bg-white/[0.06] shadow-inner shadow-white/[0.04]' : 'border-white/80 bg-white/70 shadow-sm shadow-slate-200/70'
              }`}>
                <img src="/pagasa-logo.png" alt="PAGASA Logo" className="h-7 w-7 object-contain" />
              </span>

              {!isSidebarCollapsed && (
                <div className="min-w-0">
                  <h1 className={`truncate text-base font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
                    {title}
                  </h1>
                  <p className={`truncate text-xs font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                    {label}
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={toggleCollapse}
              className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors lg:flex ${getControlClasses(isDarkMode)}`}
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>

            <button
              type="button"
              onClick={closeMobile}
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition-colors lg:hidden ${getControlClasses(isDarkMode)}`}
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
          {navGroups.map(renderNavGroup)}
        </nav>

        <div className={`border-t p-3 ${isDarkMode ? 'border-white/10' : 'border-white/70'}`}>
          <button
            type="button"
            title="Help & Support"
            className={`flex w-full items-center justify-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
              isSidebarCollapsed ? '' : 'justify-start'
            } ${isDarkMode ? 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100' : 'text-slate-500 hover:bg-white/65 hover:text-slate-950'}`}
          >
            <CircleHelp size={18} />
            {!isSidebarCollapsed && <span>Help & Support</span>}
          </button>

          {!isSidebarCollapsed && (
            <p className={`mt-3 px-3 pb-1 text-[10px] font-semibold leading-snug ${getMutedText(isDarkMode)}`}>
              {footerText}
            </p>
          )}
        </div>
      </aside>
    </>
  );
};

export default DashboardSidebar;
