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

const FORECAST_TABS = [ADMIN_TABS.FORECAST_PACKAGES, ADMIN_TABS.FORECAST_REVIEW];
const USER_TABS = [ADMIN_TABS.USERS, ADMIN_TABS.USERS_LIST, ADMIN_TABS.USERS_ROLES];
const WAVE_MODEL_TABS = [
  ADMIN_TABS.WAVE_MODELS,
  ADMIN_TABS.WAVE_PIPELINE,
  ADMIN_TABS.WAVE_MODEL_ONBOARDING,
];
export const ACCOUNT_ITEM = {
  id: ADMIN_TABS.ACCOUNT,
  label: 'Account Settings',
  path: '/account',
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

const buildExpandableItem = (item, activeTabs, children) => {
  if (!children.length) return null;

  return {
    ...item,
    path: children[0].path,
    isActive: (activeId) => activeTabs.includes(activeId),
    isExpanded: (activeId) => activeTabs.includes(activeId),
    expandIcon: expandableIcon,
    children,
  };
};

const enhanceDashboardItem = (item, rawUser) => {
  if (item.id === ADMIN_TABS.FORECAST) {
    const children = [
      {
        id: ADMIN_TABS.FORECAST_PACKAGES,
        label: 'Forecast Packages',
        path: ADMIN_ROUTE_BY_TAB[ADMIN_TABS.FORECAST_PACKAGES],
      },
      {
        id: ADMIN_TABS.FORECAST_REVIEW,
        label: 'Review Queue',
        path: ADMIN_ROUTE_BY_TAB[ADMIN_TABS.FORECAST_REVIEW],
      },
    ].filter((child) => canAccessTab(rawUser, child.id));

    return buildExpandableItem(item, FORECAST_TABS, children);
  }

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

    return buildExpandableItem(item, WAVE_MODEL_TABS, children);
  }

  if (item.id === ADMIN_TABS.USERS) {
    const children = [
      {
        id: ADMIN_TABS.USERS_LIST,
        label: 'Users',
        path: ADMIN_ROUTE_BY_TAB[ADMIN_TABS.USERS_LIST],
      },
      {
        id: ADMIN_TABS.USERS_ROLES,
        label: 'User Types & Permissions',
        path: ADMIN_ROUTE_BY_TAB[ADMIN_TABS.USERS_ROLES],
      },
    ].filter((child) => canAccessTab(rawUser, child.id));

    return buildExpandableItem(item, USER_TABS, children);
  }

  return canAccessTab(rawUser, item.id) ? item : null;
};

export const buildDashboardSidebarGroups = (rawUser) =>
  MENU_GROUPS.map((group) => ({
    ...group,
    items: group.items.map((item) => enhanceDashboardItem(item, rawUser)).filter(Boolean),
  })).filter((group) => group.items.length > 0);

export default function OperationalDashboardShell({
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
}) {
  const { user, rawUser } = useCurrentDashboardUser();
  const sidebarGroups = useMemo(() => buildDashboardSidebarGroups(rawUser), [rawUser]);

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
        groups: sidebarGroups,
        utilityItems: [ACCOUNT_ITEM],
        label: 'Workspace',
      }}
      header={{
        accountSettingsPath: '/account',
        description: activeMeta?.description,
        eyebrow: 'WaveLab Workspace',
        title: activeMeta?.title ?? 'Dashboard Overview',
        user,
      }}
    >
      {children}
    </DashboardShell>
  );
}
