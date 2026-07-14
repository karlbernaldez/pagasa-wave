import { ChevronDown, ChevronUp, Settings } from 'lucide-react';

import { ADMIN_ROUTE_BY_TAB, ADMIN_TABS, MENU_GROUPS } from '@dashboards/admin/constants/navigation';
import DashboardShell from '@/shared/dashboard-shell/DashboardShell';
import useCurrentDashboardUser from '@/shared/hooks/useCurrentDashboardUser';

const USER_TABS = [ADMIN_TABS.USERS, ADMIN_TABS.USERS_LIST, ADMIN_TABS.USERS_ROLES];
const ACCOUNT_ITEM = {
  id: ADMIN_TABS.ACCOUNT,
  label: 'Account Settings',
  path: ADMIN_ROUTE_BY_TAB[ADMIN_TABS.ACCOUNT],
  icon: Settings,
};

const enhanceAdminItem = (item) => {
  if (item.id !== ADMIN_TABS.USERS) return item;

  return {
    ...item,
    isActive: (activeId) => USER_TABS.includes(activeId),
    isExpanded: (activeId) => USER_TABS.includes(activeId),
    expandIcon: (isExpanded) => isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />,
    children: [
      { id: ADMIN_TABS.USERS_LIST, label: 'User List', path: ADMIN_ROUTE_BY_TAB[ADMIN_TABS.USERS_LIST] },
      { id: ADMIN_TABS.USERS_ROLES, label: 'Roles', path: ADMIN_ROUTE_BY_TAB[ADMIN_TABS.USERS_ROLES] },
    ],
  };
};

const adminSidebarGroups = MENU_GROUPS.map((group) => ({
  ...group,
  items: group.items.map(enhanceAdminItem),
}));

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
      backgroundVariant="ocean"
      isDarkMode={isDarkMode}
      isMobileOpen={isMobileOpen}
      isSidebarCollapsed={isSidebarCollapsed}
      onItemSelect={(item) => setActiveTab(item.id)}
      onMobileMenuToggle={onMobileMenuToggle}
      onThemeToggle={onToggleDarkMode}
      setIsMobileOpen={setIsMobileOpen}
      setIsSidebarCollapsed={setIsSidebarCollapsed}
      sidebar={{
        groups: adminSidebarGroups,
        utilityItems: [ACCOUNT_ITEM],
        label: 'Administration',
      }}
      header={{
        accountSettingsPath: ADMIN_ROUTE_BY_TAB[ADMIN_TABS.ACCOUNT],
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
