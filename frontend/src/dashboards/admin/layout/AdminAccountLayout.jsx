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
      <div className="mx-auto flex max-w-4xl justify-end px-4 pt-5 sm:px-6 lg:px-8">
        <nav
          aria-label="Administrator account settings"
          className={`inline-flex w-full rounded-xl border p-1 backdrop-blur-3xl sm:w-auto ${
            isDarkMode
              ? 'border-white/10 bg-slate-950/45 shadow-[0_14px_34px_rgba(0,0,0,0.22)]'
              : 'border-white/85 bg-white/65 shadow-[0_14px_34px_rgba(15,23,42,0.10)]'
          }`}
        >
          {ACCOUNT_LINKS.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg px-4 text-sm font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:flex-none ${
                  isActive
                    ? isDarkMode
                      ? 'bg-cyan-400/14 text-cyan-100 shadow-sm'
                      : 'bg-white text-cyan-800 shadow-sm'
                    : isDarkMode
                      ? 'text-slate-400 hover:bg-white/[0.05] hover:text-white'
                      : 'text-slate-500 hover:bg-white/70 hover:text-slate-900'
                }`
              }
            >
              <Icon size={15} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <Outlet />
    </div>
  );
}
