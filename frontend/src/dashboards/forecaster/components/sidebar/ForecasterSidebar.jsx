import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Box,
  CircleHelp,
  CloudSun,
  FolderKanban,
  Map,
  RadioTower,
  Settings,
  Waves,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Project Library', path: '/studio', icon: FolderKanban },
  { label: 'Models', path: '/studio?section=models', icon: Box, disabled: true },
  { label: 'Observations', path: '/studio?section=observations', icon: CloudSun, disabled: true },
  { label: 'Nowcast', path: '/studio?section=nowcast', icon: RadioTower, disabled: true },
  { label: 'Analytics', path: '/studio?section=analytics', icon: BarChart3, disabled: true },
  { label: 'Map Viewer', path: '/studio?section=map-viewer', icon: Map, disabled: true },
  { label: 'Report Builder', path: '/pdf', icon: Waves, disabled: true },
  { label: 'Settings', path: '/profile', icon: Settings },
];

export default function ForecasterSidebar() {
  return (
    <aside className="hidden lg:flex w-[280px] shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-[72px] items-center gap-3 border-b border-slate-200 px-6">
        <img
          src="/pagasa-logo.png"
          alt="PAGASA"
          className="h-11 w-11 object-contain"
        />
        <div className="leading-tight">
          <p className="text-2xl font-black tracking-tight text-blue-700">PAGASA</p>
          <p className="text-[10px] font-semibold text-slate-500">The Weather and Climate Authority</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-8">
        {NAV_ITEMS.map(({ label, path, icon: Icon, disabled }) => {
          if (disabled) {
            return (
              <button
                key={label}
                type="button"
                disabled
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-slate-500 opacity-80"
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{label}</span>
              </button>
            );
          }

          return (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-blue-700'
                }`
              }
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="space-y-5 border-t border-slate-200 p-5">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <span className="inline-flex items-center gap-3">
            <CircleHelp size={18} />
            Help & Support
          </span>
          <span className="text-lg leading-none">›</span>
        </button>

        <div className="flex items-start gap-3 text-[11px] font-semibold leading-snug text-slate-500">
          <img
            src="/pagasa-logo.png"
            alt=""
            className="h-9 w-9 object-contain"
            aria-hidden="true"
          />
          <p>Philippine Atmospheric, Geophysical and Astronomical Services Administration</p>
        </div>
      </div>
    </aside>
  );
}
