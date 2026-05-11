import { ChevronDown, Menu, Moon, Sun, Waves } from 'lucide-react';
import NotificationBell from '@/shared/notifications/NotificationBell';

const DashboardHeader = ({
  description,
  eyebrow,
  isDarkMode,
  onMobileMenuToggle,
  onThemeToggle,
  onUserClick,
  title,
  user,
}) => {
  const iconButtonClass = `h-9 w-9 rounded-xl flex items-center justify-center transition-colors ${
    isDarkMode
      ? 'text-gray-300 hover:bg-white/[0.06]'
      : 'text-slate-500 hover:bg-black/[0.04]'
  }`;

  return (
    <header
      className={`sticky top-0 z-30 bottom-accent relative border-b backdrop-blur-2xl transition-colors ${
        isDarkMode
          ? 'bg-[#0d1117]/85 border-white/[0.07]'
          : 'bg-white/85 border-black/[0.07]'
      }`}
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 5%, rgba(56,189,248,0.5) 40%, rgba(129,140,248,0.5) 60%, transparent 95%)',
        }}
      />

      <div className="flex h-16 items-center justify-between gap-2 px-3 sm:gap-3 sm:px-4 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onMobileMenuToggle}
            className={`shrink-0 rounded-xl p-2 transition-colors lg:hidden ${
              isDarkMode ? 'hover:bg-white/8 text-gray-400' : 'hover:bg-black/5 text-gray-500'
            }`}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>

          <div className="flex min-w-0 flex-1 flex-col gap-0.5 overflow-hidden">
            <div className="hidden items-center gap-1.5 min-[420px]:flex">
              <Waves size={11} className={`shrink-0 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} aria-hidden="true" />
              <span
                className={`truncate text-[10px] font-semibold tracking-[0.15em] uppercase ${
                  isDarkMode ? 'text-cyan-400/70' : 'text-cyan-600/80'
                }`}
              >
                {eyebrow}
              </span>
            </div>
            <h2
              className={`max-w-full truncate whitespace-nowrap text-base font-black leading-none tracking-tight sm:text-[1.35rem] ${
                isDarkMode ? 'text-gray-100' : 'text-slate-900'
              }`}
              title={title}
            >
              {title}
            </h2>
            {description && (
              <p
                className={`hidden max-w-xs truncate text-[11px] leading-none sm:block ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}
              >
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <div
            className={`flex items-center gap-0.5 rounded-2xl border px-0.5 py-1 sm:px-1 ${
              isDarkMode
                ? 'bg-white/[0.05] border-white/[0.08]'
                : 'bg-black/[0.03] border-black/[0.06]'
            }`}
          >
            <button
              type="button"
              onClick={onThemeToggle}
              className={iconButtonClass}
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun size={17} className="text-amber-300" /> : <Moon size={17} />}
            </button>

            <div className={`hidden h-5 w-px sm:block sm:mx-0.5 ${isDarkMode ? 'bg-white/10' : 'bg-black/8'}`} />

            <NotificationBell isDarkMode={isDarkMode} />
          </div>

          <div className={`hidden h-7 w-px sm:block ${isDarkMode ? 'bg-white/10' : 'bg-black/8'}`} />

          <button
            type="button"
            onClick={onUserClick}
            className={`flex shrink-0 items-center gap-2.5 rounded-2xl border p-1.5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] sm:pl-1.5 sm:pr-3 ${
              isDarkMode
                ? 'border-white/10 hover:border-white/18 hover:bg-white/[0.05]'
                : 'border-black/8 hover:border-black/14 hover:bg-black/[0.03]'
            }`}
            aria-haspopup="dialog"
          >
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-sm font-bold text-white">
              {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : user?.initials ?? 'WL'}
            </span>
            <span className="hidden text-left leading-none gap-0.5 sm:flex sm:flex-col">
              <span className={`text-sm font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                {user?.name ?? 'WaveLab User'}
              </span>
              <span className="text-[11px] font-semibold text-cyan-400">{user?.role ?? 'User'}</span>
            </span>
            <ChevronDown
              size={13}
              aria-hidden="true"
              className={`hidden sm:block ml-0.5 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}
            />
          </button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
