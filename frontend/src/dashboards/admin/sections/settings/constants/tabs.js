// ╔══════════════════════════════════════════════════════╗
// ║                      tabs.js                         ║
// ║  Tab config — add new pages here to auto-register    ║
// ╚══════════════════════════════════════════════════════╝
import { FileText, LayoutDashboard, Mail, Settings, ShieldCheck, Workflow } from 'lucide-react';

export const TABS = [
  {
    id: 'operations',
    label: 'Forecast Operations',
    icon: Workflow,
    group: 'Operations',
    apiPage: null,
  },
  {
    id: 'forecasterWorkspace',
    label: 'Forecaster Workspace',
    icon: LayoutDashboard,
    group: 'Forecaster Dashboard',
    apiPage: null,
  },
  {
    id: 'adminReview',
    label: 'Admin Review',
    icon: ShieldCheck,
    group: 'Admin Dashboard',
    apiPage: null,
  },
  {
    id: 'general',
    label: 'General',
    icon: Settings,
    group: 'Public Site',
    apiPage: null,
  },
  {
    id: 'about',
    label: 'About Page',
    icon: FileText,
    group: 'Public Site',
    apiPage: 'about',
  },
  {
    id: 'contact',
    label: 'Contact Page',
    icon: Mail,
    group: 'Public Site',
    apiPage: 'contact',
  },
];