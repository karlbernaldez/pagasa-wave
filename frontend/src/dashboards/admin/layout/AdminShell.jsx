import { useMemo } from 'react';
import { ChevronDown, ChevronUp, Settings } from 'lucide-react';

import {
  ADMIN_ANY_PERMISSION_BY_TAB,
  ADMIN_PERMISSION_BY_TAB,
  ADMIN_ROUTE_BY_TAB,
  ADMIN_TABS,
  MENU_GROUPS,
} from '@dashboards/admin/constants/navigation';
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

const canAccessTab = (rawUser, tab) => {
  const permissions = new Set(rawUser?.permissions || []);
  const requiredAny = ADMIN_ANY_PERMISSION_BY_TAB[tab] || [];
  if (requiredAny.length) return requiredAny.some((permission) => permissions.has(permission));

  const permission = ADMIN_PERMISSION_BY_TAB[tab];
  if (!permission) return false;
  return permissions.has(permission);
};

const enhanceAdminItem = (item, rawUser) => {
  if (item.id === ADMIN_TABS.WAVE_MODELS) {
    const children = [
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
    ].filter((child) => canAccessTab(rawUser, child.id));

    if (!children.length) return null;

    return {
      ...item,
      isActive: (activeId) => WAVE_MODEL_TABS.includes(activeId),
      isExpanded: (activeId) => WAVE_MODEL_TABS.includes(activeId),
      expandIcon: expandableIcon,
      children,
    };
  }

  if (item.id === ADMIN_TABS.USERS) {
    const children = [
      {
        id: ADMIN_TABS.USERS_LIST,
        label: 'User List',
        path: ADMIN_ROUTE_BY_TAB[ADMIN_TABS.USERS_LIST],
      },
      {
        id: ADMIN_TABS.USERS_ROLES,
        label: 'User Types & Permissions',
        path: ADMIN_ROUTE_BY_TAB[ADMIN_TABS.USERS_ROLES],
      },
    ].filter((child) => canAccessTab(rawUser, child.id));

    if (!children.length) return null;

    return {
      ...item,
      isActive: (activeId) => USER_TABS.includes(activeId),
      isExpanded: (activeId) => USER_TABS.includes(activeId),
      expandIcon: expandableIcon,
      children,
    };
  }

  return canAccessTab(rawUser, item.id) ? item : null;
};

const buildAdminSidebarGroups = (rawUser) =>
  MENU_GROUPS.map((group) => ({
    ...group,
    items: group.items.map((item) => enhanceAdminItem(item, rawUser)).filter(Boolean),
  })).filter((group) => group.items.length > 0);

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
  const { user, rawUser } = useCurrentDashboardUser();
  const adminSidebarGroups = useMemo(() => buildAdminSidebarGroups(rawUser), [rawUser]);

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
        label: 'Workspace',
      }}
      header={{
        accountSettingsPath: ADMIN_ROUTE_BY_TAB[ADMIN_TABS.ACCOUNT],
        description: activeMeta?.description,
        eyebrow: 'WaveLab Workspace',
        title: activeMeta?.title ?? 'Dashboard Overview',
        user,
      }}
    >
      {children}
    </DashboardShell>
  );
};

export default AdminShell;
