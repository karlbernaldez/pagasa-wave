import { useCallback, useState } from 'react';
import { Menu, Moon, Sun, ChevronDown, Bell, Waves } from 'lucide-react';

import { getDropdownCls, HEADER_STYLES } from './constants';
import useCurrentUser                    from './hooks/useCurrentUser';
import useNotifications                  from './hooks/useNotifications';
import IconButton                        from './components/IconButton';
import UserAvatar                        from './components/UserAvatar';
import NotificationDropdown              from './components/NotificationDropdown';
import UserDropdown                      from './components/UserDropdown';

/**
 * Top navigation header for the admin dashboard.
 *
 * @param {{
 *   activeMeta:          { title: string, description: string },
 *   onMobileMenuToggle:  () => void,
 *   isDarkMode:          boolean,
 *   onToggleDarkMode:    () => void,
 * }} props
 */
const Header = ({ activeMeta, onMobileMenuToggle, isDarkMode, onToggleDarkMode }) => {
  const [showUser,          setShowUser]          = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const { user, logout }                                               = useCurrentUser();
  const { notifications, unreadCount, handleMarkAllRead,
          handleMarkOneRead }                                          = useNotifications();

  const closeUser          = useCallback(() => setShowUser(false),          []);
  const closeNotifications = useCallback(() => setShowNotifications(false), []);

  const dropdownCls       = getDropdownCls(isDarkMode);
  const sharedDropdown    = { isDarkMode, dropdownCls };

  return (
    <>
      <style>{HEADER_STYLES}</style>

      <header className={`sticky top-0 z-20 bottom-accent relative backdrop-blur-2xl ${
        isDarkMode
          ? 'bg-[#0d1117]/85 border-white/[0.07]'
          : 'bg-white/85 border-black/[0.07]'
      } border-b`}>

        {/* Top shimmer line */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent 5%, rgba(56,189,248,0.5) 40%, rgba(129,140,248,0.5) 60%, transparent 95%)' }}
        />

        <div className="px-4 md:px-6 h-16 flex items-center justify-between gap-4">

          {/* ── LEFT: Title ─────────────────────────────────────── */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onMobileMenuToggle}
              aria-label="Open mobile menu"
              className={`lg:hidden p-2 rounded-xl transition-colors ${
                isDarkMode ? 'hover:bg-white/8 text-gray-400' : 'hover:bg-black/5 text-gray-500'
              }`}
            >
              <Menu size={20} />
            </button>

            <div className="hidden lg:flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-1.5">
                <Waves size={11} className="text-cyan-400 shrink-0" aria-hidden="true" />
                <span className={`text-[10px] font-semibold tracking-[0.15em] uppercase ${
                  isDarkMode ? 'text-cyan-400/70' : 'text-cyan-600/80'
                }`}>
                  Admin Dashboard
                </span>
              </div>
              <h2 className="title-gradient text-[1.35rem] font-black leading-none tracking-tight">
                {activeMeta.title}
              </h2>
              <p className={`text-[11px] leading-none mt-0.5 truncate max-w-xs ${
                isDarkMode ? 'text-gray-600' : 'text-gray-400'
              }`}>
                {activeMeta.description}
              </p>
            </div>
          </div>

          {/* ── RIGHT: Controls ──────────────────────────────────── */}
          <div className="flex items-center gap-2">

            {/* Icon pill: dark-mode + notifications */}
            <div className={`flex items-center gap-0.5 rounded-2xl px-1 py-1 ${
              isDarkMode
                ? 'bg-white/[0.05] border border-white/[0.08]'
                : 'bg-black/[0.03] border border-black/[0.06]'
            }`}>
              <IconButton onClick={onToggleDarkMode} label="Toggle dark mode" isDarkMode={isDarkMode}>
                {isDarkMode
                  ? <Sun  size={17} className="text-amber-300" />
                  : <Moon size={17} className="text-slate-500" />
                }
              </IconButton>

              <div className={`w-px h-5 mx-0.5 ${isDarkMode ? 'bg-white/10' : 'bg-black/8'}`} />

              <div className="relative">
                <IconButton
                  onClick={() => setShowNotifications((p) => !p)}
                  label="Notifications"
                  isDarkMode={isDarkMode}
                  badge={unreadCount > 0 ? unreadCount : null}
                >
                  <Bell size={17} />
                </IconButton>

                <NotificationDropdown
                  {...sharedDropdown}
                  isOpen={showNotifications}
                  onClose={closeNotifications}
                  notifications={notifications}
                  unreadCount={unreadCount}
                  onMarkAllRead={handleMarkAllRead}
                  onMarkOneRead={handleMarkOneRead}
                />
              </div>
            </div>

            <div className={`w-px h-7 ${isDarkMode ? 'bg-white/10' : 'bg-black/8'}`} />

            {/* User trigger + dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUser((p) => !p)}
                aria-expanded={showUser}
                aria-haspopup="dialog"
                className={`flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-2xl border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                  isDarkMode
                    ? 'border-white/10 hover:border-white/18 hover:bg-white/[0.05]'
                    : 'border-black/8 hover:border-black/14 hover:bg-black/[0.03]'
                }`}
              >
                <UserAvatar avatarUrl={user.avatarUrl} initials={user.initials} />
                <div className="hidden sm:flex flex-col text-left leading-none gap-0.5">
                  <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                    {user.name}
                  </p>
                  <p className="text-[11px] font-semibold text-cyan-400">{user.role}</p>
                </div>
                <ChevronDown
                  size={13}
                  aria-hidden="true"
                  className={`hidden sm:block ml-0.5 transition-transform duration-200 ${
                    isDarkMode ? 'text-gray-600' : 'text-gray-400'
                  } ${showUser ? 'rotate-180' : ''}`}
                />
              </button>

              <UserDropdown
                {...sharedDropdown}
                isOpen={showUser}
                onClose={closeUser}
                user={user}
                onLogout={logout}
              />
            </div>

          </div>
        </div>
      </header>
    </>
  );
};

export default Header;