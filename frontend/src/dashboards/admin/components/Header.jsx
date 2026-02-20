import { useEffect, useMemo, useState, useRef } from 'react';
import {
  Menu,
  Moon,
  Sun,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Bell,
  Search,
} from 'lucide-react';

import {
  fetchUserDetails,
  getFullName,
  getUserInitials,
  logoutUser,
} from '@dashboards/admin/utils/user';

const NOTIFICATIONS = [
  { id: 1, title: '3 pending user requests', time: '5m ago' },
  { id: 2, title: 'New wave chart submitted for review', time: '20m ago' },
  { id: 3, title: 'System sync completed successfully', time: '1h ago' },
];

const Header = ({
  activeMeta,
  onMobileMenuToggle,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchValue, setSearchValue] = useState('');

  const searchRef = useRef(null);

  const AUTH_API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/auth`;

  /* ===============================
     Load current user
  =============================== */
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const checkResponse = await fetch(`${AUTH_API_BASE_URL}/check`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!checkResponse.ok) return;

        const checkData = await checkResponse.json();
        const userDetails = await fetchUserDetails(checkData.user.id);
        setCurrentUser(userDetails);
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, [AUTH_API_BASE_URL]);

  /* ===============================
     Keyboard shortcut (Cmd/Ctrl + K)
  =============================== */
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  /* ===============================
     Derived user info
  =============================== */
  const user = useMemo(() => {
    const firstName = currentUser?.firstName;
    const lastName = currentUser?.lastName;
    const username = currentUser?.username;

    return {
      initials: getUserInitials(firstName, lastName, username),
      name: getFullName(firstName, lastName, username),
      role: currentUser?.role === 'admin' ? 'Administrator' : 'User',
      email: currentUser?.email || 'Loading...',
    };
  }, [currentUser]);

  /* ===============================
     Styles helpers
  =============================== */
  const containerBg = isDarkMode
    ? 'bg-gray-800/60 border-gray-700/50'
    : 'bg-white/70 border-gray-200/60';

  const dropdownBg = isDarkMode
    ? 'bg-gray-800/90 border-gray-700/50'
    : 'bg-white/95 border-gray-200/70';

  /* ===============================
     Component
  =============================== */
  return (
    <header className={`border-b sticky top-0 z-20 backdrop-blur-xl ${containerBg}`}>
      <div className="px-4 md:px-6 py-4 flex items-center justify-between gap-4">

        {/* LEFT SIDE */}
        <div className="flex items-center gap-4 flex-1">

          {/* MOBILE MENU */}
          <button
            onClick={onMobileMenuToggle}
            className={`lg:hidden p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            aria-label="Open menu"
          >
            <Menu size={22} className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
          </button>

          {/* TITLE */}
          <div className="hidden lg:block mr-2">
            <h2 className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {activeMeta.title}
            </h2>
            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {activeMeta.description}
            </p>
          </div>

          {/* COMPACT SEARCH */}
          <div className="hidden md:flex flex-1 max-w-md relative">
            <Search
              size={16}
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}
            />

            <input
              ref={searchRef}
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search or type command..."
              className={`w-full pl-9 pr-12 py-2 rounded-xl text-sm outline-none border transition ${isDarkMode
                  ? 'bg-gray-900/70 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-gray-500'
                  : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400 focus:border-gray-400'
                }`}
            />

            <span
              className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-0.5 rounded-md border ${isDarkMode
                  ? 'border-gray-700 text-gray-400'
                  : 'border-gray-300 text-gray-500'
                }`}
            >
              ⌘K
            </span>
          </div>

        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-2 md:gap-3">

          {/* DARK MODE */}
          <button
            onClick={onToggleDarkMode}
            className={`p-3 rounded-xl transition-all ${isDarkMode
                ? 'bg-gray-700/60 text-yellow-300 hover:bg-gray-700'
                : 'bg-gray-100/90 text-amber-500 hover:bg-gray-200'
              }`}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun size={19} /> : <Moon size={19} />}
          </button>

          {/* NOTIFICATIONS */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationDropdown((prev) => !prev)}
              className={`relative p-3 rounded-xl ${isDarkMode
                  ? 'bg-gray-700/60 text-gray-200 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              aria-label="Notifications"
            >
              <Bell size={19} />
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold bg-red-500 text-white flex items-center justify-center">
                {NOTIFICATIONS.length}
              </span>
            </button>

            {showNotificationDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowNotificationDropdown(false)} />
                <div className={`absolute right-0 mt-3 w-80 rounded-2xl shadow-2xl border backdrop-blur-xl z-20 overflow-hidden ${dropdownBg}`}>
                  <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700/60' : 'border-gray-200/70'}`}>
                    <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Notifications
                    </p>
                  </div>

                  <div className="max-h-72 overflow-y-auto">
                    {NOTIFICATIONS.map((item) => (
                      <div
                        key={item.id}
                        className={`px-4 py-3 border-b last:border-b-0 ${isDarkMode ? 'border-gray-700/50' : 'border-gray-100'
                          }`}
                      >
                        <p className={`text-sm font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                          {item.title}
                        </p>
                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {item.time}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* USER MENU */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown((prev) => !prev)}
              className={`flex items-center gap-3 px-2 md:px-3 py-2 rounded-xl hover:scale-105 ${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100/80'
                }`}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">{user.initials}</span>
              </div>

              <div className="hidden sm:flex flex-col text-left">
                <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {user.name}
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {user.role}
                </p>
              </div>

              <ChevronDown
                size={16}
                className={`hidden sm:block transition-transform ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  } ${showUserDropdown ? 'rotate-180' : ''}`}
              />
            </button>

            {showUserDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowUserDropdown(false)} />
                <div className={`absolute right-0 mt-3 w-64 rounded-2xl shadow-2xl border backdrop-blur-xl z-20 overflow-hidden ${dropdownBg}`}>
                  <div className={`px-6 py-5 border-b ${isDarkMode ? 'border-gray-700/40' : 'border-gray-200/50'} bg-gradient-to-r from-blue-500/10 to-cyan-500/10`}>
                    <p className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {user.name}
                    </p>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {user.email}
                    </p>
                  </div>

                  <div className="py-2">
                    <button className={`w-full px-6 py-3 flex items-center gap-3 text-sm font-semibold ${isDarkMode ? 'text-gray-300 hover:bg-gray-700/50' : 'text-gray-700 hover:bg-gray-100'
                      }`}>
                      <User size={18} /> Profile Settings
                    </button>

                    <button className={`w-full px-6 py-3 flex items-center gap-3 text-sm font-semibold ${isDarkMode ? 'text-gray-300 hover:bg-gray-700/50' : 'text-gray-700 hover:bg-gray-100'
                      }`}>
                      <Settings size={18} /> Preferences
                    </button>

                    <button
                      onClick={async () => {
                        await logoutUser();
                        setShowUserDropdown(false);
                      }}
                      className={`w-full px-6 py-3 flex items-center gap-3 text-sm font-bold ${isDarkMode ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'
                        }`}
                    >
                      <LogOut size={18} /> Sign Out
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

export default Header;
