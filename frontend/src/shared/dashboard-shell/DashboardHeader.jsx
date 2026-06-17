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

  const iconButtonClass = `flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
    isDarkMode
      ? 'text-slate-400 hover:bg-white/[0.08] hover:text-slate-100'
      : 'text-slate-500 hover:bg-white/70 hover:text-slate-950'
  }`;

  const panelClass = isDarkMode
    ? 'border-white/10 bg-slate-950/72 text-slate-100 shadow-lg shadow-black/20'
    : 'border-white/70 bg-white/72 text-slate-950 shadow-lg shadow-slate-200/45';

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
    <header className={`sticky top-0 z-50 border-b backdrop-blur-2xl transition-colors ${panelClass}`}>
      <div className="flex h-16 items-center justify-between gap-3 px-3 sm:px-4 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={onMobileMenuToggle}
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border transition-colors lg:hidden ${
              isDarkMode
                ? 'border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.08] hover:text-white'
                : 'border-white/80 bg-white/60 text-slate-500 hover:bg-white/90 hover:text-slate-950'
            }`}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>

          <div className="min-w-0 flex-1">
            <div className="hidden items-center gap-2 min-[420px]:flex">
              <Waves size={12} className={isDarkMode ? 'text-cyan-300' : 'text-cyan-600'} aria-hidden="true" />
              <span className={`truncate text-[10px] font-black uppercase tracking-[0.16em] ${
                isDarkMode ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {eyebrow}
              </span>
            </div>

            <div className="mt-0.5 flex min-w-0 items-center gap-3">
              <h2
                className={`truncate text-base font-black tracking-tight sm:text-xl ${
                  isDarkMode ? 'text-white' : 'text-slate-950'
                }`}
                title={title}
              >
                {title}
              </h2>

              <span className={`hidden h-5 w-px sm:block ${isDarkMode ? 'bg-white/10' : 'bg-slate-200/80'}`} />

              {description && (
                <p className={`hidden max-w-md truncate text-xs font-semibold md:block ${
                  isDarkMode ? 'text-slate-500' : 'text-slate-500'
                }`}>
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className={`flex items-center gap-1 rounded-xl border p-1 ${
            isDarkMode ? 'border-white/10 bg-white/[0.04] shadow-inner shadow-white/[0.03]' : 'border-white/80 bg-white/65 shadow-sm shadow-slate-200/50'
          }`}>
            <button
              type="button"
              onClick={onThemeToggle}
              className={iconButtonClass}
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun size={17} className="text-amber-300" /> : <Moon size={17} />}
            </button>

            <NotificationBell isDarkMode={isDarkMode} />
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={handleUserButtonClick}
              className={`flex h-11 shrink-0 items-center gap-2 rounded-xl border p-1.5 transition-colors sm:pl-1.5 sm:pr-3 ${
                isDarkMode
                  ? 'border-white/10 bg-white/[0.04] shadow-inner shadow-white/[0.03] hover:bg-white/[0.08]'
                  : 'border-white/80 bg-white/75 shadow-sm shadow-slate-200/60 hover:bg-white'
              }`}
              aria-haspopup="menu"
              aria-expanded={isUserMenuOpen}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-cyan-600 text-xs font-black text-white">
                {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : user?.initials ?? 'WL'}
              </span>

              <span className="hidden min-w-0 text-left leading-none sm:flex sm:flex-col">
                <span className={`max-w-32 truncate text-sm font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                  {user?.name ?? 'WaveLab User'}
                </span>
                <span className={`mt-0.5 text-[11px] font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  {user?.role ?? 'User'}
                </span>
              </span>

              <ChevronDown
                size={14}
                aria-hidden="true"
                className={`hidden transition-transform sm:block ${isDarkMode ? 'text-slate-600' : 'text-slate-400'} ${isUserMenuOpen ? 'rotate-180' : ''}`}
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
                  className={`absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-xl border shadow-2xl backdrop-blur-2xl ${panelClass} ${
                    isDarkMode ? 'shadow-black/40' : 'shadow-slate-200/80'
                  }`}
                >
                  <div className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-cyan-600 text-sm font-black text-white">
                        {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : user?.initials ?? 'WL'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black">{user?.name ?? 'WaveLab User'}</p>
                        <p className={`mt-0.5 truncate text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{user?.email ?? ''}</p>
                        <span className={`mt-2 inline-flex rounded-md border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${
                          isDarkMode
                            ? 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200'
                            : 'border-cyan-200 bg-cyan-50 text-cyan-700'
                        }`}>
                          {user?.role ?? 'User'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={`h-px ${isDarkMode ? 'bg-white/10' : 'bg-slate-200/80'}`} />

                  <div className="py-1.5">
                    <button
                      type="button"
                      role="menuitem"
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm font-bold transition-colors ${
                        isDarkMode ? 'text-slate-400 hover:bg-white/[0.06] hover:text-white' : 'text-slate-500 hover:bg-white/65 hover:text-slate-950'
                      }`}
                    >
                      <UserRound size={15} />
                      Profile Settings
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm font-bold transition-colors ${
                        isDarkMode ? 'text-slate-400 hover:bg-white/[0.06] hover:text-white' : 'text-slate-500 hover:bg-white/65 hover:text-slate-950'
                      }`}
                    >
                      <Settings size={15} />
                      Preferences
                    </button>
                  </div>

                  <div className={`h-px ${isDarkMode ? 'bg-white/10' : 'bg-slate-200/80'}`} />

                  <div className="py-1.5">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm font-bold transition-colors ${
                        isDarkMode ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'
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
