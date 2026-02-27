import { useEffect, useMemo, useState } from 'react';
import {
  Menu,
  Moon,
  Sun,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Bell,
  Waves,
} from 'lucide-react';

import { getFullName, getUserInitials } from '@dashboards/admin/utils/user';
import { fetchUserDetails } from '@/api/userAPI';
import { checkAuthSession, logoutUser } from '@/api/auth';

let adminHeaderUserRequest = null;
let adminHeaderUserCache = null;

const resetAdminHeaderUserCache = () => {
  adminHeaderUserCache = null;
  adminHeaderUserRequest = null;
};

const loadAdminHeaderUserData = async () => {
  if (adminHeaderUserCache) return adminHeaderUserCache;
  if (adminHeaderUserRequest) return adminHeaderUserRequest;

  adminHeaderUserRequest = (async () => {
    const { authenticated, user } = await checkAuthSession();
    if (!authenticated || !user?.id) { adminHeaderUserCache = null; return null; }
    const userDetails = await fetchUserDetails(user.id);
    adminHeaderUserCache = userDetails;
    return userDetails;
  })();

  try { return await adminHeaderUserRequest; }
  catch (error) { resetAdminHeaderUserCache(); throw error; }
  finally { adminHeaderUserRequest = null; }
};

const NOTIFICATIONS = [
  { id: 1, title: '3 pending user requests', time: '5m ago', unread: true },
  { id: 2, title: 'New wave chart submitted for review', time: '20m ago', unread: true },
  { id: 3, title: 'System sync completed successfully', time: '1h ago', unread: false },
];

// ─────────────────────────────────────────────
// UserAvatar
// ─────────────────────────────────────────────
const UserAvatar = ({ avatarUrl, initials, size = 'md' }) => {
  const [imgError, setImgError] = useState(false);
  const dim = size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
  const textSize = size === 'lg' ? 'text-sm' : 'text-xs';

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt="avatar"
        onError={() => setImgError(true)}
        className={`${dim} rounded-xl object-cover ring-2 ring-cyan-500/40`}
      />
    );
  }

  return (
    <div className={`${dim} rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-500/20`}>
      <span className={`text-white font-bold ${textSize}`}>{initials}</span>
    </div>
  );
};

// ─────────────────────────────────────────────
// IconButton
// ─────────────────────────────────────────────
const IconButton = ({ onClick, label, isDarkMode, children, badge }) => (
  <button
    onClick={onClick}
    aria-label={label}
    className={`relative p-2.5 rounded-xl transition-all duration-150 active:scale-95 ${
      isDarkMode
        ? 'text-gray-400 hover:text-gray-100 hover:bg-white/8'
        : 'text-gray-500 hover:text-gray-900 hover:bg-black/6'
    }`}
  >
    {children}
    {badge != null && (
      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black bg-gradient-to-br from-red-500 to-rose-600 text-white flex items-center justify-center shadow-sm shadow-red-500/40">
        {badge}
      </span>
    )}
  </button>
);

