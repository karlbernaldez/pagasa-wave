//  ╔═══════════════════════════════════════════════════════════════════════╗
//  ║                        🌪 Component B Project 1                       ║
//  ╠═══════════════════════════════════════════════════════════════════════╣
//  ║  📁 Project       : DOST-MECO-TECO-VOTE III Component-B               ║
//  ║  📝 Description   :  Weather forecasting platform                     ║
//  ║  👨‍💻 Author        : Karl Santiago Bernaldez                           ║
//  ║  📅 Created       : 2025-03-24                                        ║
//  ║  🕓 Last Updated  : 2025-06-17                                        ║
//  ║  🧭 Version       : v1.1.0 (Enhanced)                                 ║
//  ╚═══════════════════════════════════════════════════════════════════════╝

import React, { useState, useEffect, use } from "react";
import { useLocation } from "react-router-dom";
import { FaSun, FaMoon, FaUser } from "react-icons/fa";
import { fetchUserDetails } from "../api/userAPI";
import { StyledHeaderNavbar, Container, LogoSection, LogoIcon, LogoText, DesktopNav, DropdownOverlay, NavLinks, StyledNavLink, RightSection, DesktopControls, ThemeToggleButton, IconContainer, UserSection, UserButton, UserAvatar, UserInfo, UserName, UserRole, ChevronIcon, UserDropdown, UserDropdownHeader, UserDropdownAvatar, UserDropdownInfo, UserDropdownMenu, UserDropdownItem, UserDropdownDivider, LogoutItem, MobileControls, HamburgerButton, HamburgerLine, MobileMenu, MobileNavLink } from "./styles/header";

const ThemeToggle = ({ isDarkMode, setIsDarkMode }) => {
  const [debounceTimeout, setDebounceTimeout] = useState(null);

  const handleToggle = () => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeoutId = setTimeout(() => {
      setIsDarkMode(!isDarkMode);
    }, 100);

    setDebounceTimeout(timeoutId);
  };

  return (
    <ThemeToggleButton onClick={handleToggle}>
      <IconContainer isDarkMode={isDarkMode}>
        {isDarkMode ? <FaMoon /> : <FaSun />}
      </IconContainer>
    </ThemeToggleButton>
  );
};

