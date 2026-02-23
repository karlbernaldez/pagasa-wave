// ╔══════════════════════════════════════════════════════╗
// ║                      tabs.js                         ║
// ║  Tab config — add new pages here to auto-register    ║
// ╚══════════════════════════════════════════════════════╝
import { Settings, FileText } from 'lucide-react';

// ─── To add a new settings tab (e.g. Contact):
//   1. Add its default data to constants/defaults.js
//   2. Create its tab component in components/tabs/
//   3. Add an entry here — the rest auto-wires
// ──────────────────────────────────────────────────────
export const TABS = [
  {
    id:      'general',
    label:   'General',
    icon:    Settings,
    apiPage: null,          // null = localStorage only
  },
  {
    id:      'about',
    label:   'About Page',
    icon:    FileText,
    apiPage: 'about',       // maps to GET/PUT /api/settings/about
  },
  // Future:
  // { id: 'contact', label: 'Contact Page', icon: Mail, apiPage: 'contact' },
];