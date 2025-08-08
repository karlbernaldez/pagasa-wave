import { logoutUser } from '../api/auth';
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon, User, LogOut, Settings } from 'lucide-react';

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

const Header = ({ isDarkMode, setIsDarkMode, isLoggedIn, user, onSignOut }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleUserDropdown = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Charts', href: '/charts' },
    { name: 'WaveLab', href: '/edit' },
    { name: 'Services', href: '#services' },
    { name: 'About', href: '#about' },
    { name: 'Contact', href: '#contact' }
  ];

  const isActiveRoute = (href) => {
    if (href.startsWith('#')) {
      // For hash links, check if we're on the home page and the hash matches
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
  };

  const handleSignOut = () => {
    if (onSignOut) {
      onSignOut();
    }
    logoutUser();
    setIsUserDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleDropdownAction = (action) => {
    setIsUserDropdownOpen(false);
    if (action === 'profile') {
      navigate('/profile');
    } else if (action === 'settings') {
      navigate('/settings');
    }
  };

  return (
    <HeaderContainer isDarkMode={isDarkMode}>
      <Nav>
        <Logo>
          <LogoIcon>
            <img src="/pagasa-logo.png" alt="PAGASA logo" style={{ width: '24px', height: '24px' }} />
          </LogoIcon>
          PAGASA
        </Logo>

        <NavLinks isOpen={isMobileMenuOpen} isDarkMode={isDarkMode}>
          {navItems.map((item, index) => (
            <NavLink
              key={index}
              onClick={() => handleNavClick(item.href)}
              isDarkMode={isDarkMode}
              isActive={isActiveRoute(item.href)}
            >
              {item.name}
            </NavLink>
          ))}

          {isMobileMenuOpen && !isLoggedIn && (
            <MobileSignInButton onClick={() => navigate('/login')}>
              <User size={16} />
              Sign In
            </MobileSignInButton>
          )}

          {isMobileMenuOpen && isLoggedIn && (
            <MobileUserSection isDarkMode={isDarkMode}>
              <MobileUserInfo>
                <MobileUserAvatar isDarkMode={isDarkMode}>
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                    />
                  ) : (
                    <User size={20} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
                  )}
                </MobileUserAvatar>
                <MobileUserDetails>
                  <MobileUserName isDarkMode={isDarkMode}>
                    {user?.name || 'User'}
                  </MobileUserName>
                  <MobileUserRole isDarkMode={isDarkMode}>
                    {user?.role || 'Member'}
                  </MobileUserRole>
                </MobileUserDetails>
              </MobileUserInfo>

              <MobileSignInButton onClick={() => handleDropdownAction('profile')}>
                <User size={16} />
                View Profile
              </MobileSignInButton>
              <MobileSignInButton onClick={() => handleDropdownAction('settings')}>
                <Settings size={16} />
                Settings
              </MobileSignInButton>
              <MobileSignInButton onClick={handleSignOut}>
                <LogOut size={16} />
                Sign Out
              </MobileSignInButton>
            </MobileUserSection>
          )}
        </NavLinks>

        <ButtonGroup>
          <ThemeToggle onClick={() => setIsDarkMode(!isDarkMode)} isDarkMode={isDarkMode}>
            {isDarkMode ? <Sun /> : <Moon />}
          </ThemeToggle>

          {!isLoggedIn ? (
            <SignInButton onClick={() => navigate('/login')}>
              <User size={16} />
              Sign In
            </SignInButton>
          ) : (
            <UserDropdownContainer ref={dropdownRef}>
              <UserDropdownTrigger
                onClick={toggleUserDropdown}
                isOpen={isUserDropdownOpen}
                isDarkMode={isDarkMode}
                aria-expanded={isUserDropdownOpen}
                aria-haspopup="true"
              >
                <UserAvatar isDarkMode={isDarkMode}>
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                    />
                  ) : (
                    <User size={16} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
                  )}
                </UserAvatar>
                <UserInfo>
                  <UserName isDarkMode={isDarkMode}>
                    {user?.name || 'User'}
                  </UserName>
                  <UserRole isDarkMode={isDarkMode}>
                    {user?.role || 'Member'}
                  </UserRole>
                </UserInfo>
                <ChevronIcon
                  size={16}
                  color={isDarkMode ? '#9ca3af' : '#6b7280'}
                  isOpen={isUserDropdownOpen}
                />
              </UserDropdownTrigger>

              {isUserDropdownOpen && (
                <DropdownMenu isDarkMode={isDarkMode}>
                  <DropdownHeader isDarkMode={isDarkMode}>
                    <DropdownUserName isDarkMode={isDarkMode}>
                      {user?.name || 'User'}
                    </DropdownUserName>
                    <DropdownUserEmail isDarkMode={isDarkMode}>
                      {user?.email || 'user@example.com'}
                    </DropdownUserEmail>
                    <DropdownUserRole isDarkMode={isDarkMode}>
                      {user?.role || 'Member'}
                    </DropdownUserRole>
                  </DropdownHeader>

                  <DropdownItem
                    onClick={() => handleDropdownAction('profile')}
                    isDarkMode={isDarkMode}
                  >
                    <User size={16} />
                    View Profile
                  </DropdownItem>

                  <DropdownItem
                    onClick={() => handleDropdownAction('settings')}
                    isDarkMode={isDarkMode}
                  >
                    <Settings size={16} />
                    Settings
                  </DropdownItem>

                  <DropdownDivider isDarkMode={isDarkMode} />

                  <DropdownItem
                    onClick={handleSignOut}
                    isDarkMode={isDarkMode}
                    isSignOut={true}
                  >
                    <LogOut size={16} />
                    Sign Out
                  </DropdownItem>
                </DropdownMenu>
              )}
            </UserDropdownContainer>
          )}

          <MobileMenuButton onClick={toggleMobileMenu} isDarkMode={isDarkMode}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </MobileMenuButton>
        </ButtonGroup>
      </Nav>
    </HeaderContainer>
  );
};

export default Header;