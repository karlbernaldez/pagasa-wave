import { memo, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { ADMIN_TABS } from '@dashboards/admin/constants/navigation';

const USER_TABS = [ADMIN_TABS.USERS, ADMIN_TABS.USERS_LIST, ADMIN_TABS.USERS_ROLES];

const SUB_ITEMS = [
  { id: ADMIN_TABS.USERS_LIST, label: 'User List' },
  { id: ADMIN_TABS.USERS_ROLES, label: 'Roles' },
];

const cls = {
  aside: (isDarkMode) =>
    isDarkMode
      ? 'bg-gray-900 border-gray-700'
      : 'bg-white border-slate-200',

  header: (isDarkMode) =>
    isDarkMode ? 'border-gray-700' : 'border-slate-200',

  iconBtn: (isDarkMode) =>
    isDarkMode
      ? 'hover:bg-gray-800 text-gray-300'
      : 'hover:bg-slate-50 text-slate-600',

  navItem: (isActive, isDarkMode) =>
    isActive
      ? isDarkMode
        ? 'bg-blue-600 text-white'
        : 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100'
      : isDarkMode
        ? 'text-gray-300 hover:bg-gray-800'
        : 'text-slate-600 hover:bg-slate-50 hover:text-blue-700',

  subItem: (isActive, isDarkMode) =>
    isActive
      ? isDarkMode
        ? 'bg-blue-600/20 text-cyan-300'
        : 'bg-blue-50 text-blue-700'
      : isDarkMode
        ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
        : 'text-slate-500 hover:bg-slate-50 hover:text-blue-700',
};

const SubMenu = memo(({ activeTab, isDarkMode, onSelect }) => (
  <div className="ml-6 mt-2 space-y-1">
    {SUB_ITEMS.map(({ id, label }) => {
      const isActive =
        activeTab === id ||
        (id === ADMIN_TABS.USERS_LIST && activeTab === ADMIN_TABS.USERS);

      return (
        <button
          key={id}
          type="button"
          onClick={() => onSelect(id)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${cls.subItem(isActive, isDarkMode)}`}
        >
          {label}
        </button>
      );
    })}
  </div>
));
SubMenu.displayName = 'SubMenu';

const NavItem = memo(({ item, activeTab, isDarkMode, isCollapsed, onSelect }) => {
  const { id, label, icon: Icon } = item;
  const isUsers = id === ADMIN_TABS.USERS;
  const isExpanded = isUsers && USER_TABS.includes(activeTab);
  const isActive = activeTab === id || isExpanded;

  return (
    <div>
      <button
        type="button"
        onClick={() => onSelect(id)}
        title={isCollapsed ? label : undefined}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition ${
          isCollapsed ? 'justify-center' : 'justify-between'
        } ${cls.navItem(isActive, isDarkMode)}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Icon size={18} strokeWidth={1.8} />
          {!isCollapsed && <span className="truncate">{label}</span>}
        </div>

        {!isCollapsed && isUsers && (
          isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />
        )}
      </button>

      {!isCollapsed && isExpanded && (
        <SubMenu activeTab={activeTab} isDarkMode={isDarkMode} onSelect={onSelect} />
      )}
    </div>
  );
});
NavItem.displayName = 'NavItem';

const Sidebar = ({
  menuItems,
  activeTab,
  setActiveTab,
  isMobileOpen,
  setIsMobileOpen,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  isDarkMode,
}) => {
  const handleSelect = useCallback((id) => {
    setActiveTab(id);
    setIsMobileOpen(false);
  }, [setActiveTab, setIsMobileOpen]);

  const toggleCollapse = useCallback(
    () => setIsSidebarCollapsed((prev) => !prev),
    [setIsSidebarCollapsed],
  );

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-30 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 overflow-y-auto transition-all duration-300 border-r ${
          isSidebarCollapsed ? 'w-[88px]' : 'w-[280px]'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${cls.aside(isDarkMode)}`}
      >
        <div className={`flex h-[72px] items-center justify-between border-b px-6 ${cls.header(isDarkMode)}`}>
          <div className="flex items-center gap-3 min-w-0">
            <img src="/pagasa-logo.png" alt="PAGASA Logo" className="h-11 w-11 object-contain shrink-0" />

            {!isSidebarCollapsed && (
              <div className="leading-tight min-w-0">
                <p className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-gray-100' : 'text-blue-700'}`}>
                  PAGASA
                </p>
                <p className={`text-[10px] font-semibold truncate ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                  Admin Dashboard
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleCollapse}
              className={`hidden lg:flex p-2 rounded-lg transition-colors ${cls.iconBtn(isDarkMode)}`}
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>

            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className={`lg:hidden p-2 rounded-lg transition-colors ${cls.iconBtn(isDarkMode)}`}
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-8">
          {menuItems.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              activeTab={activeTab}
              isDarkMode={isDarkMode}
              isCollapsed={isSidebarCollapsed}
              onSelect={handleSelect}
            />
          ))}
        </nav>
      </aside>
    </>
  );
};

export default memo(Sidebar);
