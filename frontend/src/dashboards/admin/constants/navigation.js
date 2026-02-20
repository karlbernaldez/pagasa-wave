import { LayoutDashboard, Waves, Users, BarChart3, Settings } from 'lucide-react';

export const ADMIN_TABS = {
  DASHBOARD: 'dashboard',
  CHARTS: 'charts',
  USERS: 'users',
  ANALYTICS: 'analytics',
  SETTINGS: 'settings',
};

export const MENU_ITEMS = [
  { id: ADMIN_TABS.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { id: ADMIN_TABS.CHARTS, label: 'Review Charts', icon: Waves },
  { id: ADMIN_TABS.USERS, label: 'Users', icon: Users },
  { id: ADMIN_TABS.ANALYTICS, label: 'Analytics', icon: BarChart3 },
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
  [ADMIN_TABS.ANALYTICS]: {
    title: 'Analytics & Reports',
    description: 'View detailed analytics and performance metrics',
  },
  [ADMIN_TABS.SETTINGS]: {
    title: 'Settings & Configuration',
    description: 'Configure system settings and preferences',
  },
};
