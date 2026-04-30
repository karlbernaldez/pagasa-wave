import { Bell, ChevronDown, Menu, Moon, Sun, Waves } from 'lucide-react';

const DashboardHeader = ({
  description,
  eyebrow,
  isDarkMode,
  notificationBadge,
  onMobileMenuToggle,
  onNotificationClick,
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

      <div className="px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onMobileMenuToggle}
            className={`lg:hidden p-2 rounded-xl transition-colors ${
              isDarkMode ? 'hover:bg-white/8 text-gray-400' : 'hover:bg-black/5 text-gray-500'
            }`}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>

          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-1.5">
              <Waves size={11} className={isDarkMode ? 'text-cyan-400' : 'text-cyan-600'} aria-hidden="true" />
              <span
                className={`text-[10px] font-semibold tracking-[0.15em] uppercase ${
                  isDarkMode ? 'text-cyan-400/70' : 'text-cyan-600/80'
                }`}
              >
                {eyebrow}
              </span>
            </div>
            <h2
              className={`text-[1.35rem] font-black leading-none tracking-tight ${
                isDarkMode ? 'text-gray-100' : 'text-slate-900'
              }`}
            >
              {title}
            </h2>
            {description && (
              <p
                className={`hidden sm:block text-[11px] leading-none mt-0.5 truncate max-w-xs ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}
              >
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-0.5 rounded-2xl px-1 py-1 border ${
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

            <div className={`w-px h-5 mx-0.5 ${isDarkMode ? 'bg-white/10' : 'bg-black/8'}`} />

            <button
              type="button"
              onClick={onNotificationClick}
              className={`relative ${iconButtonClass}`}
              aria-label="Notifications"
            >
              <Bell size={17} />
              {notificationBadge ? (
                <span className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full bg-red-500 px-1 text-[10px] font-bold leading-[18px] text-white">
                  {notificationBadge}
                </span>
              ) : null}
            </button>
          </div>

          <div className={`w-px h-7 ${isDarkMode ? 'bg-white/10' : 'bg-black/8'}`} />

          <button
            type="button"
            onClick={onUserClick}
            className={`flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-2xl border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
              isDarkMode
                ? 'border-white/10 hover:border-white/18 hover:bg-white/[0.05]'
                : 'border-black/8 hover:border-black/14 hover:bg-black/[0.03]'
            }`}
            aria-haspopup="dialog"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-sm font-bold text-white overflow-hidden">
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
