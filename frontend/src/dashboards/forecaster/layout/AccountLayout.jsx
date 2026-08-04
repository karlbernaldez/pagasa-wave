import { ShieldCheck, UserRound } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

import { useTheme } from '@/app/providers/ThemeProvider';

const ACCOUNT_LINKS = [
  {
    to: '/account',
    end: true,
    label: 'Overview',
    icon: UserRound,
  },
  {
    to: '/account/security',
    label: 'Security',
    icon: ShieldCheck,
  },
];

export default function AccountLayout() {
  const { isDarkMode } = useTheme();

  return (
    <div className="min-h-full">
      <div className="mx-auto flex max-w-7xl justify-end px-4 pt-5 sm:px-6 lg:px-8">
        <nav
          aria-label="Account sections"
          className={`inline-flex w-full items-center gap-1 rounded-xl border p-1.5 backdrop-blur-2xl sm:w-auto ${
            isDarkMode
              ? 'border-white/10 bg-slate-950/45 shadow-[0_14px_36px_rgba(0,0,0,0.2)]'
              : 'border-white/90 bg-white/72 shadow-[0_14px_36px_rgba(15,23,42,0.08)]'
          }`}
        >
          {ACCOUNT_LINKS.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg px-4 text-sm font-extrabold transition sm:flex-none ${
                  isActive
                    ? isDarkMode
                      ? 'bg-cyan-400/14 text-cyan-100 shadow-[inset_0_0_0_1px_rgba(103,232,249,0.24)]'
                      : 'bg-cyan-50 text-cyan-800 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.28)]'
                    : isDarkMode
                      ? 'text-slate-400 hover:bg-white/[0.05] hover:text-white'
                      : 'text-slate-500 hover:bg-white hover:text-slate-900'
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300`
              }
            >
              <Icon size={16} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <Outlet />
    </div>
  );
}
