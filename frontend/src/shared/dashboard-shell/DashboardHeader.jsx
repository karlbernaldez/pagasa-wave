import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, LogOut, Menu, Moon, Settings, Sun, UserRound, Waves } from 'lucide-react';
import NotificationBell from '@/shared/notifications/NotificationBell';
import { logoutUser } from '@/api/auth';

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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const iconButtonClass = `h-9 w-9 rounded-xl flex items-center justify-center transition-colors ${
    isDarkMode
      ? 'text-gray-300 hover:bg-white/[0.06]'
      : 'text-slate-500 hover:bg-black/[0.04]'
  }`;

  const closeUserMenu = useCallback(() => setIsUserMenuOpen(false), []);

  useEffect(() => {
    if (!isUserMenuOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeUserMenu();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeUserMenu, isUserMenuOpen]);

  const handleUserButtonClick = useCallback(() => {
    if (onUserClick) {
      onUserClick();
      return;
    }

    setIsUserMenuOpen((current) => !current);
  }, [onUserClick]);

  const handleLogout = useCallback(async () => {
    closeUserMenu();
    await logoutUser();
  }, [closeUserMenu]);

  return (
    <header
      className={`sticky top-0 z-50 bottom-accent relative border-b backdrop-blur-2xl transition-colors ${
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

          <div className="relative">
            <button
              type="button"
              onClick={handleUserButtonClick}
              className={`flex shrink-0 items-center gap-2.5 rounded-2xl border p-1.5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] sm:pl-1.5 sm:pr-3 ${
                isDarkMode
                  ? 'border-white/10 hover:border-white/18 hover:bg-white/[0.05]'
                  : 'border-black/8 hover:border-black/14 hover:bg-black/[0.03]'
              }`}
              aria-haspopup="menu"
              aria-expanded={isUserMenuOpen}
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
                className={`hidden sm:block ml-0.5 transition-transform ${isDarkMode ? 'text-gray-600' : 'text-gray-400'} ${isUserMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isUserMenuOpen && !onUserClick && (
              <>
                <button
                  type="button"
                  aria-label="Close user menu"
                  className="fixed inset-0 z-40 cursor-default bg-transparent"
                  onClick={closeUserMenu}
                />

                <div
                  role="menu"
                  aria-label="User menu"
                  className={`absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-2xl ${
                    isDarkMode
                      ? 'border-white/10 bg-slate-950/95 text-slate-100 shadow-black/40'
                      : 'border-slate-200 bg-white/95 text-slate-900 shadow-slate-200/70'
                  }`}
                >
                  <div className="relative overflow-hidden px-5 py-5">
                    <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-cyan-500/10 blur-3xl" />
                    <div className="relative flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-sm font-black text-white">
                        {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : user?.initials ?? 'WL'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black">{user?.name ?? 'WaveLab User'}</p>
                        <p className={`mt-0.5 truncate text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{user?.email ?? ''}</p>
                        <span className="mt-1.5 inline-block rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-cyan-400">
                          {user?.role ?? 'User'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={`h-px ${isDarkMode ? 'bg-white/8' : 'bg-black/6'}`} />

                  <div className="py-1.5">
                    <button
                      type="button"
                      role="menuitem"
                      className={`flex w-full items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors ${
                        isDarkMode ? 'text-slate-400 hover:bg-white/[0.06] hover:text-white' : 'text-slate-500 hover:bg-black/[0.04] hover:text-slate-900'
                      }`}
                    >
                      <UserRound size={15} />
                      Profile Settings
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className={`flex w-full items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors ${
                        isDarkMode ? 'text-slate-400 hover:bg-white/[0.06] hover:text-white' : 'text-slate-500 hover:bg-black/[0.04] hover:text-slate-900'
                      }`}
                    >
                      <Settings size={15} />
                      Preferences
                    </button>
                  </div>

                  <div className={`h-px ${isDarkMode ? 'bg-white/8' : 'bg-black/6'}`} />

                  <div className="py-1.5">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className={`flex w-full items-center gap-3 px-5 py-2.5 text-sm font-semibold transition-colors ${
                        isDarkMode ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300' : 'text-red-500 hover:bg-red-50 hover:text-red-600'
                      }`}
                    >
                      <LogOut size={15} />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
