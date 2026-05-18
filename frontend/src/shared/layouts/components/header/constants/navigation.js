import { Wind, Activity, Eye } from 'lucide-react';

/**
 * Primary navigation items.
 * `hasDropdown` signals that this item renders a submenu (e.g. chart-style picker).
 */
export const NAV_ITEMS = [
  { name: 'Home', href: '/' },
  { name: 'Wave Charts', href: '/charts', hasDropdown: true },
  { name: 'About', href: '/about-us' },
  { name: 'Contact', href: '/contact' },
];

/**
 * Chart-style options rendered inside the Wave Charts dropdown.
 * Keep icon references here so the dropdown component stays declarative.
 */
export const CHART_TYPES = [
  {
    id: 'wave-wind',
    name: 'Wave & Wind',
    icon: Wind,
    description: 'Combined wave and wind analysis',
    color: 'text-blue-400',
  },
  {
    id: 'wave-only',
    name: 'Wave Only',
    icon: Activity,
    description: 'Pure wave height analysis',
    color: 'text-cyan-400',
  },
  {
    id: 'visually-impaired',
    name: 'Accessible',
    icon: Eye,
    description: 'High contrast charts for accessibility',
    color: 'text-emerald-400',
  },
];
