import { memo, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { ADMIN_TABS } from '@dashboards/admin/constants/navigation';

// ─── Constants ────────────────────────────────────────────────────────────────

const USER_TABS = [ADMIN_TABS.USERS, ADMIN_TABS.USERS_LIST, ADMIN_TABS.USERS_ROLES];

const SUB_ITEMS = [
  { id: ADMIN_TABS.USERS_LIST,  label: 'User List' },
  { id: ADMIN_TABS.USERS_ROLES, label: 'Roles'     },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Keeps ternary chains out of JSX
const cls = {
  aside: (isDarkMode) =>
    isDarkMode
      ? 'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-gray-700/50'
      : 'bg-gradient-to-b from-white via-gray-50 to-white border-gray-200/50',

  header: (isDarkMode) =>
    isDarkMode ? 'border-gray-700/30' : 'border-gray-200/30',

  iconBtn: (isDarkMode) =>
    isDarkMode
      ? 'hover:bg-gray-700 text-gray-300'
      : 'hover:bg-gray-100 text-gray-700',

  navItem: (isActive, isDarkMode) =>
    isActive
      ? isDarkMode
        ? 'bg-gradient-to-r from-blue-600/80 to-cyan-600/80 text-white shadow-lg shadow-blue-500/30'
        : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-700'
      : isDarkMode
        ? 'text-gray-300 hover:bg-gray-700/40'
        : 'text-gray-700 hover:bg-gray-100/60',

  subItem: (isActive, isDarkMode) =>
    isActive
      ? isDarkMode ? 'bg-gray-700 text-cyan-300' : 'bg-blue-100 text-blue-700'
      : isDarkMode ? 'text-gray-300 hover:bg-gray-700/40' : 'text-gray-600 hover:bg-gray-100',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const SubMenu = memo(({ activeTab, isDarkMode, onSelect }) => (
  <div className="ml-6 mt-2 space-y-1">
    {SUB_ITEMS.map(({ id, label }) => {
      // USERS_LIST is also active when the parent USERS tab is selected
      const isActive =
        activeTab === id ||
        (id === ADMIN_TABS.USERS_LIST && activeTab === ADMIN_TABS.USERS);

      return (
        <button
          key={id}
          onClick={() => onSelect(id)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${cls.subItem(isActive, isDarkMode)}`}
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
  const isUsers    = id === ADMIN_TABS.USERS;
  const isExpanded = isUsers && USER_TABS.includes(activeTab);
  const isActive   = activeTab === id || isExpanded;

  return (
    <div>
      <button
        onClick={() => onSelect(id)}
        title={isCollapsed ? label : undefined}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold
          transition-all duration-300 relative group
          ${isCollapsed ? 'justify-center' : 'justify-between'}
          ${cls.navItem(isActive, isDarkMode)}`}
      >
        <div className="flex items-center gap-3">
          <Icon size={20} className={isActive ? '' : 'group-hover:scale-110 transition-transform'} />
          {!isCollapsed && <span>{label}</span>}
        </div>

        {/* Expand/collapse chevron — only on the Users parent when not collapsed */}
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

// ─── Sidebar ─────────────────────────────────────────────────────────────────

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
  // Closes mobile drawer after any navigation
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
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-30 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 overflow-y-auto
          transition-all duration-300 border-r backdrop-blur-xl
          ${isSidebarCollapsed ? 'w-[88px]' : 'w-72'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${cls.aside(isDarkMode)}`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b ${cls.header(isDarkMode)}`}>
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
                  Admin Dashboard
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Desktop collapse toggle */}
            <button
              onClick={toggleCollapse}
              className={`hidden lg:flex p-2 rounded-lg transition-colors ${cls.iconBtn(isDarkMode)}`}
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>

            {/* Mobile close */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className={`lg:hidden p-2 rounded-lg transition-colors ${cls.iconBtn(isDarkMode)}`}
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="p-4 space-y-2 mt-4">
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