import styled from 'styled-components';
import { ChevronDown } from 'lucide-react';

// Header Styled Components - Updated to match Hero Section
export const HeaderContainer = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  backdrop-filter: blur(20px);
  border-bottom: 1px solid ${props => props.isDarkMode
    ? 'rgba(75, 85, 99, 0.3)'
    : 'rgba(229, 231, 235, 0.2)'};
  transition: all 0.3s ease;
`;

export const Nav = styled.nav`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 4rem;
  
  @media (max-width: 768px) {
    padding: 0 1rem;
  }
`;

export const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  cursor: pointer;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

export const LogoIcon = styled.div`
  width: 2.25rem;
  height: 2.25rem;
  background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
  border-radius: 0.625rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(14, 165, 233, 0.4);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 8px 25px rgba(14, 165, 233, 0.6);
    transform: translateY(-1px);
  }

  svg {
    width: 1.375rem;
    height: 1.375rem;
    color: white;
  }
`;

export const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  
  @media (max-width: 768px) {
    display: ${props => props.isOpen ? 'flex' : 'none'};
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: ${props => props.isDarkMode
    ? 'rgba(17, 24, 39, 0.98)'
    : 'rgba(255, 255, 255, 0.98)'};
    backdrop-filter: blur(20px);
    flex-direction: column;
    padding: 2rem;
    gap: 1.5rem;
    border-bottom: 1px solid ${props => props.isDarkMode
    ? 'rgba(75, 85, 99, 0.3)'
    : 'rgba(229, 231, 235, 0.2)'};
    box-shadow: ${props => props.isDarkMode
    ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
    : '0 25px 50px -12px rgba(0, 0, 0, 0.1)'};
  }
`;

