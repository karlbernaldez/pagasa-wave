import {
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  Mail,
  MapPinned,
  Settings,
  Workflow,
} from 'lucide-react';

export const SETTINGS_GROUPS = [
  {
    id: 'forecastOperations',
    label: 'Forecast Operations',
    description:
      'Operational submission, publication, cutoff timing, and forecaster deadline reminders.',
  },
  {
    id: 'forecasterWorkspace',
    label: 'Forecaster Workspace',
    description:
      'Forecaster workspace copy, collaboration guidance, QA reminders, and Studio map defaults.',
  },
  {
    id: 'adminReview',
    label: 'Admin Review',
    description:
      'Versioned operational review checklist configuration and package review controls.',
  },
  {
    id: 'publicSite',
    label: 'Public Site',
    description:
      'Published chart presentation, public map bounds, About content, and Contact content.',
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
    id: 'reviewChecklist',
    label: 'Review Checklist',
    icon: ClipboardCheck,
    group: 'adminReview',
    apiPage: null,
    viewPermission: 'settings_review_checklist.view',
    managePermission: 'settings_review_checklist.manage',
    standaloneSave: true,
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
