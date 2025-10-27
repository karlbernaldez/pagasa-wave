import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon, User, LogOut, Settings, Wind, Activity, Eye, ChevronDown } from 'lucide-react';
import { fetchUserDetails } from '../api/userAPI';
import { logoutUser } from '../api/auth';

const Header = ({ isDarkMode, setIsDarkMode, activeChartType, setActiveChartType }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isChartDropdownOpen, setIsChartDropdownOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const chartDropdownRef = useRef(null);
  const chartHoverTimeout = useRef(null);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const toggleUserDropdown = () => setIsUserDropdownOpen(!isUserDropdownOpen);

  const AUTH_API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/auth`;
  const checkRoute = `${AUTH_API_BASE_URL}/check`;

  const chartTypes = [
    { 
      id: 'wave-wind', 
      name: 'Wave & Wind', 
      icon: Wind, 
      description: 'Combined wave and wind analysis',
      color: 'text-blue-400'
    },
    { 
      id: 'wave-only', 
      name: 'Wave Only', 
      icon: Activity, 
      description: 'Pure wave height analysis',
      color: 'text-cyan-400'
    },
    { 
      id: 'visually-impaired', 
      name: 'Accessible', 
      icon: Eye, 
      description: 'High contrast charts for accessibility',
      color: 'text-emerald-400'
    }
  ];

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const checkResponse = await fetch(checkRoute, {
          method: 'GET',
          credentials: 'include',
        });

        if (checkResponse.ok) {
          const checkData = await checkResponse.json();
          const userId = checkData.user.id;
          const userDetailsResponse = await fetchUserDetails(userId);
          setCurrentUser(userDetailsResponse);
          setIsLoggedIn(true);
        } else {
          console.error('Failed to authenticate user');
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Charts', href: '/charts', hasDropdown: true },
    { name: 'WaveLab', href: '/wavelab' },
    { name: 'Services', href: '#services' },
    { name: 'About', href: '#about' },
    { name: 'Contact', href: '#contact' }
  ];

  const isActiveRoute = (href) => {
    if (href.startsWith('#')) {
      return location.pathname === '/' && location.hash === href;
    }
    return location.pathname === href;
  };

  const handleNavClick = (href) => {
    if (href.startsWith('#')) {
      const section = document.querySelector(href);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(href);
    }
    setIsMobileMenuOpen(false);
    setIsChartDropdownOpen(false);
  };

  const handleUserAction = (path) => {
    navigate(path);
    setIsUserDropdownOpen(false);
  };

  const handleSignOut = () => {
    logoutUser();
    setIsLoggedIn(false);
    setIsUserDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleChartHover = (isHovering) => {
    if (chartHoverTimeout.current) {
      clearTimeout(chartHoverTimeout.current);
    }

    if (isHovering) {
      setIsChartDropdownOpen(true);
    } else {
      chartHoverTimeout.current = setTimeout(() => {
        setIsChartDropdownOpen(false);
      }, 150);
    }
  };
  
  const handleChartTypeSelect = (typeId) => {
    if (setActiveChartType) {
      setActiveChartType(typeId);
    }
    setIsChartDropdownOpen(false); 
    setIsMobileMenuOpen(false);
    navigate('/charts');
  };

  return (
    <>
      {/* Header Container */}
      <header className={`fixed top-0 left-0 right-0 z-[1000] backdrop-blur-xl border-b transition-all duration-300 ${
        isDarkMode 
          ? 'border-gray-600/30' 
          : 'border-gray-200/20'
      }`}>
        {/* Nav */}
        <nav className="max-w-[1400px] mx-auto px-4 md:px-6 flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-0.5 group-hover:scale-105 ${
              isDarkMode 
                ? 'bg-gradient-to-br from-sky-400 to-blue-500' 
                : 'bg-gradient-to-br from-sky-500 to-blue-600'
            }`}>
              <img src="/pagasa-logo.png" alt="PAGASA logo" className="w-7 h-7 object-contain" />
            </div>
            <span className={`text-2xl font-black tracking-tight transition-all duration-300 group-hover:scale-105 ${
              isDarkMode 
                ? 'text-white drop-shadow-[0_2px_8px_rgba(59,130,246,0.5)]' 
                : 'text-gray-900 drop-shadow-[0_1px_3px_rgba(0,0,0,0.1)]'
            }`}>
              VOTEWAVE
            </span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item, index) => (
              <div key={index} className="relative">
                {item.hasDropdown ? (
                  <div
                    className="relative"
                    ref={chartDropdownRef}
                    onMouseEnter={() => handleChartHover(true)}
                    onMouseLeave={() => handleChartHover(false)}
                  >
                    <button
                      onClick={() => handleNavClick(item.href)}
                      className={`px-4 py-2 border-none bg-transparent cursor-pointer text-base font-semibold rounded-md transition-all duration-200 relative flex items-center gap-2 ${
                        isActiveRoute(item.href)
                          ? isDarkMode
                            ? 'text-white bg-blue-900/30'
                            : 'text-gray-900 bg-blue-100'
                          : isDarkMode
                          ? 'text-gray-100 hover:text-white hover:bg-gray-800'
                          : 'text-gray-900 hover:text-blue-900 hover:bg-slate-50'
                      }`}
                    >
                      {item.name}
                      <ChevronDown 
                        size={14} 
                        className={`transition-transform duration-200 ${
                          isChartDropdownOpen ? 'rotate-180' : 'rotate-0'
                        } ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                      />
                      {isActiveRoute(item.href) && (
                        <span className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-sm ${
                          isDarkMode ? 'bg-blue-400' : 'bg-blue-600'
                        }`} />
                      )}
                    </button>

                    {/* Chart Dropdown */}
                    {isChartDropdownOpen && (
                      <div className={`absolute top-full left-0 mt-2 w-[280px] rounded-xl backdrop-blur-2xl border shadow-2xl z-50 p-2 ${
                        isDarkMode
                          ? 'bg-slate-800/95 border-slate-600/50'
                          : 'bg-white/95 border-gray-200/50'
                      }`}>
                        <div className={`px-4 py-3 mb-2 border-b ${
                          isDarkMode ? 'border-white/20' : 'border-gray-200'
                        }`}>
                          <h4 className={`text-sm font-bold mb-1 ${
                            isDarkMode ? 'text-white' : 'text-slate-900'
                          }`}>
                            Chart Types
                          </h4>
                          <p className={`text-xs m-0 ${
                            isDarkMode ? 'text-slate-300' : 'text-slate-600'
                          }`}>
                            Select your preferred chart display
                          </p>
                        </div>

                        {chartTypes.map((type) => {
                          const Icon = type.icon;
                          const isActive = activeChartType === type.id;
                          return (
                            <button
                              key={type.id}
                              onClick={() => handleChartTypeSelect(type.id)}
                              className={`w-full flex items-center gap-3 p-3 rounded-lg border-none cursor-pointer transition-all duration-200 mb-1 ${
                                isActive
                                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg scale-[1.02]'
                                  : isDarkMode
                                  ? 'bg-transparent text-gray-100 hover:bg-slate-700/70 hover:text-white hover:shadow-md hover:scale-[1.02]'
                                  : 'bg-transparent text-gray-800 hover:bg-blue-50 hover:text-blue-900 hover:shadow-md hover:scale-[1.02]'
                              }`}
                            >
                              <Icon size={18} className={isActive ? 'text-white' : ''} />
                              <div className="flex-1 text-left">
                                <div className={`font-semibold text-sm mb-0.5 ${
                                  isActive ? 'text-white' : isDarkMode ? 'text-gray-100' : 'text-gray-900'
                                }`}>
                                  {type.name}
                                </div>
                                <div className={`text-xs ${
                                  isActive 
                                    ? 'text-white/90' 
                                    : isDarkMode 
                                    ? 'text-gray-300' 
                                    : 'text-gray-600'
                                }`}>
                                  {type.description}
                                </div>
                              </div>
                              {isActive && (
                                <div className="w-2 h-2 rounded-full bg-white shadow-sm" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => handleNavClick(item.href)}
                    className={`px-4 py-2 border-none bg-transparent cursor-pointer text-base font-semibold rounded-md transition-all duration-200 relative ${
                      isActiveRoute(item.href)
                        ? isDarkMode
                          ? 'text-white bg-blue-900/30'
                          : 'text-gray-900 bg-blue-100'
                        : isDarkMode
                        ? 'text-gray-100 hover:text-white hover:bg-gray-800'
                        : 'text-gray-900 hover:text-blue-900 hover:bg-slate-50'
                    }`}
                  >
                    {item.name}
                    {isActiveRoute(item.href) && (
                      <span className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-sm ${
                        isDarkMode ? 'bg-blue-400' : 'bg-blue-600'
                      }`} />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Button Group */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`rounded-xl p-3 cursor-pointer transition-all duration-300 flex items-center justify-center backdrop-blur-xl border ${
                isDarkMode
                  ? 'bg-gray-800/80 border-gray-600/30 hover:bg-gray-800 hover:border-gray-600/40'
                  : 'bg-white/90 border-white/20 hover:bg-white hover:border-gray-200/30'
              } hover:-translate-y-0.5 hover:scale-105 active:translate-y-0 active:scale-95`}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-blue-400" />
              ) : (
                <Moon className="w-5 h-5 text-sky-500" />
              )}
            </button>

            {/* Desktop Sign In / User Dropdown */}
            {!isLoggedIn && !loading ? (
              <button
                onClick={() => navigate('/login')}
                className="hidden md:flex bg-gradient-to-br from-sky-500 to-blue-600 border-none rounded-xl px-6 py-3 text-white font-semibold text-sm cursor-pointer transition-all duration-300 items-center gap-2 shadow-lg hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl active:translate-y-0 active:scale-[0.98]"
              >
                <User size={16} />
                Sign In
              </button>
            ) : (
              <div ref={dropdownRef} className="hidden md:block relative">
                <button
                  onClick={toggleUserDropdown}
                  className={`flex items-center gap-2 px-3 py-2 border-none cursor-pointer rounded-lg transition-all duration-200 ${
                    isUserDropdownOpen
                      ? isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                      : 'bg-transparent'
                  } ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    {currentUser?.avatar ? (
                      <img src={currentUser.avatar} alt={currentUser.username} className="w-full h-full object-cover" />
                    ) : (
                      <User size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                    )}
                  </div>
                  <div className="hidden lg:block text-left min-w-0">
                    <div className={`text-sm font-medium leading-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] ${
                      isDarkMode ? 'text-gray-50' : 'text-gray-900'
                    }`}>
                      {currentUser?.username || 'Loading...'}
                    </div>
                    <div className={`text-xs leading-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {currentUser?.position || 'Please Wait...'}
                    </div>
                  </div>
                  <ChevronDown 
                    size={16} 
                    className={`flex-shrink-0 transition-transform duration-200 ${
                      isUserDropdownOpen ? 'rotate-180' : 'rotate-0'
                    } ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  />
                </button>

                {/* User Dropdown Menu */}
                {isUserDropdownOpen && (
                  <div className={`absolute top-full right-0 mt-2 min-w-[240px] z-50 overflow-hidden rounded-lg border shadow-xl ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    <div className={`p-4 border-b ${
                      isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className={`text-sm font-semibold mb-0.5 break-words ${
                        isDarkMode ? 'text-gray-50' : 'text-gray-900'
                      }`}>
                        {currentUser?.username || 'User'}
                      </div>
                      <div className={`text-xs break-words ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {currentUser?.email || 'user@example.com'}
                      </div>
                      <div className={`text-[11px] uppercase tracking-wide mt-1 font-medium ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {currentUser?.position || 'Member'}
                      </div>
                    </div>

                    <button
                      onClick={() => handleUserAction('/profile')}
                      className={`w-full px-4 py-3 border-none bg-transparent cursor-pointer flex items-center gap-3 text-sm transition-colors duration-150 text-left ${
                        isDarkMode ? 'text-gray-50 hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <User size={16} />
                      View Profile
                    </button>

                    <button
                      onClick={() => handleUserAction('/settings')}
                      className={`w-full px-4 py-3 border-none bg-transparent cursor-pointer flex items-center gap-3 text-sm transition-colors duration-150 text-left ${
                        isDarkMode ? 'text-gray-50 hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Settings size={16} />
                      Settings
                    </button>

                    <div className={`h-px my-1 ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`} />

                    <button
                      onClick={handleSignOut}
                      className="w-full px-4 py-3 border-none bg-transparent cursor-pointer flex items-center gap-3 text-sm text-red-500 hover:bg-red-50 transition-colors duration-150 text-left"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className={`md:hidden rounded-xl p-3 cursor-pointer transition-all duration-300 backdrop-blur-xl border flex items-center justify-center ${
                isDarkMode
                  ? 'bg-gray-800/80 border-gray-600/30 text-gray-300 hover:text-white hover:bg-gray-800'
                  : 'bg-white/90 border-white/20 text-gray-600 hover:text-gray-900 hover:bg-white'
              } hover:-translate-y-0.5 hover:scale-105`}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className={`fixed top-[70px] left-0 w-full h-[calc(100%-70px)] backdrop-blur-lg z-40 px-4 py-8 overflow-y-auto flex flex-col gap-4 ${
            isDarkMode ? 'bg-slate-900/95' : 'bg-white/95'
          }`}
        >
          {navItems.map((item, index) => (
            <div key={index}>
              {item.hasDropdown ? (
                <>
                  <button
                    onClick={() => setIsChartDropdownOpen(!isChartDropdownOpen)}
                    className={`text-xl px-4 py-3 w-full text-left flex items-center justify-between border-none bg-transparent cursor-pointer font-medium rounded-md transition-all duration-200 ${
                      isActiveRoute(item.href)
                        ? isDarkMode
                          ? 'text-blue-400 bg-blue-900/20'
                          : 'text-blue-600 bg-blue-100'
                        : isDarkMode
                        ? 'text-gray-300 hover:text-blue-300 hover:bg-gray-800'
                        : 'text-gray-700 hover:text-blue-800 hover:bg-slate-50'
                    }`}
                  >
                    {item.name}
                    <ChevronDown 
                      size={14} 
                      className={`transition-transform duration-200 ${
                        isChartDropdownOpen ? 'rotate-180' : 'rotate-0'
                      } ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                    />
                  </button>
                  {isChartDropdownOpen && (
                    <div className="pl-6 mt-2 space-y-1">
                      {chartTypes.map(type => {
                        const Icon = type.icon;
                        const isActive = activeChartType === type.id;
                        return (
                          <button
                            key={type.id}
                            onClick={() => handleChartTypeSelect(type.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 text-left border-none ${
                              isActive
                                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg scale-[1.02]'
                                : isDarkMode
                                ? 'bg-transparent text-gray-100 hover:bg-slate-700/70 hover:text-white hover:shadow-md hover:scale-[1.02]'
                                : 'bg-transparent text-gray-800 hover:bg-blue-50 hover:text-blue-900 hover:shadow-md hover:scale-[1.02]'
                            }`}
                          >
                            <Icon size={18} className={isActive ? 'text-white' : ''} />
                            <div className="flex-1">
                              <div className={`font-semibold text-sm ${
                                isActive ? 'text-white' : isDarkMode ? 'text-gray-100' : 'text-gray-900'
                              }`}>
                                {type.name}
                              </div>
                              <div className={`text-xs ${
                                isActive 
                                  ? 'text-white/90' 
                                  : isDarkMode 
                                  ? 'text-gray-300' 
                                  : 'text-gray-600'
                              }`}>
                                {type.description}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={() => handleNavClick(item.href)}
                  className={`text-xl px-4 py-3 w-full text-left border-none bg-transparent cursor-pointer font-medium rounded-md transition-all duration-200 relative ${
                    isActiveRoute(item.href)
                      ? isDarkMode
                        ? 'text-blue-400 bg-blue-900/20 before:content-[""] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-5 before:bg-blue-400 before:rounded-r-sm'
                        : 'text-blue-600 bg-blue-100 before:content-[""] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-5 before:bg-blue-600 before:rounded-r-sm'
                      : isDarkMode
                      ? 'text-gray-300 hover:text-blue-300 hover:bg-gray-800'
                      : 'text-gray-700 hover:text-blue-800 hover:bg-slate-50'
                  }`}
                >
                  {item.name}
                </button>
              )}
            </div>
          ))}

          <hr className={`my-4 ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`} />

          {isLoggedIn ? (
            <div className={`pt-3 border-t mt-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center px-4 py-2 gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  {currentUser?.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold text-sm break-words ${
                    isDarkMode ? 'text-gray-50' : 'text-gray-900'
                  }`}>
                    {currentUser?.username || 'Loading...'}
                  </div>
                  <div className={`text-xs mt-0.5 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {currentUser?.position || 'Please Wait...'}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleUserAction('/profile')}
                  className="bg-gradient-to-br from-sky-500 to-blue-600 border-none rounded-xl px-6 py-3 text-white font-semibold text-sm cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 shadow-lg w-full hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl"
                >
                  <User size={16} />
                  View Profile
                </button>
                <button
                  onClick={() => handleUserAction('/settings')}
                  className="bg-gradient-to-br from-sky-500 to-blue-600 border-none rounded-xl px-6 py-3 text-white font-semibold text-sm cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 shadow-lg w-full hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl"
                >
                  <Settings size={16} />
                  Settings
                </button>
                <button
                  onClick={handleSignOut}
                  className="bg-gradient-to-br from-sky-500 to-blue-600 border-none rounded-xl px-6 py-3 text-white font-semibold text-sm cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 shadow-lg w-full hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="bg-gradient-to-br from-sky-500 to-blue-600 border-none rounded-xl px-6 py-4 text-white font-semibold text-sm cursor-pointer transition-all duration-300 flex items-center justify-center gap-3 shadow-lg w-full mt-4 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl"
            >
              <User size={16} />
              Sign In
            </button>
          )}
        </div>
      )}
    </>
  );
};

export default Header;