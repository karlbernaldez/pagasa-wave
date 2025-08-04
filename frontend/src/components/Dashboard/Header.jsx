import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Bell, Search, Settings, LogOut, User, ChevronDown, Menu } from 'lucide-react';
import { fetchUserDetails } from '../../api/userAPI'; // Adjust path as needed

const Header = styled.header`
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid rgba(229, 231, 235, 0.5);
  position: sticky;
  top: 0;
  z-index: 40;
  margin-left: -1.2rem;
`;

const HeaderContainer = styled.div`
  padding: 16px 16px;
  
  @media (min-width: 640px) {
    padding: 16px 24px;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const MobileMenuButton = styled.button`
  padding: 8px;
  border-radius: 12px;
  border: none;
  background: none;
  cursor: pointer;
  color: #6b7280;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #f3f4f6;
  }
  
  @media (min-width: 1024px) {
    display: none;
  }
`;

const TitleSection = styled.div`
  min-width: 0;
  flex: 1;
`;

const PageTitle = styled.h2`
  font-size: 20px;
  font-weight: bold;
  color: #111827;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  @media (min-width: 640px) {
    font-size: 24px;
  }
`;

const PageDescription = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 0;
  display: none;
  
  @media (min-width: 640px) {
    display: block;
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  
  @media (min-width: 640px) {
    gap: 16px;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  display: none;
  
  @media (min-width: 768px) {
    display: block;
  }
`;

const SearchWrapper = styled.div`
  position: relative;
  
  &:focus-within svg {
    color: #3b82f6;
  }
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  width: 16px;
  height: 16px;
  transition: color 0.2s ease;
`;

const SearchInput = styled.input`
  width: 256px;
  padding: 10px 16px 10px 40px;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-size: 14px;
  outline: none;
  transition: all 0.2s ease;
  
  &:focus {
    background-color: white;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const MobileSearchButton = styled.button`
  padding: 10px;
  border-radius: 12px;
  border: none;
  background: none;
  cursor: pointer;
  color: #6b7280;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #f3f4f6;
  }
  
  @media (min-width: 768px) {
    display: none;
  }
`;

const NotificationButton = styled.button`
  position: relative;
  padding: 10px;
  border-radius: 12px;
  border: none;
  background: none;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f3f4f6;
    color: #111827;
  }
`;

const NotificationBadge = styled.div`
  position: absolute;
  top: -4px;
  right: -4px;
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, #ef4444, #ec4899);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  span {
    color: white;
    font-size: 12px;
    font-weight: 500;
  }
`;

const UserButton = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 12px;
  border: none;
  background: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #f3f4f6;
  }
`;

const UserAvatar = styled.div`
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  span {
    color: white;
    font-size: 14px;
    font-weight: 600;
  }
`;

const UserInfo = styled.div`
  text-align: left;
  display: none;
  
  @media (min-width: 640px) {
    display: block;
  }
`;

const UserName = styled.p`
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin: 0;
`;

const UserRole = styled.p`
  font-size: 12px;
  color: #6b7280;
  margin: 0;
`;

const ChevronIcon = styled(ChevronDown)`
  width: 16px;
  height: 16px;
  color: #9ca3af;
  transition: transform 0.2s ease;
  transform: ${props => props.$isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

const DropdownOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 10;
`;

const NotificationDropdown = styled.div`
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  width: 320px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: 1px solid #e5e7eb;
  z-index: 20;
  overflow: hidden;
`;

const NotificationHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  h3 {
    font-weight: 600;
    color: #111827;
    margin: 0;
  }
`;

const NotificationBadgeSmall = styled.span`
  font-size: 12px;
  background-color: #dbeafe;
  color: #1d4ed8;
  padding: 4px 8px;
  border-radius: 12px;
`;

const NotificationList = styled.div`
  max-height: 320px;
  overflow-y: auto;