// ─────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────
const Header = ({ activeMeta, onMobileMenuToggle, isDarkMode, onToggleDarkMode }) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    let mounted = true;
    loadAdminHeaderUserData()
      .then((d) => { if (mounted) setCurrentUser(d); })
      .catch(console.error);
    return () => { mounted = false; };
  }, []);

  const user = useMemo(() => {
    const firstName = currentUser?.firstName;
    const lastName  = currentUser?.lastName;
    const username  = currentUser?.username;
    return {
      initials:  getUserInitials(firstName, lastName, username),
      name:      getFullName(firstName, lastName, username),
      role:      currentUser?.role === 'admin' ? 'Administrator' : 'User',
      email:     currentUser?.email || 'Loading...',
      avatarUrl: currentUser?.avatarUrl ?? null,
    };
  }, [currentUser]);

  const unreadCount = NOTIFICATIONS.filter((n) => n.unread).length;

  const dropdownCls = isDarkMode
    ? 'bg-[#0f1923] border-white/12 shadow-black/60'
    : 'bg-white border-black/10 shadow-gray-300/60';

  return (
    <>
      <style>{`
        .title-gradient {
          background: linear-gradient(90deg, #e2f3ff 0%, #7dd3fc 40%, #a5b4fc 80%, #e2f3ff 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: titleShimmer 5s linear infinite;
        }
        @keyframes titleShimmer {
          0%   { background-position: 0% 0%;   }
          100% { background-position: 200% 0%; }
        }
        .bottom-accent::after {
          content: '';
          position: absolute;
          bottom: 0; left: 5%; right: 5%;
          height: 1px;
          background: linear-gradient(90deg, transparent, #38bdf8 35%, #818cf8 65%, transparent);
          opacity: 0.45;
        }
      `}</style>

      <header className={`sticky top-0 z-20 bottom-accent relative backdrop-blur-2xl ${
        isDarkMode
          ? 'bg-[#0d1117]/85 border-white/[0.07]'
          : 'bg-white/85 border-black/[0.07]'
      } border-b`}>

        {/* Top shimmer line */}
        <div className="absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent 5%, rgba(56,189,248,0.5) 40%, rgba(129,140,248,0.5) 60%, transparent 95%)' }}
        />

        <div className="px-4 md:px-6 h-16 flex items-center justify-between gap-4">

          {/* ── LEFT: Title ── */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onMobileMenuToggle}
              className={`lg:hidden p-2 rounded-xl transition-colors ${
                isDarkMode ? 'hover:bg-white/8 text-gray-400' : 'hover:bg-black/5 text-gray-500'
              }`}
            >
              <Menu size={20} />
            </button>

            <div className="hidden lg:flex flex-col gap-0.5 min-w-0">
              {/* Eyebrow */}
              <div className="flex items-center gap-1.5">
                <Waves size={11} className="text-cyan-400 shrink-0" />
                <span className={`text-[10px] font-semibold tracking-[0.15em] uppercase ${
                  isDarkMode ? 'text-cyan-400/70' : 'text-cyan-600/80'
                }`}>
                  Admin Dashboard
                </span>
              </div>

              {/* Page title */}
              <h2 className="title-gradient text-[1.35rem] font-black leading-none tracking-tight">
                {activeMeta.title}
              </h2>

              {/* Description */}
              <p className={`text-[11px] leading-none mt-0.5 truncate max-w-xs ${
                isDarkMode ? 'text-gray-600' : 'text-gray-400'
              }`}>
                {activeMeta.description}
              </p>
            </div>
          </div>

          {/* ── RIGHT: Controls ── */}
          <div className="flex items-center gap-2">

            {/* Pill group for icon buttons */}
            <div className={`flex items-center gap-0.5 rounded-2xl px-1 py-1 ${
              isDarkMode ? 'bg-white/[0.05] border border-white/[0.08]' : 'bg-black/[0.03] border border-black/[0.06]'
            }`}>
              {/* Dark mode */}
              <IconButton onClick={onToggleDarkMode} label="Toggle dark mode" isDarkMode={isDarkMode}>
                {isDarkMode
                  ? <Sun size={17} className="text-amber-300" />
                  : <Moon size={17} className="text-slate-500" />
                }
              </IconButton>

              {/* Divider */}
              <div className={`w-px h-5 mx-0.5 ${isDarkMode ? 'bg-white/10' : 'bg-black/8'}`} />

              {/* Notifications */}
              <div className="relative">
                <IconButton
                  onClick={() => setShowNotificationDropdown((p) => !p)}
                  label="Notifications"
                  isDarkMode={isDarkMode}
                  badge={unreadCount > 0 ? unreadCount : null}
                >
                  <Bell size={17} />
                </IconButton>

                {showNotificationDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowNotificationDropdown(false)} />
                    <div className={`absolute right-0 mt-3 w-80 rounded-2xl shadow-2xl border backdrop-blur-2xl z-20 overflow-hidden ${dropdownCls}`}>
                      {/* Header */}
                      <div className={`px-4 py-3 flex items-center justify-between border-b ${
                        isDarkMode ? 'border-white/8' : 'border-black/6'
                      }`}>
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Notifications
                          </p>
                          {unreadCount > 0 && (
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        <button className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
                          Mark all read
                        </button>
                      </div>

                      <div className="divide-y divide-white/[0.04]">
                        {NOTIFICATIONS.map((item) => (
                          <div
                            key={item.id}
                            className={`px-4 py-3 flex items-start gap-3 cursor-pointer transition-colors ${
                              isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/3'
                            }`}
                          >
                            <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                              item.unread ? 'bg-cyan-400' : isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`} />
                            <div className="min-w-0">
                              <p className={`text-sm font-semibold leading-snug ${
                                isDarkMode
                                  ? item.unread ? 'text-gray-100' : 'text-gray-400'
                                  : item.unread ? 'text-gray-800' : 'text-gray-400'
                              }`}>
                                {item.title}
                              </p>
                              <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                {item.time}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className={`w-px h-7 ${isDarkMode ? 'bg-white/10' : 'bg-black/8'}`} />

            {/* User button */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown((p) => !p)}
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
                  <p className="text-[11px] font-semibold text-cyan-400">
                    {user.role}
                  </p>
                </div>

                <ChevronDown
                  size={13}
                  className={`hidden sm:block ml-0.5 transition-transform duration-200 ${
                    isDarkMode ? 'text-gray-600' : 'text-gray-400'
                  } ${showUserDropdown ? 'rotate-180' : ''}`}
                />
              </button>

              {showUserDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowUserDropdown(false)} />
                  <div className={`absolute right-0 mt-3 w-64 rounded-2xl shadow-2xl border backdrop-blur-2xl z-20 overflow-hidden ${dropdownCls}`}>

                    {/* Profile header */}
                    <div className="relative px-5 py-5 overflow-hidden">
                      <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
                      <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
                      <div className="relative flex items-center gap-3">
                        <UserAvatar avatarUrl={user.avatarUrl} initials={user.initials} size="lg" />
                        <div className="min-w-0 flex-1">
                          <p className={`font-bold text-sm truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {user.name}
                          </p>
                          <p className={`text-xs mt-0.5 truncate ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            {user.email}
                          </p>
                          <span className="inline-block mt-1.5 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-cyan-500/12 text-cyan-400 border border-cyan-500/20">
                            {user.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={`h-px ${isDarkMode ? 'bg-white/8' : 'bg-black/6'}`} />

                    <div className="py-1.5">
                      {[
                        { icon: User, label: 'Profile Settings' },
                        { icon: Settings, label: 'Preferences' },
                      ].map(({ icon: Icon, label }) => (
                        <button
                          key={label}
                          className={`w-full px-5 py-2.5 flex items-center gap-3 text-sm font-medium transition-colors ${
                            isDarkMode
                              ? 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
                              : 'text-gray-500 hover:text-gray-900 hover:bg-black/[0.04]'
                          }`}
                        >
                          <Icon size={15} />
                          {label}
                        </button>
                      ))}
                    </div>

                    <div className={`h-px ${isDarkMode ? 'bg-white/8' : 'bg-black/6'}`} />

                    <div className="py-1.5">
                      <button
                        onClick={async () => {
                          await logoutUser();
                          resetAdminHeaderUserCache();
                          setCurrentUser(null);
                          setShowUserDropdown(false);
                        }}
                        className={`w-full px-5 py-2.5 flex items-center gap-3 text-sm font-semibold transition-colors ${
                          isDarkMode
                            ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                            : 'text-red-500 hover:text-red-600 hover:bg-red-50'
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
    </>
  );
};

export default Header;