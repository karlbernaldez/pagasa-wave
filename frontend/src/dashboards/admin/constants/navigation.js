import { LayoutDashboard, Waves, Users, BarChart3, Settings, CalendarDays } from 'lucide-react';

export const ADMIN_TABS = {
  DASHBOARD: 'dashboard',
  CHARTS: 'charts',
  USERS: 'users',
  USERS_LIST: 'users_list',
  USERS_ROLES: 'users_roles',
  ANALYTICS: 'analytics',
  CALENDAR: 'calendar',
  SETTINGS: 'settings',
};

export const ADMIN_ROUTE_BY_TAB = {
  [ADMIN_TABS.DASHBOARD]: '/dashboard',
  [ADMIN_TABS.CHARTS]: '/dashboard/review',
  [ADMIN_TABS.USERS]: '/dashboard/users',
  [ADMIN_TABS.USERS_LIST]: '/dashboard/users',
  [ADMIN_TABS.USERS_ROLES]: '/dashboard/users/roles',
  [ADMIN_TABS.ANALYTICS]: '/dashboard/analytics',
  [ADMIN_TABS.CALENDAR]: '/dashboard/calendar',
  [ADMIN_TABS.SETTINGS]: '/dashboard/settings',
};

export const ADMIN_TAB_BY_ROUTE = Object.entries(ADMIN_ROUTE_BY_TAB).reduce(
  (routes, [tab, path]) => ({
    ...routes,
    [path]: tab,
  }),
  {},
);

export function getAdminRouteForTab(tab) {
  return ADMIN_ROUTE_BY_TAB[tab] ?? ADMIN_ROUTE_BY_TAB[ADMIN_TABS.DASHBOARD];
}

export function getAdminTabForPath(pathname) {
  return ADMIN_TAB_BY_ROUTE[pathname] ?? ADMIN_TABS.DASHBOARD;
}

export const MENU_GROUPS = [
  {
    label: 'Review',
    items: [
      { id: ADMIN_TABS.DASHBOARD, label: 'Overview', path: ADMIN_ROUTE_BY_TAB[ADMIN_TABS.DASHBOARD], icon: LayoutDashboard },
      { id: ADMIN_TABS.CHARTS, label: 'Forecast Packages', path: ADMIN_ROUTE_BY_TAB[ADMIN_TABS.CHARTS], icon: Waves },
    ],
  },
  {
    label: 'Management',
    items: [
      { id: ADMIN_TABS.USERS, label: 'Users', path: ADMIN_ROUTE_BY_TAB[ADMIN_TABS.USERS], icon: Users },
    ],
  },
  {
    label: 'System',
    items: [
      { id: ADMIN_TABS.ANALYTICS, label: 'Analytics', path: ADMIN_ROUTE_BY_TAB[ADMIN_TABS.ANALYTICS], icon: BarChart3 },
      { id: ADMIN_TABS.CALENDAR, label: 'Calendar', path: ADMIN_ROUTE_BY_TAB[ADMIN_TABS.CALENDAR], icon: CalendarDays },
      { id: ADMIN_TABS.SETTINGS, label: 'Settings', path: ADMIN_ROUTE_BY_TAB[ADMIN_TABS.SETTINGS], icon: Settings },
    ],
  },
];

export const MENU_ITEMS = MENU_GROUPS.flatMap((group) => group.items);

export const PAGE_META = {
  [ADMIN_TABS.DASHBOARD]: {
    title: 'Dashboard Overview',
    description: 'Monitor submissions and approve forecasts',
  },
  [ADMIN_TABS.CHARTS]: {
    title: 'Review Forecast Packages',
    description: 'Prioritize today\'s daily forecast package while keeping approved, rejected, and past packages available.',
  },
  [ADMIN_TABS.USERS]: {
    title: 'User Management',
    description: 'Manage Forecasters, Admins, and other user roles',
  },
  [ADMIN_TABS.USERS_LIST]: {
    title: 'User List',
    description: 'View and manage all user accounts and access statuses',
  },
  [ADMIN_TABS.USERS_ROLES]: {
    title: 'Roles & Permissions',
    description: 'Configure available roles and access levels',
  },
  [ADMIN_TABS.ANALYTICS]: {
    title: 'Analytics & Reports',
    description: 'View detailed analytics and performance metrics',
  },
  [ADMIN_TABS.CALENDAR]: {
    title: 'Team Calendar',
    description: 'Track publication schedules, reviews, and admin events',
  },
  [ADMIN_TABS.SETTINGS]: {
    title: 'Settings & Configuration',
    description: 'Configure system settings and preferences',
  },
};
