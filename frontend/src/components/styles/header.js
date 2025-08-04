import styled from "styled-components";
import { PagasaLogo } from "../Logo";
import { NavLink, useLocation } from "react-router-dom";

// Enhanced breakpoint system
const BREAKPOINTS = {
  xs: '375px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  xxl: '1536px'
};

export const StyledHeaderNavbar = styled.header`
  position: sticky;
  top: 0;
  z-index: 1000;
  width: 100%;
  background: ${({ theme, scrolled }) =>
    scrolled
      ? `${theme.colors.bgHeader}dd`
      : theme.colors.bgHeader
  };
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid ${({ theme }) => theme.colors.toggleBorder}22;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: ${({ scrolled, theme }) =>
    scrolled
      ? `0 4px 20px ${theme.colors.boxShadow}33`
      : 'none'
  };
  pointer-events: ${({ isLoading }) => (isLoading ? "none" : "auto")};
`;

export const Container = styled.div`
  width: 92%;
  margin: 0 auto;
  padding: 0 clamp(1rem, 4vw, 2rem);
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: clamp(60px, 8vh, 80px);
  position: relative;
`;

export const LogoSection = styled.a`
  display: flex;
  align-items: center;
  gap: clamp(8px, 2vw, 16px);
  text-decoration: none;
  flex-shrink: 0;
  padding: 8px 0;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

export const LogoIcon = styled(PagasaLogo)`
  height: clamp(28px, 5vw, 36px) !important;
  width: clamp(28px, 5vw, 36px) !important;
  filter: drop-shadow(0 2px 8px ${({ theme }) => theme.colors.highlight}33);
  transition: all 0.3s ease;
