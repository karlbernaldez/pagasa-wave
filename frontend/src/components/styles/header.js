import styled from 'styled-components';

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
  max-width: 1200px;
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

export const NavLink = styled.a`
  color: ${props => props.isDarkMode ? '#d1d5db' : '#4b5563'};
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
  padding: 0.625rem 1rem;
  border-radius: 0.75rem;
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    color: ${props => props.isDarkMode ? '#ffffff' : '#111827'};
    background: ${props => props.isDarkMode
    ? 'rgba(14, 165, 233, 0.1)'
    : 'rgba(14, 165, 233, 0.08)'};
    transform: translateY(-1px);
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0.25rem;
    left: 50%;
    width: 0;
    height: 2px;
    background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
    transition: all 0.3s ease;
    transform: translateX(-50%);
    border-radius: 1px;
  }
  
  &:hover::after {
    width: 70%;
  }

  @media (max-width: 768px) {
    padding: 0.75rem 0;
    width: 100%;
    text-align: center;
    
    &::after {
      display: none;
    }
    
    &:hover {
      background: ${props => props.isDarkMode
    ? 'rgba(14, 165, 233, 0.15)'
    : 'rgba(14, 165, 233, 0.1)'};
      border-radius: 0.75rem;
      transform: none;
    }
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