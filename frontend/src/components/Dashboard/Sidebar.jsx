// src/components/Dashboard/Sidebar.js
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { BarChart3, Users, FileText, TrendingUp, Settings, Cloud, Menu, X } from 'lucide-react';

const SidebarOverlay = styled.div`
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 998;
  opacity: ${props => props.isOpen ? 1 : 0};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  @media (max-width: 768px) {
    display: block;
  }
`;

const SidebarContainer = styled.div`
  width: 280px;
  background: linear-gradient(145deg, #0f172a 0%, #1e293b 100%);
  color: white;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  padding: 0;
  z-index: 999;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
  border-right: 1px solid rgba(148, 163, 184, 0.1);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    transform: translateX(${props => props.isOpen ? '0' : '-100%'});
    width: 320px;
    max-width: 85vw;
  }

  @media (max-width: 480px) {
    width: 100vw;
    max-width: 100vw;
  }
`;

const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32px 24px 24px 24px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  background: rgba(59, 130, 246, 0.05);
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent);
  }
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const SidebarTitle = styled.h1`
  font-size: 22px;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const CloseButton = styled.button`
  display: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: none;
  background: rgba(148, 163, 184, 0.1);
  color: #cbd5e1;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #f87171;
    transform: scale(1.05);
  }

  @media (max-width: 768px) {
    display: flex;
  }
`;

const NavContainer = styled.div`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
`;

const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const NavButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 18px;
  border-radius: 12px;
  border: none;
  background: ${props => props.active 
    ? 'linear-gradient(135deg, #3b82f6, #2563eb)' 
    : 'transparent'};
  color: ${props => props.active ? 'white' : '#cbd5e1'};
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: ${props => props.active ? '600' : '500'};
  font-size: 15px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.1));
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    background-color: ${props => props.active 
      ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' 
      : 'rgba(59, 130, 246, 0.1)'};
    color: white;
    transform: translateX(4px);
    box-shadow: ${props => props.active 
      ? '0 8px 25px rgba(59, 130, 246, 0.3)' 
      : '0 4px 12px rgba(0, 0, 0, 0.1)'};

    &::before {
      opacity: 1;
    }
  }

  &:active {
    transform: translateX(2px) scale(0.98);
  }

  svg {
    transition: transform 0.3s ease;
    flex-shrink: 0;
  }

  &:hover svg {
    transform: scale(1.1);
  }

  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const ActiveIndicator = styled.div`
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 70%;
  background: linear-gradient(180deg, #60a5fa, #3b82f6);
  border-radius: 0 4px 4px 0;
  opacity: ${props => props.active ? 1 : 0};
  transition: opacity 0.3s ease;
`;

const MobileMenuButton = styled.button`
  display: none;
  position: fixed;
  top: 24px;
  left: 24px;
  z-index: 1000;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #1e293b, #334155);
  color: white;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(135deg, #334155, #475569);
    transform: scale(1.05);
  }

  @media (max-width: 768px) {
    display: flex;
  }
`;

const Footer = styled.div`
  padding: 24px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  background: rgba(15, 23, 42, 0.5);
  
  p {
    margin: 0;
    font-size: 12px;
    color: #64748b;
    text-align: center;
  }
`;

const Sidebar = ({ activeTab, setActiveTab }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'content', label: 'Content & Publishing', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const handleNavClick = (itemId) => {
    setActiveTab(itemId);
    setIsMobileOpen(false); // Close mobile menu after selection
  };

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsMobileOpen(false);
      }
    };

    if (isMobileOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileOpen]);

  return (
    <>
      <MobileMenuButton onClick={toggleMobileMenu}>
        <Menu size={24} />
      </MobileMenuButton>

      <SidebarOverlay 
        isOpen={isMobileOpen} 
        onClick={() => setIsMobileOpen(false)}
      />

      <SidebarContainer isOpen={isMobileOpen}>
        <SidebarHeader>
          <HeaderContent>
            <Cloud size={36} color="#60a5fa" />
            <SidebarTitle>DOST PAGASA</SidebarTitle>
          </HeaderContent>
          <CloseButton onClick={() => setIsMobileOpen(false)}>
            <X size={20} />
          </CloseButton>
        </SidebarHeader>

        <NavContainer>
          <Nav>
            {navItems.map(item => (
              <NavButton
                key={item.id}
                active={activeTab === item.id}
                onClick={() => handleNavClick(item.id)}
              >
                <ActiveIndicator active={activeTab === item.id} />
                <item.icon size={22} />
                <span>{item.label}</span>
              </NavButton>
            ))}
          </Nav>
        </NavContainer>

        <Footer>
          <p>© 2025 WeatherAdmin v2.1</p>
        </Footer>
      </SidebarContainer>
    </>
  );
};

export default Sidebar;