`;

export const LogoText = styled.div`
  color: ${({ theme }) => theme.colors.highlight};
  font-family: ${({ theme }) => theme.fonts.bold};
  font-size: clamp(1.2rem, 4vw, 1.8rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, 
    ${({ theme }) => theme.colors.highlight}, 
    ${({ theme }) => theme.colors.highlight}cc
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  transition: all 0.3s ease;
  
  @media (max-width: ${BREAKPOINTS.sm}) {
    font-size: 1.1rem;
  }
`;

// Centered navigation for desktop
export const DesktopNav = styled.nav`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto; // center align it between left and right
  flex: 1;

  @media (max-width: ${BREAKPOINTS.lg}) {
    display: none;
  }
`;

export const NavLinks = styled.div`
  display: flex;
  gap: clamp(0.5rem, 2vw, 2rem);
`;

export const StyledNavLink = styled(NavLink)`
  position: relative;
  color: ${({ theme }) => theme.colors.textPrimary};
  text-decoration: none;
  padding: 0.75rem 1rem;
  font-size: clamp(0.875rem, 1.8vw, 1rem);
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: ${({ theme }) => theme.colors.toggleBackground};
    border-radius: inherit;
    opacity: 0;
    transform: scale(0.8);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: -1;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 0;
    height: 2px;
    background: linear-gradient(90deg, 
      ${({ theme }) => theme.colors.highlight}, 
      ${({ theme }) => theme.colors.highlight}aa
    );
    border-radius: 2px;
    transform: translateX(-50%);
    transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  &:hover {
    color: ${({ theme }) => theme.colors.highlight};
    transform: translateY(-1px);
    
    &::before {
      opacity: 1;
      transform: scale(1);
    }
    
    &::after {
      width: 70%;
    }
  }

  &.active {
    color: ${({ theme }) => theme.colors.highlight};
    font-weight: 600;
    
    &::before {
      opacity: 1;
      transform: scale(1);
      background: ${({ theme }) => theme.colors.highlight}11;
    }
    
    &::after {
      width: 70%;
    }
  }

  &:active {
    transform: translateY(0);
  }
`;

// Updated right section with better layout
export const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: clamp(0.75rem, 2vw, 1rem);
  flex-shrink: 0;
  min-height: clamp(44px, 6vw, 52px);
`;

// Desktop controls wrapper
export const DesktopControls = styled.div`
  display: flex;
  align-items: center;
  gap: clamp(0.75rem, 2vw, 1rem);
  
  @media (max-width: ${BREAKPOINTS.lg}) {
    display: none;
  }
`;

export const UserSection = styled.div`
  display: flex;
  align-items: center;
  position: relative;
`;

export const UserButton = styled.button`
  display: flex;
  align-items: center;
  gap: clamp(0.5rem, 1.5vw, 0.75rem);
  padding: 0.5rem 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border || '#ccc'};
  background: ${({ theme }) => theme.colors.lightBackground};
  border-radius: 12px;
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  min-width: 0;
  white-space: nowrap;

  &:hover {
    background: ${({ theme }) => theme.colors.toggleBackground}55;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px ${({ theme }) => theme.colors.boxShadow}33;
  }

  &:active {
    transform: translateY(0);
  }
`;

export const UserAvatar = styled.div`
  width: clamp(32px, 4vw, 36px);
  height: clamp(32px, 4vw, 36px);
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.highlight}, ${({ theme }) => theme.colors.highlight}cc);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px ${({ theme }) => theme.colors.highlight}33;
  flex-shrink: 0;
  
  span {
    color: white;
    font-size: clamp(0.75rem, 2vw, 0.875rem);
    font-weight: 600;
    text-transform: uppercase;
  }
`;

export const UserInfo = styled.div`
  text-align: left;
  min-width: 0;
  flex: 1;
  overflow: hidden;
  
  @media (max-width: ${BREAKPOINTS.xl}) {
    display: none;
  }
`;

export const UserName = styled.p`
  font-size: clamp(0.875rem, 1.5vw, 0.9rem);
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 2px 0;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const UserRole = styled.p`
  font-size: clamp(0.75rem, 1.2vw, 0.8rem);
  color: ${({ theme }) => theme.colors.textSecondary || theme.colors.textPrimary}99;
  margin: 0;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ChevronIcon = styled.div`
  width: 16px;
  height: 16px;
  color: ${({ theme }) => theme.colors.textPrimary}77;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: ${({ $isOpen }) => $isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
  
  &::before {
    content: '▼';
  }
  
  @media (max-width: ${BREAKPOINTS.xl}) {
    display: none;
  }
`;

export const DropdownOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 998;
  background: transparent;
`;

export const UserDropdown = styled.div`
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  width: clamp(240px, 30vw, 280px);
  background: ${({ theme }) => theme.gradients.background || theme.colors.bgHeader};
  backdrop-filter: blur(20px);
  border: 1px solid ${({ theme }) => theme.colors.toggleBorder}44;
  border-radius: 16px;
  box-shadow: 0 20px 40px ${({ theme }) => theme.colors.boxShadow}44;
  z-index: 999;
  overflow: hidden;
  transform-origin: top right;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  ${({ $isOpen }) => $isOpen ? `
    opacity: 1;
    visibility: visible;
    transform: translateY(0) scale(1);
  ` : `
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px) scale(0.95);
  `}
`;

export const UserDropdownHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.toggleBorder}44;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const UserDropdownAvatar = styled.div`
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.highlight}, ${({ theme }) => theme.colors.highlight}cc);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px ${({ theme }) => theme.colors.highlight}33;
  flex-shrink: 0;
  
  span {
    color: white;
    font-weight: 600;
    font-size: 1.1rem;
    text-transform: uppercase;
  }
`;

export const UserDropdownInfo = styled.div`
  min-width: 0;
  flex: 1;
  overflow: hidden;
  
  p:first-child {
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textPrimary};
    margin: 0 0 4px 0;
    font-size: 0.95rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  p:last-child {
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.textSecondary || theme.colors.textPrimary}99;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export const UserDropdownMenu = styled.div`
  padding: 0.5rem 0;
`;

export const UserDropdownItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  
  &:hover {
    background: ${({ theme }) => theme.colors.toggleBackground}44;
    transform: translateX(4px);
  }
  
  .icon {
    width: 16px;
    height: 16px;
    color: ${({ theme }) => theme.colors.textPrimary}77;
    transition: color 0.2s ease;
    flex-shrink: 0;
  }
  
  span {
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.textPrimary};
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  &:hover .icon {
    color: ${({ theme }) => theme.colors.highlight};
  }
