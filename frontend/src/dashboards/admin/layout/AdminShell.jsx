import Sidebar from '@dashboards/admin/components/Sidebar';
import Header from '@dashboards/admin/components/Header/index';
import { MENU_ITEMS } from '@dashboards/admin/constants/navigation';

const AdminShell = ({
  activeMeta,
  activeTab,
  children,
  isDarkMode,
  isMobileOpen,
  isSidebarCollapsed,
  onMobileMenuToggle,
  onToggleDarkMode,
  setActiveTab,
  setIsMobileOpen,
  setIsSidebarCollapsed,
}) => {
  return (
    <div
      className={`min-h-screen flex transition-colors duration-500 ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}
    >
      <Sidebar
        menuItems={MENU_ITEMS}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        isDarkMode={isDarkMode}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        <Header
          activeMeta={activeMeta}
          onMobileMenuToggle={onMobileMenuToggle}
          isDarkMode={isDarkMode}
          onToggleDarkMode={onToggleDarkMode}
        />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminShell;
