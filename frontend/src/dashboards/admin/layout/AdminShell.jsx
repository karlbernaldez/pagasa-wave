import { ChevronDown, ChevronUp } from 'lucide-react';

import Header from '@dashboards/admin/components/Header/index';
import { ADMIN_TABS, MENU_ITEMS } from '@dashboards/admin/constants/navigation';
import DashboardSidebar from '@/shared/dashboard-shell/DashboardSidebar';

const USER_TABS = [ADMIN_TABS.USERS, ADMIN_TABS.USERS_LIST, ADMIN_TABS.USERS_ROLES];

const adminSidebarItems = MENU_ITEMS.map((item) => {
  if (item.id !== ADMIN_TABS.USERS) return item;

  return {
    ...item,
    isActive: (activeId) => USER_TABS.includes(activeId),
    isExpanded: (activeId) => USER_TABS.includes(activeId),
    expandIcon: (isExpanded) => isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />,
    children: [
      { id: ADMIN_TABS.USERS_LIST, label: 'User List' },
      { id: ADMIN_TABS.USERS_ROLES, label: 'Roles' },
    ],
  };
});

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
      <DashboardSidebar
        activeId={activeTab}
        isDarkMode={isDarkMode}
        isMobileOpen={isMobileOpen}
        isSidebarCollapsed={isSidebarCollapsed}
        items={adminSidebarItems}
        label="Admin Dashboard"
        onItemSelect={(item) => setActiveTab(item.id)}
        setIsMobileOpen={setIsMobileOpen}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
      />

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
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
