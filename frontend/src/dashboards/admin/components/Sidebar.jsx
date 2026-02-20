import { X, Waves, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';

import { ADMIN_TABS } from '@dashboards/admin/constants/navigation';

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
  const isUsersExpanded = [ADMIN_TABS.USERS, ADMIN_TABS.USERS_LIST, ADMIN_TABS.USERS_ROLES].includes(activeTab);

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-30 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 transition-all duration-300 z-40 overflow-y-auto ${
          isSidebarCollapsed ? 'w-[88px]' : 'w-72'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${
          isDarkMode
            ? 'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-gray-700/50'
            : 'bg-gradient-to-b from-white via-gray-50 to-white border-gray-200/50'
        } border-r backdrop-blur-xl`}
      >
        <div className={`flex items-center justify-between p-5 border-b ${isDarkMode ? 'border-gray-700/30' : 'border-gray-200/30'}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-400 via-cyan-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shrink-0">
              <Waves size={24} className="text-white" />
            </div>
            {!isSidebarCollapsed && (
              <div>
                <h1 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>WaveAdmin</h1>
                <p className={`text-xs font-semibold ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>Forecast Hub</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className={`hidden lg:flex p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
              aria-label="Toggle sidebar"
            >
              {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            <button
              onClick={() => setIsMobileOpen(false)}
              className={`lg:hidden p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              aria-label="Close sidebar"
            >
              <X size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
            </button>
          </div>
        </div>

        <nav className="p-4 space-y-2 mt-4">
          {menuItems.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            const isUsers = id === ADMIN_TABS.USERS;

            return (
              <div key={id}>
                <button
                  onClick={() => {
                    setActiveTab(id);
                    setIsMobileOpen(false);
                  }}
                  className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-300 relative group ${
                    isActive || (isUsers && isUsersExpanded)
                      ? isDarkMode
                        ? 'bg-gradient-to-r from-blue-600/80 to-cyan-600/80 text-white shadow-lg shadow-blue-500/30'
                        : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-700'
                      : isDarkMode
                        ? 'text-gray-300 hover:bg-gray-700/40'
                        : 'text-gray-700 hover:bg-gray-100/60'
                  }`}
                  title={isSidebarCollapsed ? label : undefined}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} className={isActive ? '' : 'group-hover:scale-110 transition-transform'} />
                    {!isSidebarCollapsed && <span>{label}</span>}
                  </div>

                  {!isSidebarCollapsed && isUsers && (isUsersExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                </button>

                {!isSidebarCollapsed && isUsers && isUsersExpanded && (
                  <div className="ml-6 mt-2 space-y-1">
                    <button
                      onClick={() => {
                        setActiveTab(ADMIN_TABS.USERS_LIST);
                        setIsMobileOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                        activeTab === ADMIN_TABS.USERS_LIST || activeTab === ADMIN_TABS.USERS
                          ? isDarkMode
                            ? 'bg-gray-700 text-cyan-300'
                            : 'bg-blue-100 text-blue-700'
                          : isDarkMode
                            ? 'text-gray-300 hover:bg-gray-700/40'
                            : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      User List
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab(ADMIN_TABS.USERS_ROLES);
                        setIsMobileOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                        activeTab === ADMIN_TABS.USERS_ROLES
                          ? isDarkMode
                            ? 'bg-gray-700 text-cyan-300'
                            : 'bg-blue-100 text-blue-700'
                          : isDarkMode
                            ? 'text-gray-300 hover:bg-gray-700/40'
                            : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Roles
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
