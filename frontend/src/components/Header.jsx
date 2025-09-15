import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon, User, LogOut, Settings } from 'lucide-react';
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

const Header = ({ isDarkMode, setIsDarkMode }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true); // New loading state
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const toggleUserDropdown = () => setIsUserDropdownOpen(!isUserDropdownOpen);

  const AUTH_API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL}/api/auth`;

  const checkRoute = `${AUTH_API_BASE_URL}/check`;

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
          setIsLoggedIn(false); // Authentication failed
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setIsLoggedIn(false); // Error, logout user
      } finally {
        setLoading(false); // Set loading to false after data is fetched
      }
    };

    loadUserData();
  }, []);

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Charts', href: '/charts' },
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
  };

  const handleSignOut = () => {
    logoutUser();
    setIsLoggedIn(false); // Set to false after logout
    setIsUserDropdownOpen(false);
    setIsMobileMenuOpen(false);
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

          {isMobileMenuOpen && !isLoggedIn && !loading && (
            <MobileSignInButton onClick={() => navigate('/login')}>
              <User size={16} />
              Sign In
            </MobileSignInButton>
          )}

          {isMobileMenuOpen && isLoggedIn && !loading && (
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

              <MobileSignInButton onClick={() => handleSignOut()}>
                <LogOut size={16} />
                Sign Out
              </MobileSignInButton>
            </MobileUserSection>
          )}

          {loading && (
            <div>Loading...</div> // You can replace this with a spinner or a loading component
          )}
        </NavLinks>

        <ButtonGroup>
          <ThemeToggle onClick={() => setIsDarkMode(!isDarkMode)} isDarkMode={isDarkMode}>
            {isDarkMode ? <Sun /> : <Moon />}
          </ThemeToggle>

          {!isLoggedIn && !loading ? (
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

                  <DropdownItem onClick={() => navigate('/profile')} isDarkMode={isDarkMode}>
                    <User size={16} />
                    View Profile
                  </DropdownItem>

                  <DropdownItem onClick={() => navigate('/settings')} isDarkMode={isDarkMode}>
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

          <MobileMenuButton onClick={toggleMobileMenu} isDarkMode={isDarkMode}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </MobileMenuButton>
        </ButtonGroup>
      </Nav>
    </HeaderContainer>
  );
};

export default Header;
