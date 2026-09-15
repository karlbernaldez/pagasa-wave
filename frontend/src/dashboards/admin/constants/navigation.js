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
  FORECAST: 'forecast',
  FORECAST_PACKAGES: 'forecast_packages',
  FORECAST_REVIEW: 'forecast_review',
  // Backward-compatible alias for legacy dashboard actions that open review.
  CHARTS: 'forecast_review',
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
  [ADMIN_TABS.FORECAST_PACKAGES]: '/forecasts',
  [ADMIN_TABS.FORECAST_REVIEW]: '/forecasts/review',
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
  [ADMIN_TABS.FORECAST_PACKAGES]: 'forecast.view',
  [ADMIN_TABS.FORECAST_REVIEW]: 'forecast.review',
  [ADMIN_TABS.WAVE_MODELS]: 'wave_models.manage',
  [ADMIN_TABS.WAVE_PIPELINE]: 'wave_pipeline.view',
  [ADMIN_TABS.WAVE_MODEL_ONBOARDING]: 'model_onboarding.view',
  [ADMIN_TABS.USERS]: 'users.view',
  [ADMIN_TABS.USERS_LIST]: 'users.view',
  [ADMIN_TABS.USERS_ROLES]: 'roles.view',
  [ADMIN_TABS.CALENDAR]: 'calendar.view',
});

export const ADMIN_ANY_PERMISSION_BY_TAB = Object.freeze({
  [ADMIN_TABS.ANALYTICS]: [
    'analytics_forecast.view',
    'analytics_users.view',
    'analytics_system.view',
  ],
  [ADMIN_TABS.SETTINGS]: [
    'settings_schedule.view',
    'settings_workspace.view',
    'settings_map_view.view',
    'settings_review_targets.view',
    'settings_public_general.view',
    'settings_public_about.view',
    'settings_public_contact.view',
  ],
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
  if (pathname === ADMIN_ROUTE_BY_TAB[ADMIN_TABS.FORECAST_REVIEW]) {
    return ADMIN_TABS.FORECAST_REVIEW;
  }

  if (
    pathname === ADMIN_ROUTE_BY_TAB[ADMIN_TABS.FORECAST_PACKAGES] ||
    pathname.startsWith('/forecasts/')
  ) {
    return ADMIN_TABS.FORECAST_PACKAGES;
  }

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
    label: 'Workspace',
    items: [
      {
        id: ADMIN_TABS.DASHBOARD,
        label: 'Dashboard',
        path: ADMIN_ROUTE_BY_TAB[ADMIN_TABS.DASHBOARD],
        icon: LayoutDashboard,
      },
      {
        id: ADMIN_TABS.FORECAST,
        label: 'Forecast',
        icon: Waves,
      },
      {
        id: ADMIN_TABS.WAVE_MODELS,
        label: 'Models',
        path: ADMIN_ROUTE_BY_TAB[ADMIN_TABS.WAVE_MODELS],
        icon: Database,
      },
    ],
  },
  {
    label: 'Management',
    items: [
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
        label: 'Settings',
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
      "Monitor today's forecast package workflow, wave-model readiness, and publication status.",
  },
  [ADMIN_TABS.FORECAST_PACKAGES]: {
    title: 'Forecast Packages',
    description: 'Browse available forecast packages and continue operational forecasting work.',
  },
  [ADMIN_TABS.FORECAST_REVIEW]: {
    title: 'Review Queue',
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
      'Monitor configured wave-model source readiness, normalized processing, validation, and publication status.',
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
    description:
      'Track forecast operations, user activity, and system readiness by granted capability.',
  },
  [ADMIN_TABS.CALENDAR]: {
    title: 'Forecast Operations Calendar',
    description: 'Track forecast package dates, review events, and publication milestones.',
  },
  [ADMIN_TABS.SETTINGS]: {
    title: 'System Settings',
    description: 'Configure only the WaveLab settings work areas granted to your User Type.',
  },
  [ADMIN_TABS.ACCOUNT]: {
    title: 'Account Settings',
    description: 'Review and update your profile, sessions, and account security.',
  },
};
