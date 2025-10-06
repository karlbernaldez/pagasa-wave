import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon, User, LogOut, Settings, Wind, Activity, Eye, ChevronDown } from 'lucide-react';
import { fetchUserDetails } from '../api/userAPI';
import { logoutUser } from '../api/auth';

// Layout & Navigation
import { HeaderContainer, Nav, Logo, LogoIcon, ThemeToggle, SignInButton } from './styles/header';
import { MobileMenuButton, MobileSignInButton, NavLink, NavLinks, ButtonGroup } from './styles/header';
import { UserDropdownContainer, UserDropdownTrigger } from './styles/header';

// User Info & Dropdown
import { UserAvatar, UserInfo, UserName, UserRole, ChevronIcon } from './styles/header';
import { DropdownMenu, DropdownHeader, DropdownUserName, DropdownUserEmail, DropdownUserRole } from './styles/header';
import { DropdownItem, DropdownDivider } from './styles/header';

// Mobile User Info
import { MobileUserSection, MobileUserInfo, MobileUserAvatar, MobileUserDetails } from './styles/header';
import { MobileUserName, MobileUserRole } from './styles/header';

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
    setIsChartDropdownOpen(false); // <--- New: Closes chart dropdown on any main nav click
  };

  const handleUserAction = (path) => {
    navigate(path);
    setIsUserDropdownOpen(false); // <--- New: Closes user dropdown after action
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
      <HeaderContainer isDarkMode={isDarkMode}>
        <Nav>
          <Logo>
            <LogoIcon>
              <img src="/pagasa-logo.png" alt="PAGASA logo" style={{ width: '24px', height: '24px' }} />
            </LogoIcon>
            PAGASA
          </Logo>

          <NavLinks className="desktop-only" isDarkMode={isDarkMode}>
            {navItems.map((item, index) => (
              <div key={index} className="relative">
                {item.hasDropdown ? (
                  <div
                    className="relative"
                    ref={chartDropdownRef}
                    onMouseEnter={() => handleChartHover(true)}
                    onMouseLeave={() => handleChartHover(false)}
                  >
                    <NavLink
                      onClick={() => handleNavClick(item.href)}
                      isDarkMode={isDarkMode}
                      isActive={isActiveRoute(item.href)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      {item.name}
                      <ChevronDown 
                        size={14} 
                        style={{
                          transform: isChartDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease',
                          color: isDarkMode ? '#9ca3af' : '#6b7280'
                        }}
                      />
                    </NavLink>

                    {isChartDropdownOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: '0',
                          marginTop: '8px',
                          width: '280px',
                          borderRadius: '12px',
                          backdropFilter: 'blur(16px)',
                          border: `1px solid ${isDarkMode ? 'rgba(71, 85, 105, 0.5)' : 'rgba(255, 255, 255, 0.5)'}`,
                          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                          zIndex: 50,
                          background: isDarkMode 
                            ? 'rgba(30, 41, 59, 0.9)' 
                            : 'rgba(255, 255, 255, 0.9)',
                          padding: '8px',
                          animation: 'dropdownFadeIn 0.2s ease-out'
                        }}
                      >
                        <div style={{
                          padding: '12px 16px',
                          borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                          marginBottom: '8px'
                        }}>
                          <h4 style={{
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: isDarkMode ? '#ffffff' : '#1e293b',
                            margin: '0 0 4px 0'
                          }}>
                            Chart Types
                          </h4>
                          <p style={{
                            fontSize: '12px',
                            color: isDarkMode ? '#94a3b8' : '#64748b',
                            margin: '0'
                          }}>
                            Select your preferred chart display
                          </p>
                        </div>

                        {chartTypes.map((type) => (
                          <button
                            key={type.id}
                            onClick={() => handleChartTypeSelect(type.id)}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '12px',
                              borderRadius: '8px',
                              border: 'none',
                              background: activeChartType === type.id
                                ? 'linear-gradient(to right, #3b82f6, #06b6d4)'
                                : 'transparent',
                              color: activeChartType === type.id
                                ? '#ffffff'
                                : isDarkMode ? '#d1d5db' : '#374151',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              marginBottom: '4px'
                            }}
                            onMouseEnter={(e) => {
                              if (activeChartType !== type.id) {
                                e.target.style.background = isDarkMode ? 'rgba(71, 85, 105, 0.5)' : 'rgba(248, 250, 252, 1)';
                                e.target.style.color = isDarkMode ? '#ffffff' : '#1e293b';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (activeChartType !== type.id) {
                                e.target.style.background = 'transparent';
                                e.target.style.color = isDarkMode ? '#d1d5db' : '#374151';
                              }
                            }}
                          >
                            <type.icon size={18} />
                            <div style={{ flex: 1, textAlign: 'left' }}>
                              <div style={{ 
                                fontWeight: '600', 
                                fontSize: '14px',
                                marginBottom: '2px'
                              }}>
                                {type.name}
                              </div>
                              <div style={{ 
                                fontSize: '12px', 
                                opacity: activeChartType === type.id ? 0.9 : 0.7
                              }}>
                                {type.description}
                              </div>
                            </div>
                            {activeChartType === type.id && (
                              <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: '#ffffff'
                              }} />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <NavLink
                    onClick={() => handleNavClick(item.href)}
                    isDarkMode={isDarkMode}
                    isActive={isActiveRoute(item.href)}
                  >
                    {item.name}
                  </NavLink>
                )}
              </div>
            ))}
          </NavLinks>

          <ButtonGroup>
            <ThemeToggle onClick={() => setIsDarkMode(!isDarkMode)} isDarkMode={isDarkMode}>
              {isDarkMode ? <Sun /> : <Moon />}
            </ThemeToggle>

            {!isLoggedIn && !loading ? (
              <SignInButton className="desktop-only" onClick={() => navigate('/login')}>
                <User size={16} />
                Sign In
              </SignInButton>
            ) : (
              <UserDropdownContainer ref={dropdownRef} className="desktop-only">
                <UserDropdownTrigger
                  onClick={toggleUserDropdown}
                  isOpen={isUserDropdownOpen}
                  isDarkMode={isDarkMode}
                >
                  <UserAvatar isDarkMode={isDarkMode}>
                    {currentUser?.avatar ? (
                      <img src={currentUser.avatar} alt={currentUser.username} />
                    ) : (
                      <User size={16} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
                    )}
                  </UserAvatar>
                  <UserInfo>
                    <UserName isDarkMode={isDarkMode}>
                      {currentUser?.username || 'Loading...'}
                    </UserName>
                    <UserRole isDarkMode={isDarkMode}>
                      {currentUser?.position || 'Please Wait...'}
                    </UserRole>
                  </UserInfo>
                  <ChevronIcon size={16} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
                </UserDropdownTrigger>

                {isUserDropdownOpen && (
                  <DropdownMenu isDarkMode={isDarkMode}>
                    <DropdownHeader isDarkMode={isDarkMode}>
                      <DropdownUserName isDarkMode={isDarkMode}>
                        {currentUser?.username || 'User'}
                      </DropdownUserName>
                      <DropdownUserEmail isDarkMode={isDarkMode}>
                        {currentUser?.email || 'user@example.com'}
                      </DropdownUserEmail>
                      <DropdownUserRole isDarkMode={isDarkMode}>
                        {currentUser?.position || 'Member'}
                      </DropdownUserRole>
                    </DropdownHeader>

                    {/* <--- Updated onClick handlers here */}
                    <DropdownItem onClick={() => handleUserAction('/profile')} isDarkMode={isDarkMode}>
                      <User size={16} />
                      View Profile
                    </DropdownItem>

                    <DropdownItem onClick={() => handleUserAction('/settings')} isDarkMode={isDarkMode}>
                      <Settings size={16} />
                      Settings
                    </DropdownItem>

                    <DropdownDivider isDarkMode={isDarkMode} />

                    <DropdownItem onClick={handleSignOut} isDarkMode={isDarkMode} isSignOut={true}>
                      <LogOut size={16} />
                      Sign Out
                    </DropdownItem>
                  </DropdownMenu>
                )}
              </UserDropdownContainer>
            )}

            <MobileMenuButton className="mobile-only" onClick={toggleMobileMenu} isDarkMode={isDarkMode}>
              {isMobileMenuOpen ? <X /> : <Menu />}
            </MobileMenuButton>
          </ButtonGroup>
        </Nav>
      </HeaderContainer>

      {isMobileMenuOpen && (
        <div 
          className="mobile-menu-overlay" 
          style={{
            position: 'fixed',
            top: '70px',
            left: 0,
            width: '100%',
            height: 'calc(100% - 70px)',
            backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            zIndex: 40,
            padding: '2rem 1rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            animation: 'slideIn 0.3s ease-out'
          }}
        >
          {navItems.map((item, index) => (
            <div key={index}>
              {item.hasDropdown ? (
                <>
                  <NavLink
                    onClick={() => setIsChartDropdownOpen(!isChartDropdownOpen)}
                    isDarkMode={isDarkMode}
                    isActive={isActiveRoute(item.href)}
                    className="mobile-nav-link"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      width: '100%',
                    }}
                  >
                    {item.name}
                    <ChevronDown 
                      size={14} 
                      style={{
                        transform: isChartDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        color: isDarkMode ? '#9ca3af' : '#6b7280'
                      }}
                    />
                  </NavLink>
                  {isChartDropdownOpen && (
                    <div className="mobile-chart-dropdown" style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                      {chartTypes.map(type => (
                        <button
                          key={type.id}
                          onClick={() => handleChartTypeSelect(type.id)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            borderRadius: '8px',
                            background: activeChartType === type.id
                              ? 'linear-gradient(to right, #3b82f6, #06b6d4)'
                              : 'transparent',
                            color: activeChartType === type.id
                              ? '#ffffff'
                              : isDarkMode ? '#d1d5db' : '#374151',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            marginBottom: '4px',
                            textAlign: 'left'
                          }}
                        >
                          <type.icon size={18} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', fontSize: '14px' }}>
                              {type.name}
                            </div>
                            <div style={{ fontSize: '12px', opacity: activeChartType === type.id ? 0.9 : 0.7 }}>
                              {type.description}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <NavLink
                  onClick={() => handleNavClick(item.href)}
                  isDarkMode={isDarkMode}
                  isActive={isActiveRoute(item.href)}
                  className="mobile-nav-link"
                >
                  {item.name}
                </NavLink>
              )}
            </div>
          ))}

          <hr style={{ borderColor: isDarkMode ? '#334155' : '#e2e8f0', margin: '1rem 0' }} />

          {isLoggedIn ? (
            <MobileUserSection isDarkMode={isDarkMode}>
              <MobileUserInfo>
                <MobileUserAvatar isDarkMode={isDarkMode}>
                  {currentUser?.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.username}
                    />
                  ) : (
                    <User size={20} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
                  )}
                </MobileUserAvatar>
                <MobileUserDetails>
                  <MobileUserName isDarkMode={isDarkMode}>
                    {currentUser?.username || 'Loading...'}
                  </MobileUserName>
                  <MobileUserRole isDarkMode={isDarkMode}>
                    {currentUser?.position || 'Please Wait...'}
                  </MobileUserRole>
                </MobileUserDetails>
              </MobileUserInfo>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <MobileSignInButton onClick={() => handleUserAction('/profile')}>
                  <User size={16} />
                  View Profile
                </MobileSignInButton>
                <MobileSignInButton onClick={() => handleUserAction('/settings')}>
                  <Settings size={16} />
                  Settings
                </MobileSignInButton>
                <MobileSignInButton onClick={handleSignOut}>
                  <LogOut size={16} />
                  Sign Out
                </MobileSignInButton>
              </div>
            </MobileUserSection>
          ) : (
            <MobileSignInButton onClick={() => navigate('/login')}>
              <User size={16} />
              Sign In
            </MobileSignInButton>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .mobile-only {
          display: block;
        }

        .desktop-only {
          display: none;
        }

        .mobile-nav-link {
          font-size: 1.5rem;
          padding: 1rem 0;
          width: 100%;
          text-align: left;
        }

        @media (min-width: 768px) {
          .mobile-only {
            display: none;
          }

          .desktop-only {
            display: flex;
          }

          .desktop-nav {
            display: flex;
          }
        }
      `}</style>
    </>
  );
};

export default Header;