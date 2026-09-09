import {
  LayoutDashboard,
  Waves,
  Users,
  BarChart3,
  Settings,
  CalendarDays,
  Database,
} from 'lucide-react';

export const ADMIN_TABS = {
  DASHBOARD: 'dashboard',
  CHARTS: 'charts',
  WAVE_MODELS: 'wave_models',
  WAVE_PIPELINE: 'wave_pipeline',
  WAVE_MODEL_ONBOARDING: 'wave_model_onboarding',
  USERS: 'users',
  USERS_LIST: 'users_list',
  USERS_ROLES: 'users_roles',
  ANALYTICS: 'analytics',
  CALENDAR: 'calendar',
  SETTINGS: 'settings',
  ACCOUNT: 'account',
};

export const ADMIN_ROUTE_BY_TAB = {
  [ADMIN_TABS.DASHBOARD]: '/dashboard',
  [ADMIN_TABS.CHARTS]: '/dashboard/review',
  [ADMIN_TABS.WAVE_MODELS]: '/dashboard/wave-models',
  [ADMIN_TABS.WAVE_PIPELINE]: '/dashboard/wave-models/pipeline',
  [ADMIN_TABS.WAVE_MODEL_ONBOARDING]: '/dashboard/wave-models/onboard',
  [ADMIN_TABS.USERS]: '/dashboard/users',
  [ADMIN_TABS.USERS_LIST]: '/dashboard/users',
  [ADMIN_TABS.USERS_ROLES]: '/dashboard/users/roles',
  [ADMIN_TABS.ANALYTICS]: '/dashboard/analytics',
  [ADMIN_TABS.CALENDAR]: '/dashboard/calendar',
  [ADMIN_TABS.SETTINGS]: '/dashboard/settings',
  [ADMIN_TABS.ACCOUNT]: '/dashboard/account',
};

export const ADMIN_PERMISSION_BY_TAB = Object.freeze({
  [ADMIN_TABS.DASHBOARD]: 'dashboard.view',
  [ADMIN_TABS.CHARTS]: 'forecast.review',
  [ADMIN_TABS.WAVE_MODELS]: 'wave_models.manage',
  [ADMIN_TABS.WAVE_PIPELINE]: 'wave_pipeline.view',
  [ADMIN_TABS.WAVE_MODEL_ONBOARDING]: 'model_onboarding.view',
  [ADMIN_TABS.USERS]: 'users.view',
  [ADMIN_TABS.USERS_LIST]: 'users.view',
  [ADMIN_TABS.USERS_ROLES]: 'roles.view',
  [ADMIN_TABS.ANALYTICS]: 'analytics.view',
  [ADMIN_TABS.SETTINGS]: 'settings.view',
});

export const ADMIN_TAB_BY_ROUTE = Object.entries(ADMIN_ROUTE_BY_TAB).reduce(
  (routes, [tab, path]) => ({
    ...routes,
    [path]: tab,
  }),
  {}
);

export function getAdminRouteForTab(tab) {
  return ADMIN_ROUTE_BY_TAB[tab] ?? ADMIN_ROUTE_BY_TAB[ADMIN_TABS.DASHBOARD];
}

export function getAdminTabForPath(pathname) {
  if (
    pathname === ADMIN_ROUTE_BY_TAB[ADMIN_TABS.ACCOUNT] ||
    pathname.startsWith('/dashboard/account/')
  ) {
    return ADMIN_TABS.ACCOUNT;
  }

  return ADMIN_TAB_BY_ROUTE[pathname] ?? ADMIN_TABS.DASHBOARD;
}

export const MENU_GROUPS = [
  {
    label: 'Review',
    items: [
      {
        id: ADMIN_TABS.DASHBOARD,
        label: 'Overview',
        path: ADMIN_ROUTE_BY_TAB[ADMIN_TABS.DASHBOARD],
        icon: LayoutDashboard,
      },
      {
        id: ADMIN_TABS.CHARTS,
        label: 'Forecast Packages',
        path: ADMIN_ROUTE_BY_TAB[ADMIN_TABS.CHARTS],
        icon: Waves,
      },
    ],
  },
  {
    label: 'Management',
    items: [
      {
        id: ADMIN_TABS.WAVE_MODELS,
        label: 'Wave Models',
        path: ADMIN_ROUTE_BY_TAB[ADMIN_TABS.WAVE_MODELS],
        icon: Database,
      },
      {
        id: ADMIN_TABS.USERS,
        label: 'Users',
        path: ADMIN_ROUTE_BY_TAB[ADMIN_TABS.USERS],
        icon: Users,
      },
    ],
  },
  {
    label: 'System',
    items: [
      {
        id: ADMIN_TABS.ANALYTICS,
        label: 'Analytics',
        path: ADMIN_ROUTE_BY_TAB[ADMIN_TABS.ANALYTICS],
        icon: BarChart3,
      },
      {
        id: ADMIN_TABS.CALENDAR,
        label: 'Calendar',
        path: ADMIN_ROUTE_BY_TAB[ADMIN_TABS.CALENDAR],
        icon: CalendarDays,
      },
      {
        id: ADMIN_TABS.SETTINGS,
        label: 'System Settings',
        path: ADMIN_ROUTE_BY_TAB[ADMIN_TABS.SETTINGS],
        icon: Settings,
      },
    ],
  },
];

export const MENU_ITEMS = MENU_GROUPS.flatMap((group) => group.items);

export const PAGE_META = {
  [ADMIN_TABS.DASHBOARD]: {
    title: 'Dashboard Overview',
    description:
      "Monitor today's forecast package workflow, operational users, and publication readiness.",
  },
  [ADMIN_TABS.CHARTS]: {
    title: 'Review Forecast Packages',
    description:
      "Prioritize today's analysis and forecast charts while keeping approved, rejected, and past packages available.",
  },
  [ADMIN_TABS.WAVE_MODELS]: {
    title: 'Wave Model Management',
    description:
      'Manage operational wave models, source-cycle policy, generated packages, and future model definitions.',
  },
  [ADMIN_TABS.WAVE_PIPELINE]: {
    title: 'Wave Data Pipeline',
    description:
      'Monitor WW3 and ECWAM source readiness, normalized processing, validation, and publication status.',
  },
  [ADMIN_TABS.WAVE_MODEL_ONBOARDING]: {
    title: 'Wave Model Onboarding',
    description:
      'Configure runtime cadence and map metadata for additional managed wave model packages.',
  },
  [ADMIN_TABS.USERS]: {
    title: 'User Management',
    description: 'Manage user accounts, User Types, permissions, and access status.',
  },
  [ADMIN_TABS.USERS_LIST]: {
    title: 'User List',
    description: 'View, approve, suspend, and manage operational user accounts.',
  },
  [ADMIN_TABS.USERS_ROLES]: {
    title: 'User Types & Permissions',
    description: 'Manage permission bundles for WaveLab User Types.',
  },
  [ADMIN_TABS.ANALYTICS]: {
    title: 'Operational Analytics',
    description: 'Track review throughput, forecast chart status, and user readiness.',
  },
  [ADMIN_TABS.CALENDAR]: {
    title: 'Forecast Operations Calendar',
    description: 'Track forecast package dates, review events, and publication milestones.',
  },
  [ADMIN_TABS.SETTINGS]: {
    title: 'System Settings',
    description:
      'Configure WaveLab public content, contact information, and other system-wide settings.',
  },
  [ADMIN_TABS.ACCOUNT]: {
    title: 'Account Settings',
    description: 'Review and update your profile, sessions, and account security.',
  },
};
