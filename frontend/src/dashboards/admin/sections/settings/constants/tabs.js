import {
  FileText,
  LayoutDashboard,
  Mail,
  MapPinned,
  Settings,
  ShieldCheck,
  Workflow,
} from 'lucide-react';

export const SETTINGS_GROUPS = [
  {
    id: 'forecastOperations',
    label: 'Forecast Operations',
    description: 'Operational timing, package windows, archive policy, and no-publication options.',
  },
  {
    id: 'forecasterWorkspace',
    label: 'Forecaster Workspace',
    description:
      'Helper copy, workspace defaults, collaboration reminders, map defaults, and forecaster-facing guidance.',
  },
  {
    id: 'adminReview',
    label: 'Admin Review',
    description: 'Review SLA targets and admin-facing package resolution settings.',
  },
  {
    id: 'publicSite',
    label: 'Public Site',
    description: 'Public dashboard branding, About page content, and Contact page content.',
  },
];

export const TABS = [
  {
    id: 'operations',
    label: 'Schedule & Policy',
    icon: Workflow,
    group: 'forecastOperations',
    apiPage: null,
    viewPermission: 'settings_schedule.view',
    managePermission: 'settings_schedule.manage',
  },
  {
    id: 'forecasterWorkspace',
    label: 'Workspace Defaults',
    icon: LayoutDashboard,
    group: 'forecasterWorkspace',
    apiPage: null,
    viewPermission: 'settings_workspace.view',
    managePermission: 'settings_workspace.manage',
  },
  {
    id: 'mapView',
    label: 'Map View',
    icon: MapPinned,
    group: 'forecasterWorkspace',
    apiPage: 'mapview',
    viewPermission: 'settings_map_view.view',
    managePermission: 'settings_map_view.manage',
  },
  {
    id: 'adminReview',
    label: 'Review Targets',
    icon: ShieldCheck,
    group: 'adminReview',
    apiPage: null,
    viewPermission: 'settings_review_targets.view',
    managePermission: 'settings_review_targets.manage',
  },
  {
    id: 'general',
    label: 'General',
    icon: Settings,
    group: 'publicSite',
    apiPage: null,
    viewPermission: 'settings_public_general.view',
    managePermission: 'settings_public_general.manage',
  },
  {
    id: 'about',
    label: 'About Page',
    icon: FileText,
    group: 'publicSite',
    apiPage: 'about',
    viewPermission: 'settings_public_about.view',
    managePermission: 'settings_public_about.manage',
  },
  {
    id: 'contact',
    label: 'Contact Page',
    icon: Mail,
    group: 'publicSite',
    apiPage: 'contact',
    viewPermission: 'settings_public_contact.view',
    managePermission: 'settings_public_contact.manage',
  },
];