`;

const NotificationItem = styled.div`
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  
  &:hover {
    background-color: #f9fafb;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const NotificationDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 8px;
  background-color: ${props => {
    switch(props.type) {
      case 'user': return '#10b981';
      case 'system': return '#f59e0b';
      default: return '#3b82f6';
    }
  }};
`;

const NotificationContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const NotificationTitle = styled.p`
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  margin: 0 0 4px 0;
`;

const NotificationTime = styled.p`
  font-size: 12px;
  color: #6b7280;
  margin: 0;
`;

const NotificationFooter = styled.div`
  padding: 12px;
  background-color: #f9fafb;
  
  button {
    width: 100%;
    text-align: center;
    font-size: 14px;
    color: #3b82f6;
    font-weight: 500;
    border: none;
    background: none;
    cursor: pointer;
    padding: 4px;
    transition: color 0.2s ease;
    
    &:hover {
      color: #1d4ed8;
    }
  }
`;

const UserDropdown = styled.div`
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  width: 224px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: 1px solid #e5e7eb;
  z-index: 20;
  overflow: hidden;
`;

const UserDropdownHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const UserDropdownAvatar = styled.div`
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  span {
    color: white;
    font-weight: 600;
  }
`;

const UserDropdownInfo = styled.div`
  p:first-child {
    font-weight: 600;
    color: #111827;
    margin: 0 0 2px 0;
  }
  
  p:last-child {
    font-size: 14px;
    color: #6b7280;
    margin: 0;
  }
`;

const UserDropdownMenu = styled.div`
  padding: 8px 0;
`;

const UserDropdownItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: none;
  background: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
  text-align: left;
  
  &:hover {
    background-color: #f9fafb;
  }
  
  svg {
    width: 16px;
    height: 16px;
    color: #9ca3af;
  }
  
  span {
    font-size: 14px;
    color: #374151;
  }
`;

const UserDropdownDivider = styled.div`
  border-top: 1px solid #e5e7eb;
  padding: 8px 0;
`;

const LogoutItem = styled(UserDropdownItem)`
  &:hover {
    background-color: #fef2f2;
    
    svg {
      color: #ef4444;
    }
    
    span {
      color: #dc2626;
    }
  }
`;

// Helper function to get user initials
const getUserInitials = (firstName, lastName, username) => {
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  if (username) {
    return username.slice(0, 2).toUpperCase();
  }
  return 'U';
};

// Helper function to get full name
const getFullName = (firstName, lastName, username) => {
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  if (username) {
    return username;
  }
  return 'User';
};

const HeaderComponent = ({ activeTab, onMobileMenuToggle }) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get user data from localStorage or context
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const user = JSON.parse(localStorage.getItem("user")); // Assuming you store userId in localStorage
        
        if (token && user) {
          const userData = await fetchUserDetails(user.id, token);
          setCurrentUser(userData);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        // You might want to redirect to login or show an error
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const notifications = [
    { id: 1, title: 'New user registered', time: '2 minutes ago', type: 'user' },
    { id: 2, title: 'Server maintenance scheduled', time: '1 hour ago', type: 'system' },
    { id: 3, title: 'Analytics report ready', time: '3 hours ago', type: 'report' }
  ];

  const getPageTitle = () => {
    const titles = {
      dashboard: 'Dashboard Overview',
      users: 'User Management',
      content: 'Content Management',
      analytics: 'Analytics & Reports',
      settings: 'Settings & Configuration'
    };
    return titles[activeTab] || 'Dashboard';
  };

  const getPageDescription = () => {
    const descriptions = {
      dashboard: 'Monitor your key metrics and recent activity',
      users: 'Manage user accounts and permissions',
      content: 'Create, edit and organize your content',
      analytics: 'View detailed analytics and performance data',
      settings: 'Configure system settings and preferences'
    };
    return descriptions[activeTab] || 'Welcome back! Here\'s what\'s happening.';
  };

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    
    // Redirect to login page
    window.location.href = '/login'; // or use your router's navigation
  };

  // Show loading state or default values while user data is loading
  const userInitials = currentUser ? getUserInitials(currentUser.firstName, currentUser.lastName, currentUser.username) : 'U';
  const userName = currentUser ? getFullName(currentUser.firstName, currentUser.lastName, currentUser.username) : 'Loading...';
  const userRole = currentUser ? (currentUser.role === 'admin' ? 'Administrator' : 'User') : 'Loading...';
  const userEmail = currentUser ? currentUser.email : 'Loading...';

  return (
    <Header>
      <HeaderContainer>
        <HeaderContent>
          {/* Left Section */}
          <LeftSection>
            {/* Mobile Menu Button */}
            {onMobileMenuToggle && (
              <MobileMenuButton onClick={onMobileMenuToggle}>
                <Menu size={24} />
              </MobileMenuButton>
            )}
            
            {/* Page Title */}
            <TitleSection>
              <PageTitle>{getPageTitle()}</PageTitle>
              <PageDescription>{getPageDescription()}</PageDescription>
            </TitleSection>
          </LeftSection>

          {/* Right Section */}
          <RightSection>
            {/* Search Bar - Hidden on small screens */}
            <SearchContainer>
              <SearchWrapper>
                <SearchIcon />
                <SearchInput placeholder="Search..." />
              </SearchWrapper>
            </SearchContainer>

            {/* Mobile Search Button */}
            <MobileSearchButton>
              <Search size={20} />
            </MobileSearchButton>

            {/* Notifications */}
            <div style={{ position: 'relative' }}>
              <NotificationButton
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={20} />
                <NotificationBadge>
                  <span>3</span>
                </NotificationBadge>
              </NotificationButton>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <>
                  <DropdownOverlay onClick={() => setShowNotifications(false)} />
                  <NotificationDropdown>
                    <NotificationHeader>
                      <h3>Notifications</h3>
                      <NotificationBadgeSmall>
                        {notifications.length} new
                      </NotificationBadgeSmall>
                    </NotificationHeader>
                    <NotificationList>
                      {notifications.map((notification) => (
                        <NotificationItem key={notification.id}>
                          <NotificationDot type={notification.type} />
                          <NotificationContent>
                            <NotificationTitle>{notification.title}</NotificationTitle>
                            <NotificationTime>{notification.time}</NotificationTime>
                          </NotificationContent>
                        </NotificationItem>
                      ))}
                    </NotificationList>
                    <NotificationFooter>
                      <button>View all notifications</button>
                    </NotificationFooter>
                  </NotificationDropdown>
                </>
              )}
            </div>

            {/* User Profile Dropdown */}
            <div style={{ position: 'relative' }}>
              <UserButton
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                disabled={loading}
              >
                <UserAvatar>
                  <span>{userInitials}</span>
                </UserAvatar>
                <UserInfo>
                  <UserName>{userName}</UserName>
                  <UserRole>{userRole}</UserRole>
                </UserInfo>
                <ChevronIcon $isOpen={showUserDropdown} />
              </UserButton>

              {/* User Dropdown Menu */}
              {showUserDropdown && (
                <>
                  <DropdownOverlay onClick={() => setShowUserDropdown(false)} />
                  <UserDropdown>
                    <UserDropdownHeader>
                      <UserDropdownAvatar>
                        <span>{userInitials}</span>
                      </UserDropdownAvatar>
                      <UserDropdownInfo>
                        <p>{userName}</p>
                        <p>{userEmail}</p>
                      </UserDropdownInfo>
                    </UserDropdownHeader>
                    
                    <UserDropdownMenu>
                      <UserDropdownItem>
                        <User />
                        <span>Profile Settings</span>
                      </UserDropdownItem>
                      <UserDropdownItem>
                        <Settings />
                        <span>Preferences</span>
                      </UserDropdownItem>
                    </UserDropdownMenu>
                    
                    <UserDropdownDivider>
                      <LogoutItem onClick={handleLogout}>
                        <LogOut />
                        <span>Sign Out</span>
                      </LogoutItem>
                    </UserDropdownDivider>
                  </UserDropdown>
                </>
              )}
            </div>
          </RightSection>
        </HeaderContent>
      </HeaderContainer>
    </Header>
  );
};

export default HeaderComponent;