const HeaderNavbar = ({ isLoading, isDarkMode, setIsDarkMode }) => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [position, setPosition] = useState("");

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpen && !event.target.closest('[data-mobile-menu]')) {
        setMenuOpen(false);
      }
      if (showUserDropdown && !event.target.closest('[data-user-dropdown]')) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen, showUserDropdown]);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const toggleUserDropdown = () => setShowUserDropdown(!showUserDropdown);

  const isAuthenticated = localStorage.getItem("authToken");
  const showUserButton = isAuthenticated;

  // Get user info
  let userData = {};
  try {
    userData = JSON.parse(localStorage.getItem("user")) || {};
  } catch (e) {
    userData = {};
  }

 useEffect(() => {
    if (isAuthenticated) {
      const getUserData = async () => {
        try {
          // Fetch user details using the user's ID (make sure it's available in localStorage or state)
          const storedUser = JSON.parse(localStorage.getItem("user"));
          const userId = storedUser?.id; // Ensure `userData.id` is available
          if (userId) {
            const data = await fetchUserDetails(userId, isAuthenticated); // Pass the necessary parameters
            setUser(data); // Store the fetched user data
            setPosition(data?.position || ""); // Set position from the fetched data (if available)
            setLoadingUser(false); // Stop loading once the data is fetched
          } else {
            throw new Error("User ID not found");
          }
        } catch (error) {
          console.error("Error fetching user details:", error);
          setLoadingUser(false); // Stop loading in case of an error
        }
      };

      getUserData();
    } else {
      setLoadingUser(false); // Stop loading if not authenticated
    }
  }, [isAuthenticated]);

  const username = userData.username
    ? userData.username.toLowerCase().replace(/^./, userData.username[0].toUpperCase())
    : 'User';


  const userEmail = userData.email || 'user@pagasa.dost.gov.ph';
  const userInitials = username
    .split(' ')
    .map(name => name[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <StyledHeaderNavbar isLoading={isLoading} scrolled={scrolled}>
      <Container>
        {/* Logo Section - Left */}
        <LogoSection
          href="https://www.pagasa.dost.gov.ph/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <LogoIcon />
          <LogoText>PAGASA</LogoText>
        </LogoSection>

        {/* Navigation Links - Center */}
        <DesktopNav>
          <NavLinks>
            <StyledNavLink to="/" end>
              Home
            </StyledNavLink>
            <StyledNavLink to="/charts">
              Charts
            </StyledNavLink>
            <StyledNavLink to="/edit">
              Editor
            </StyledNavLink>
            <StyledNavLink to="/about">
              About
            </StyledNavLink>
            <StyledNavLink to="/contact">
              Contact Us
            </StyledNavLink>
          </NavLinks>
        </DesktopNav>

        {/* Right Section - Contains both theme toggle and user controls */}
        <RightSection>
          {/* Desktop Controls - Theme Toggle + User Section */}
          <DesktopControls>
            <ThemeToggle isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />

            {showUserButton && (
              <UserSection data-user-dropdown>
                <UserButton onClick={toggleUserDropdown}>
                  <UserAvatar>
                    <span>{userInitials}</span>
                  </UserAvatar>
                  <UserInfo>
                    <UserName>{username}</UserName>
                    <UserRole>{position}</UserRole>
                  </UserInfo>
                  <ChevronIcon $isOpen={showUserDropdown} />
                </UserButton>

                {/* User Dropdown Menu */}
                {showUserDropdown && (
                  <>
                    <DropdownOverlay onClick={() => setShowUserDropdown(false)} />
                    <UserDropdown $isOpen={showUserDropdown}>
                      <UserDropdownHeader>
                        <UserDropdownAvatar>
                          <span>{userInitials}</span>
                        </UserDropdownAvatar>
                        <UserDropdownInfo>
                          <p>{username}</p>
                          <p>{userEmail}</p>
                        </UserDropdownInfo>
                      </UserDropdownHeader>

                      <UserDropdownMenu>
                        <UserDropdownItem>
                          <FaUser className="icon" />
                          <span>Profile Settings</span>
                        </UserDropdownItem>
                        <UserDropdownItem>
                          <span className="icon" style={{ fontSize: '16px' }}>⚙️</span>
                          <span>Preferences</span>
                        </UserDropdownItem>
                      </UserDropdownMenu>

                      <UserDropdownDivider>
                        <LogoutItem onClick={() => {
                          localStorage.removeItem("authToken");
                          localStorage.removeItem("user");
                          window.location.href = "/login";
                        }}>
                          <span className="icon" style={{ fontSize: '16px' }}>🚪</span>
                          <span>Sign Out</span>
                        </LogoutItem>
                      </UserDropdownDivider>
                    </UserDropdown>
                  </>
                )}
              </UserSection>
            )}
          </DesktopControls>

          {/* Mobile Controls */}
          <MobileControls data-mobile-menu>
            <ThemeToggle isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
            <HamburgerButton onClick={toggleMenu}>
              <HamburgerLine open={menuOpen} />
              <HamburgerLine open={menuOpen} />
              <HamburgerLine open={menuOpen} />
            </HamburgerButton>

            <MobileMenu open={menuOpen}>
              <MobileNavLink to="/" end onClick={() => setMenuOpen(false)}>
                Home
              </MobileNavLink>
              <MobileNavLink to="/charts" onClick={() => setMenuOpen(false)}>
                Charts
              </MobileNavLink>
              <MobileNavLink to="/edit" onClick={() => setMenuOpen(false)}>
                Editor
              </MobileNavLink>
              <MobileNavLink to="/about" onClick={() => setMenuOpen(false)}>
                About
              </MobileNavLink>
              <MobileNavLink to="/contact" onClick={() => setMenuOpen(false)}>
                Contact Us
              </MobileNavLink>
            </MobileMenu>
          </MobileControls>
        </RightSection>
      </Container>
    </StyledHeaderNavbar>
  );
};

export default HeaderNavbar;