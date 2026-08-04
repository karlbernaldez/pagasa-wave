import { ShieldCheck, UserRound } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

import { useTheme } from '@/app/providers/ThemeProvider';

const ACCOUNT_LINKS = [
  {
    to: '/account',
    end: true,
    label: 'Profile',
    description: 'Personal and professional details',
    icon: UserRound,
  },
  {
    to: '/account/security',
    label: 'Security',
    description: 'Sessions and account protection',
    icon: ShieldCheck,
  },
];

export default function AccountLayout() {
  const { isDarkMode } = useTheme();

  return (
    <div className="min-h-full">
      <nav
        aria-label="Account settings"
        className={`mx-auto mt-5 flex max-w-4xl flex-col gap-2 rounded-2xl border p-2 backdrop-blur-3xl sm:flex-row ${
          isDarkMode
            ? 'border-white/10 bg-slate-950/45 shadow-[0_18px_50px_rgba(0,0,0,0.24)]'
            : 'border-white/85 bg-white/65 shadow-[0_18px_50px_rgba(15,23,42,0.10)]'
        }`}
      >
        {ACCOUNT_LINKS.map(({ to, end, label, description, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex min-h-14 flex-1 items-center gap-3 rounded-xl border px-4 py-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                isActive
                  ? isDarkMode
                    ? 'border-cyan-300/30 bg-cyan-400/12 text-cyan-100'
                    : 'border-cyan-200 bg-cyan-50/90 text-cyan-800'
                  : isDarkMode
                    ? 'border-transparent text-slate-300 hover:bg-white/[0.05] hover:text-white'
                    : 'border-transparent text-slate-600 hover:bg-white/80 hover:text-slate-900'
              }`
            }
          >
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                isDarkMode ? 'bg-white/[0.06]' : 'bg-white/80'
              }`}
            >
              <Icon size={17} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-black">{label}</span>
              <span
                className={`mt-0.5 block truncate text-xs font-semibold ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                {description}
              </span>
            </span>
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
