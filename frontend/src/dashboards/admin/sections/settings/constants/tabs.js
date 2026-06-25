import { FileText, LayoutDashboard, Mail, Settings, ShieldCheck, Workflow } from 'lucide-react';

export const SETTINGS_GROUPS = [
  {
    id: 'forecastOperations',
    label: 'Forecast Operations',
    description: 'Operational timing, package windows, archive policy, and no-publication options.',
  },
  {
    id: 'forecasterWorkspace',
    label: 'Forecaster Workspace',
    description: 'Helper copy, workspace defaults, collaboration reminders, and forecaster-facing guidance.',
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
  },
  {
    id: 'forecasterWorkspace',
    label: 'Workspace Defaults',
    icon: LayoutDashboard,
    group: 'forecasterWorkspace',
    apiPage: null,
  },
  {
    id: 'adminReview',
    label: 'Review Targets',
    icon: ShieldCheck,
    group: 'adminReview',
    apiPage: null,
  },
  {
    id: 'general',
    label: 'General',
    icon: Settings,
    group: 'publicSite',
    apiPage: null,
  },
  {
    id: 'about',
    label: 'About Page',
    icon: FileText,
    group: 'publicSite',
    apiPage: 'about',
  },
  {
    id: 'contact',
    label: 'Contact Page',
    icon: Mail,
    group: 'publicSite',
    apiPage: 'contact',
  },
];
