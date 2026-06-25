// ╔══════════════════════════════════════════════════════╗
// ║                      tabs.js                         ║
// ║  Tab config — add new pages here to auto-register    ║
// ╚══════════════════════════════════════════════════════╝
import { FileText, Mail, Settings, Workflow } from 'lucide-react';

// ─── To add a new settings tab:
//   1. Add its default data to constants/defaults.js
//   2. Create its tab component in components/tabs/
//   3. Add an entry here — the rest auto-wires
// ──────────────────────────────────────────────────────
export const TABS = [
  {
    id: 'operations',
    label: 'Forecast Operations',
    icon: Workflow,
    apiPage: null,
  },
  {
    id: 'general',
    label: 'General',
    icon: Settings,
    apiPage: null,
  },
  {
    id: 'about',
    label: 'About Page',
    icon: FileText,
    apiPage: 'about',
  },
  {
    id: 'contact',
    label: 'Contact Page',
    icon: Mail,
    apiPage: 'contact',
  },
];