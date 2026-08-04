import { ShieldCheck, UserRound } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

import { useTheme } from '@/app/providers/ThemeProvider';

const ACCOUNT_LINKS = [
  {
    to: '/dashboard/account',
    end: true,
    label: 'Overview',
    icon: UserRound,
  },
  {
    to: '/dashboard/account/security',
    label: 'Security',
    icon: ShieldCheck,
  },
];

export default function AdminAccountLayout() {
  const { isDarkMode } = useTheme();

  return (
    <div className="min-h-full">
      <div
        className={`border-b ${
          isDarkMode ? 'border-white/10 bg-slate-950/15' : 'border-slate-200/70 bg-white/20'
        }`}
      >
        <nav
          aria-label="Administrator account settings"
          className="mx-auto flex max-w-7xl gap-6 px-6 lg:px-8"
        >
          {ACCOUNT_LINKS.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `relative inline-flex min-h-12 items-center gap-2 px-1 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 ${
                  isActive
                    ? isDarkMode
                      ? 'text-cyan-200'
                      : 'text-cyan-800'
                    : isDarkMode
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-500 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={15} aria-hidden="true" />
                  <span>{label}</span>
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className={`absolute inset-x-0 bottom-0 h-0.5 rounded-full ${
                        isDarkMode ? 'bg-cyan-300' : 'bg-cyan-600'
                      }`}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <Outlet />
    </div>
  );
}