export const NavLink = styled.button`
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

export const ButtonGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const ThemeToggle = styled.button`
  background: ${props => props.isDarkMode
    ? 'rgba(31, 41, 55, 0.8)'
    : 'rgba(255, 255, 255, 0.9)'};
  border: 1px solid ${props => props.isDarkMode
    ? 'rgba(75, 85, 99, 0.3)'
    : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 0.75rem;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(20px);
  box-shadow: ${props => props.isDarkMode
    ? '0 4px 15px rgba(0, 0, 0, 0.2)'
    : '0 4px 15px rgba(0, 0, 0, 0.05)'};
  
  &:hover {
    background: ${props => props.isDarkMode
    ? 'rgba(31, 41, 55, 1)'
    : 'rgba(255, 255, 255, 1)'};
    transform: translateY(-2px) scale(1.05);
    box-shadow: ${props => props.isDarkMode
    ? '0 8px 25px rgba(0, 0, 0, 0.3)'
    : '0 8px 25px rgba(0, 0, 0, 0.1)'};
    border-color: ${props => props.isDarkMode
    ? 'rgba(75, 85, 99, 0.4)'
    : 'rgba(229, 231, 235, 0.3)'};
  }
  
  &:active {
    transform: translateY(0) scale(0.95);
  }
  
  svg {
    width: 1.25rem;
    height: 1.25rem;
    color: ${props => props.isDarkMode ? '#60a5fa' : '#0ea5e9'};
    transition: all 0.3s ease;
  }
  
  &:hover svg {
    transform: rotate(180deg) scale(1.1);
  }
`;

export const SignInButton = styled.button`
  background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
  border: none;
  border-radius: 0.75rem;
  padding: 0.75rem 1.5rem;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 15px rgba(14, 165, 233, 0.4);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover::before {
    left: 100%;
  }
  
  &:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 8px 25px rgba(14, 165, 233, 0.6);
    background: linear-gradient(135deg, #0284c7 0%, #1d4ed8 100%);
  }
  
  &:active {
    transform: translateY(0) scale(0.98);
  }

  @media (max-width: 640px) {
    display: none;
  }
`;

export const MobileMenuButton = styled.button`
  display: none;
  background: ${props => props.isDarkMode
    ? 'rgba(31, 41, 55, 0.8)'
    : 'rgba(255, 255, 255, 0.9)'};
  border: 1px solid ${props => props.isDarkMode
    ? 'rgba(75, 85, 99, 0.3)'
    : 'rgba(255, 255, 255, 0.2)'};
  cursor: pointer;
  padding: 0.75rem;
  color: ${props => props.isDarkMode ? '#d1d5db' : '#4b5563'};
  transition: all 0.3s ease;
  border-radius: 0.75rem;
  backdrop-filter: blur(20px);
  box-shadow: ${props => props.isDarkMode
    ? '0 4px 15px rgba(0, 0, 0, 0.2)'
    : '0 4px 15px rgba(0, 0, 0, 0.05)'};
  
  &:hover {
    color: ${props => props.isDarkMode ? '#ffffff' : '#111827'};
    background: ${props => props.isDarkMode
    ? 'rgba(31, 41, 55, 1)'
    : 'rgba(255, 255, 255, 1)'};
    transform: translateY(-2px) scale(1.05);
    box-shadow: ${props => props.isDarkMode
    ? '0 8px 25px rgba(0, 0, 0, 0.3)'
    : '0 8px 25px rgba(0, 0, 0, 0.1)'};
  }
  
  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  svg {
    width: 1.25rem;
    height: 1.25rem;
    transition: transform 0.3s ease;
  }
`;

export const MobileSignInButton = styled.button`
  background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
  border: none;
  border-radius: 0.75rem;
  padding: 1rem 2rem;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  box-shadow: 0 4px 15px rgba(14, 165, 233, 0.4);
  width: 100%;
  margin-top: 1.5rem;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover::before {
    left: 100%;
  }
  
  &:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 8px 25px rgba(14, 165, 233, 0.6);
    background: linear-gradient(135deg, #0284c7 0%, #1d4ed8 100%);
  }
`;

export const UserDropdownContainer = styled.div`
  position: relative;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

export const UserDropdownTrigger = styled.button`
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

export const UserAvatar = styled.div`
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

export const UserInfo = styled.div`
  text-align: left;
  min-width: 0;
  
  @media (max-width: 1024px) {
    display: none;
  }
`;

export const UserName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.isDarkMode ? '#f9fafb' : '#111827'};
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
`;

export const UserRole = styled.div`
  font-size: 12px;
  color: ${props => props.isDarkMode ? '#9ca3af' : '#6b7280'};
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
`;

export const ChevronIcon = styled(ChevronDown)`
  transition: transform 0.2s ease;
  transform: ${props => props.isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
  flex-shrink: 0;
`;

export const DropdownMenu = styled.div`
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

export const DropdownHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid ${props => props.isDarkMode ? '#374151' : '#e5e7eb'};
  background-color: ${props => props.isDarkMode ? '#111827' : '#f9fafb'};
`;

export const DropdownUserName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.isDarkMode ? '#f9fafb' : '#111827'};
  margin-bottom: 2px;
  word-break: break-word;
`;

export const DropdownUserEmail = styled.div`
  font-size: 12px;
  color: ${props => props.isDarkMode ? '#9ca3af' : '#6b7280'};
  word-break: break-word;
`;

export const DropdownUserRole = styled.div`
  font-size: 11px;
  color: ${props => props.isDarkMode ? '#6b7280' : '#9ca3af'};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 4px;
  font-weight: 500;
`;

export const DropdownItem = styled.button`
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

export const DropdownDivider = styled.div`
  height: 1px;
  background-color: ${props => props.isDarkMode ? '#374151' : '#e5e7eb'};
  margin: 4px 0;
`;

export const MobileUserSection = styled.div`
  padding: 12px 0;
  border-top: 1px solid ${props => props.isDarkMode ? '#374151' : '#e5e7eb'};
  margin-top: 8px;
  
  @media (min-width: 769px) {
    display: none;
  }
`;

export const MobileUserInfo = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 16px;
  gap: 12px;
  margin-bottom: 8px;
`;

export const MobileUserAvatar = styled.div`
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

export const MobileUserDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

export const MobileUserName = styled.div`
  font-weight: 600;
  color: ${props => props.isDarkMode ? '#f9fafb' : '#111827'};
  font-size: 14px;
  word-break: break-word;
`;

export const MobileUserRole = styled.div`
  font-size: 12px;
  color: ${props => props.isDarkMode ? '#9ca3af' : '#6b7280'};
  margin-top: 2px;
`;