import React, { useState, useRef, useEffect } from 'react';
import { Menu, X, Sun, Moon, User, Cloud, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import {
  HeaderContainer,
  Nav,
  Logo,
  LogoIcon,
  ThemeToggle,
  SignInButton,
  MobileMenuButton,
  MobileSignInButton,
  NavLinks,
  ButtonGroup
} from './styles/header';

const NavLink = styled.button`
  padding: 8px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  color: ${props => {
    if (props.isActive) {
      return props.isDarkMode ? '#60a5fa' : '#2563eb';
    }
    return props.isDarkMode ? '#d1d5db' : '#374151';
  }};
  text-decoration: none;
  transition: all 0.2s ease;
  border-radius: 6px;
  position: relative;
  
  &:hover {
    color: ${props => props.isDarkMode ? '#93c5fd' : '#1d4ed8'};
    background-color: ${props => props.isDarkMode ? '#1f2937' : '#f8fafc'};
  }
  
  &:focus {
    outline: 2px solid ${props => props.isDarkMode ? '#3b82f6' : '#2563eb'};
    outline-offset: 2px;
  }
  
  ${props => props.isActive && `
    background-color: ${props.isDarkMode ? '#1e40af20' : '#dbeafe'};
    
    &::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 50%;
      transform: translateX(-50%);
      width: 20px;
      height: 2px;
      background-color: ${props.isDarkMode ? '#60a5fa' : '#2563eb'};
      border-radius: 1px;
    }
  `}
  
  @media (max-width: 768px) {
    width: 100%;
    text-align: left;
    padding: 12px 16px;
    
    ${props => props.isActive && `
      &::after {
        display: none;
      }
      
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 20px;
        background-color: ${props.isDarkMode ? '#60a5fa' : '#2563eb'};
        border-radius: 0 2px 2px 0;
      }
    `}
  }
`;

const UserDropdownContainer = styled.div`
  position: relative;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const UserDropdownTrigger = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  background-color: ${props => props.isOpen ? 
    (props.isDarkMode ? '#374151' : '#f3f4f6') : 'transparent'};
  
  &:hover {
    background-color: ${props => props.isDarkMode ? '#374151' : '#f3f4f6'};
  }
  
  &:focus {
    outline: 2px solid ${props => props.isDarkMode ? '#3b82f6' : '#2563eb'};
    outline-offset: 2px;
  }
`;

const UserAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  background-color: ${props => props.isDarkMode ? '#374151' : '#f3f4f6'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const UserInfo = styled.div`
  text-align: left;
  min-width: 0;
  
  @media (max-width: 1024px) {
    display: none;
  }
`;

const UserName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.isDarkMode ? '#f9fafb' : '#111827'};
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
`;

const UserRole = styled.div`
  font-size: 12px;
  color: ${props => props.isDarkMode ? '#9ca3af' : '#6b7280'};
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
`;

const ChevronIcon = styled(ChevronDown)`
  transition: transform 0.2s ease;
  transform: ${props => props.isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
  flex-shrink: 0;
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background-color: ${props => props.isDarkMode ? '#1f2937' : '#ffffff'};
  border: 1px solid ${props => props.isDarkMode ? '#374151' : '#e5e7eb'};
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  min-width: 240px;
  z-index: 50;
  overflow: hidden;
  
  @media (max-width: 480px) {
    right: -20px;
    min-width: 200px;
  }
`;

const DropdownHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid ${props => props.isDarkMode ? '#374151' : '#e5e7eb'};
  background-color: ${props => props.isDarkMode ? '#111827' : '#f9fafb'};
`;

const DropdownUserName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.isDarkMode ? '#f9fafb' : '#111827'};
  margin-bottom: 2px;
  word-break: break-word;
`;

const DropdownUserEmail = styled.div`
  font-size: 12px;
  color: ${props => props.isDarkMode ? '#9ca3af' : '#6b7280'};
  word-break: break-word;
`;

const DropdownUserRole = styled.div`
  font-size: 11px;
  color: ${props => props.isDarkMode ? '#6b7280' : '#9ca3af'};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 4px;
  font-weight: 500;
`;

const DropdownItem = styled.button`
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: ${props => props.isSignOut ? '#ef4444' : 
    (props.isDarkMode ? '#f9fafb' : '#111827')};
  transition: background-color 0.15s ease;
  text-align: left;
  
  &:hover {
    background-color: ${props => props.isSignOut ? '#fef2f2' :
      (props.isDarkMode ? '#374151' : '#f3f4f6')};
  }
  
  &:focus {
    outline: 2px solid ${props => props.isDarkMode ? '#3b82f6' : '#2563eb'};
    outline-offset: -2px;
  }
`;

const DropdownDivider = styled.div`
  height: 1px;
  background-color: ${props => props.isDarkMode ? '#374151' : '#e5e7eb'};
  margin: 4px 0;
`;

const MobileUserSection = styled.div`
  padding: 12px 0;
  border-top: 1px solid ${props => props.isDarkMode ? '#374151' : '#e5e7eb'};
  margin-top: 8px;
  
  @media (min-width: 769px) {
    display: none;
  }
`;

const MobileUserInfo = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 16px;
  gap: 12px;
  margin-bottom: 8px;
`;

const MobileUserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  background-color: ${props => props.isDarkMode ? '#374151' : '#f3f4f6'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const MobileUserDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const MobileUserName = styled.div`
  font-weight: 600;
  color: ${props => props.isDarkMode ? '#f9fafb' : '#111827'};
  font-size: 14px;
  word-break: break-word;
`;

const MobileUserRole = styled.div`
  font-size: 12px;
  color: ${props => props.isDarkMode ? '#9ca3af' : '#6b7280'};
  margin-top: 2px;
`;

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