import { ChevronDown, ChevronUp, Settings } from 'lucide-react';

import { ADMIN_ROUTE_BY_TAB, ADMIN_TABS, MENU_GROUPS } from '@dashboards/admin/constants/navigation';
import DashboardShell from '@/shared/dashboard-shell/DashboardShell';
import useCurrentDashboardUser from '@/shared/hooks/useCurrentDashboardUser';

const USER_TABS = [ADMIN_TABS.USERS, ADMIN_TABS.USERS_LIST, ADMIN_TABS.USERS_ROLES];
const WAVE_MODEL_TABS = [
  ADMIN_TABS.WAVE_MODELS,
  ADMIN_TABS.WAVE_PIPELINE,
  ADMIN_TABS.WAVE_MODEL_ONBOARDING,
];
const ACCOUNT_ITEM = {
  id: ADMIN_TABS.ACCOUNT,
  label: 'Account Settings',
  path: ADMIN_ROUTE_BY_TAB[ADMIN_TABS.ACCOUNT],
  icon: Settings,
};

const expandableIcon = (isExpanded) =>
  isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />;

const enhanceAdminItem = (item) => {
  if (item.id === ADMIN_TABS.WAVE_MODELS) {
    return {
      ...item,
      isActive: (activeId) => WAVE_MODEL_TABS.includes(activeId),
      isExpanded: (activeId) => WAVE_MODEL_TABS.includes(activeId),
      expandIcon: expandableIcon,
      children: [
        {
          id: ADMIN_TABS.WAVE_MODELS,
          label: 'Models',
          path: ADMIN_ROUTE_BY_TAB[ADMIN_TABS.WAVE_MODELS],
        },
        {
          id: ADMIN_TABS.WAVE_PIPELINE,
          label: 'Pipeline',
          path: ADMIN_ROUTE_BY_TAB[ADMIN_TABS.WAVE_PIPELINE],
        },
        {
          id: ADMIN_TABS.WAVE_MODEL_ONBOARDING,
          label: 'Onboarding',
          path: ADMIN_ROUTE_BY_TAB[ADMIN_TABS.WAVE_MODEL_ONBOARDING],
        },
      ],
    };
  }

  if (item.id === ADMIN_TABS.USERS) {
    return {
      ...item,
      isActive: (activeId) => USER_TABS.includes(activeId),
      isExpanded: (activeId) => USER_TABS.includes(activeId),
      expandIcon: expandableIcon,
      children: [
        {
          id: ADMIN_TABS.USERS_LIST,
          label: 'User List',
          path: ADMIN_ROUTE_BY_TAB[ADMIN_TABS.USERS_LIST],
        },
        {
          id: ADMIN_TABS.USERS_ROLES,
          label: 'Roles',
          path: ADMIN_ROUTE_BY_TAB[ADMIN_TABS.USERS_ROLES],
        },
      ],
    };
  }

  return item;
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
