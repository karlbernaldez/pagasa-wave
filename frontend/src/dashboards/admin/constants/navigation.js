import { LayoutDashboard, Waves, Users, BarChart3, Settings, CalendarDays } from 'lucide-react';

export const ADMIN_TABS = {
  DASHBOARD: 'dashboard',
  CHARTS: 'charts',
  USERS: 'users',
  USERS_PENDING: 'users_pending',
  USERS_EXISTING: 'users_existing',
  ANALYTICS: 'analytics',
  CALENDAR: 'calendar',
  SETTINGS: 'settings',
};

export const MENU_ITEMS = [
  { id: ADMIN_TABS.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { id: ADMIN_TABS.CHARTS, label: 'Review Charts', icon: Waves },
  { id: ADMIN_TABS.USERS, label: 'Users', icon: Users },
  { id: ADMIN_TABS.ANALYTICS, label: 'Analytics', icon: BarChart3 },
  { id: ADMIN_TABS.CALENDAR, label: 'Calendar', icon: CalendarDays },
  { id: ADMIN_TABS.SETTINGS, label: 'Settings', icon: Settings },
];

export const PAGE_META = {
  [ADMIN_TABS.DASHBOARD]: {
    title: 'Dashboard Overview',
    description: 'Monitor submissions and approve forecasts',
  },
  [ADMIN_TABS.CHARTS]: {
    title: 'Wave Charts Review',
    description: 'Review and approve submitted wave forecast charts',
  },
  [ADMIN_TABS.USERS]: {
    title: 'User Management',
    description: 'Manage Forecasters, Admins, and other user roles',
  },
  [ADMIN_TABS.USERS_PENDING]: {
    title: 'Pending User Requests',
    description: 'Review and approve account requests from new users',
  },
  [ADMIN_TABS.USERS_EXISTING]: {
    title: 'Existing Users',
    description: 'Maintain active user records and update permissions',
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