`;

export const UserDropdownDivider = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.toggleBorder}44;
  padding: 0.5rem 0;
`;

export const LogoutItem = styled(UserDropdownItem)`
  &:hover {
    background: #fef2f2;
    
    .icon {
      color: #ef4444;
    }
    
    span {
      color: #dc2626;
    }
  }
`;

export const ThemeToggleButton = styled.button`
  position: relative;
  background: ${({ theme }) => theme.colors.toggleBackground};
  color: ${({ theme }) => theme.colors.toggle};
  border: 1px solid ${({ theme }) => theme.colors.toggleBorder};
  padding: 0;
  width: clamp(44px, 6vw, 52px);
  height: clamp(44px, 6vw, 52px);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 4px 12px ${({ theme }) => theme.colors.boxShadow}33;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: ${({ theme }) => theme.colors.highlight}11;
    border-radius: inherit;
    opacity: 0;
    transform: scale(0);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  &:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 8px 20px ${({ theme }) => theme.colors.boxShadow}44;
    
    &::before {
      opacity: 1;
      transform: scale(1);
    }
  }

  &:active {
    transform: translateY(-1px) scale(1.02);
  }
`;

export const IconContainer = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(1rem, 2.5vw, 1.2rem);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  transform: ${({ isDarkMode }) =>
    isDarkMode ? "rotate(180deg)" : "rotate(0deg)"};
`;

export const MobileControls = styled.div`
  display: none;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
  
  @media (max-width: ${BREAKPOINTS.lg}) {
    display: flex;
  }
`;

export const HamburgerButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    background: ${({ theme }) => theme.colors.toggleBackground}66;
  }

  &:active {
    transform: scale(0.95);
  }
`;

export const HamburgerLine = styled.span`
  display: block;
  width: 24px;
  height: 3px;
  background: ${({ theme }) => theme.colors.highlight};
  border-radius: 2px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: center;

  &:not(:last-child) {
    margin-bottom: 4px;
  }

  ${({ open }) => open && `
    &:nth-child(1) {
      transform: rotate(45deg) translate(7px, 7px);
    }

    &:nth-child(2) {
      opacity: 0;
      transform: scale(0);
    }

    &:nth-child(3) {
      transform: rotate(-45deg) translate(7px, -7px);
    }
  `}
`;

export const MobileMenu = styled.nav`
  position: absolute;
  top: calc(100% + 8px);
  right: clamp(1rem, 4vw, 2rem);
  width: clamp(200px, 40vw, 280px);
  background: ${({ theme }) => theme.gradients.background};
  backdrop-filter: blur(20px);
  border: 1px solid ${({ theme }) => theme.colors.toggleBorder}44;
  border-radius: 16px;
  padding: 1rem 0;
  box-shadow: 0 20px 40px ${({ theme }) => theme.colors.boxShadow}44;
  z-index: 999;
  transform-origin: top right;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  
  ${({ open }) => open ? `
    opacity: 1;
    visibility: visible;
    transform: translateY(0) scale(1);
  ` : `
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px) scale(0.95);
  `}

  @media (min-width: ${BREAKPOINTS.lg}) {
    display: none;
  }
`;

export const MobileNavLink = styled(NavLink)`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.mobileTextPrimary || theme.colors.textPrimary};
  text-decoration: none;
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-left: 3px solid transparent;
  
  &:hover {
    background: ${({ theme }) => theme.colors.toggleBackground}44;
    border-left-color: ${({ theme }) => theme.colors.highlight};
    transform: translateX(4px);
    color: ${({ theme }) => theme.colors.highlight};
  }

  &.active {
    background: ${({ theme }) => theme.colors.highlight}11;
    border-left-color: ${({ theme }) => theme.colors.highlight};
    color: ${({ theme }) => theme.colors.highlight};
    font-weight: 600;
  }
`;
