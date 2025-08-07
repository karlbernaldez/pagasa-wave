import React, { useState } from 'react';
import { Menu, X, Sun, Moon, User, Cloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  HeaderContainer,
  Nav,
  Logo,
  LogoIcon,
  ThemeToggle,
  SignInButton,
  MobileMenuButton,
  MobileSignInButton,
  NavLink,
  NavLinks,
  ButtonGroup
} from './styles/header';

const Header = ({ isDarkMode, setIsDarkMode }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Charts', href: '/charts' },
    { name: 'WaveLab', href: '/edit' },
    { name: 'Services', href: '#services' },
    { name: 'About', href: '#about' },
    { name: 'Contact', href: '#contact' }
  ];

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
              as="button"
              onClick={() => handleNavClick(item.href)}
              isDarkMode={isDarkMode}
            >
              {item.name}
            </NavLink>
          ))}
          {isMobileMenuOpen && (
            <MobileSignInButton onClick={() => navigate('/login')}>
              <User size={16} />
              Sign In
            </MobileSignInButton>
          )}
        </NavLinks>

        <ButtonGroup>
          <ThemeToggle onClick={() => setIsDarkMode(!isDarkMode)} isDarkMode={isDarkMode}>
            {isDarkMode ? <Sun /> : <Moon />}
          </ThemeToggle>

          <SignInButton onClick={() => navigate('/login')}>
            <User size={16} />
            Sign In
          </SignInButton>

          <MobileMenuButton onClick={toggleMobileMenu} isDarkMode={isDarkMode}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </MobileMenuButton>
        </ButtonGroup>
      </Nav>
    </HeaderContainer>
  );
};

export default Header;
