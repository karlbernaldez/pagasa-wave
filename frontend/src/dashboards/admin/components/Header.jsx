import { useEffect, useMemo, useState } from 'react';
import { Menu, Moon, Sun, ChevronDown, LogOut, User, Settings } from 'lucide-react';

import { fetchUserDetails, getFullName, getUserInitials, logoutUser } from '@dashboards/admin/utils/user';

const Header = ({ activeMeta, onMobileMenuToggle, isDarkMode, onToggleDarkMode }) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const AUTH_API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/auth`;

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const checkResponse = await fetch(`${AUTH_API_BASE_URL}/check`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!checkResponse.ok) {
          return;
        }

        const checkData = await checkResponse.json();
        const userDetails = await fetchUserDetails(checkData.user.id);
        setCurrentUser(userDetails);
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, [AUTH_API_BASE_URL]);

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

  return (
    <header className={`border-b sticky top-0 z-20 backdrop-blur-xl ${
      isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'
    }`}>
      <div className="px-6 py-5 flex items-center justify-between">
        <div className="flex-1">
          <button
            onClick={onMobileMenuToggle}
            className={`lg:hidden p-2 rounded-lg transition-all mb-3 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <Menu size={24} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
          </button>
          <h2 className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{activeMeta.title}</h2>
          <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{activeMeta.description}</p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onToggleDarkMode}
            className={`p-3 rounded-xl transition-all transform hover:scale-110 ${
              isDarkMode
                ? 'bg-gray-700/50 text-yellow-400 hover:bg-gray-700'
                : 'bg-gray-100/80 text-amber-500 hover:bg-gray-200'
            }`}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowUserDropdown((prev) => !prev)}
              className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 ${
                isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100/80'
              }`}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">{user.initials}</span>
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user.name}</p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{user.role}</p>
              </div>
              <ChevronDown
                size={16}
                className={`hidden sm:block transition-transform duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                } ${showUserDropdown ? 'rotate-180' : ''}`}
              />
            </button>

            {showUserDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowUserDropdown(false)} />
                <div className={`absolute right-0 mt-3 w-64 rounded-2xl shadow-2xl border backdrop-blur-xl z-20 overflow-hidden ${
                  isDarkMode
                    ? 'bg-gray-800/80 border-gray-700/50'
                    : 'bg-white/80 border-gray-200/50'
                }`}>
                  <div className={`px-6 py-5 border-b ${isDarkMode ? 'border-gray-700/30' : 'border-gray-200/30'} bg-gradient-to-r from-blue-500/10 to-cyan-500/10`}>
                    <p className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user.name}</p>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{user.email}</p>
                  </div>
                  <div className="py-2">
                    <button className={`w-full px-6 py-3 flex items-center gap-3 text-sm font-semibold ${isDarkMode ? 'text-gray-300 hover:bg-gray-700/50' : 'text-gray-700 hover:bg-gray-100'}`}>
                      <User size={18} />
                      Profile Settings
                    </button>
                    <button className={`w-full px-6 py-3 flex items-center gap-3 text-sm font-semibold ${isDarkMode ? 'text-gray-300 hover:bg-gray-700/50' : 'text-gray-700 hover:bg-gray-100'}`}>
                      <Settings size={18} />
                      Preferences
                    </button>
                    <button
                      onClick={async () => {
                        await logoutUser();
                        setShowUserDropdown(false);
                      }}
                      className={`w-full px-6 py-3 flex items-center gap-3 text-sm font-bold ${isDarkMode ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'}`}
                    >
                      <LogOut size={18} />
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

export default Header;