import { ChevronDown, ChevronUp } from 'lucide-react';

import { ADMIN_TABS, MENU_ITEMS } from '@dashboards/admin/constants/navigation';
import DashboardShell from '@/shared/dashboard-shell/DashboardShell';
import useCurrentDashboardUser from '@/shared/hooks/useCurrentDashboardUser';

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

const ADMIN_USER_OPTIONS = { roleOverride: 'Administrator' };

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
  const { user } = useCurrentDashboardUser(null, ADMIN_USER_OPTIONS);

  return (
    <DashboardShell
      activeId={activeTab}
      isDarkMode={isDarkMode}
      isMobileOpen={isMobileOpen}
      isSidebarCollapsed={isSidebarCollapsed}
      onItemSelect={(item) => setActiveTab(item.id)}
      onMobileMenuToggle={onMobileMenuToggle}
      onThemeToggle={onToggleDarkMode}
      setIsMobileOpen={setIsMobileOpen}
      setIsSidebarCollapsed={setIsSidebarCollapsed}
      sidebar={{
        items: adminSidebarItems,
        label: 'Admin Dashboard',
      }}
      header={{
        description: activeMeta?.description,
        eyebrow: 'Admin Dashboard',
        title: activeMeta?.title ?? 'Dashboard Overview',
        user,
      }}
    >
      {children}
    </DashboardShell>
  );
};

export default AdminShell;
