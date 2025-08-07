//  ╔═══════════════════════════════════════════════════════════════════════╗
//  ║                        🌪 Component B Project 1                       ║
//  ╠═══════════════════════════════════════════════════════════════════════╣
//  ║  📁 Project       : DOST-MECO-TECO-VOTE III Component-B               ║
//  ║  📝 Description   :  Weather forecasting platform                     ║
//  ║  👨‍💻 Author        : Karl Santiago Bernaldez                           ║
//  ║  📅 Created       : 2025-03-24                                        ║
//  ║  🕓 Last Updated  : 2025-08-07                                        ║
//  ║  🧭 Version       : v2.0.0                                            ║
//  ╚═══════════════════════════════════════════════════════════════════════╝

import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import styled, { createGlobalStyle } from 'styled-components';

// Hooks and utilities
import useIsMobile from './hooks/useIsMobile';
import { darkTheme, theme } from './styles/theme';
import createLogger from '@adovelopers/logado';

// Components - lazy loaded for better performance
const HeaderNavbar = lazy(() => import("./components/Header"));
const Footer = lazy(() => import("./components/Footer"));
const ProtectedRoute = lazy(() => import('./middleware/ProtectedRoute'));
const ProtectedAdminRoute = lazy(() => import('./middleware/ProtectedAdminRoute'));

// Pages - lazy loaded
const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Edit = lazy(() => import('./pages/Edit'));
const Charts = lazy(() => import('./pages/Charts'));
const AboutUs = lazy(() => import('./pages/AboutUs'));

// Modals - lazy loaded
const MobileAccessModal = lazy(() => import('./components/modals/MobileAccessModal'));
const AccessDeniedModal = lazy(() => import('./components/modals/AccessDeniedModal'));
const OnlyAdminModal = lazy(() => import('./components/modals/OnlyAdminModal'));

// Initialize logger
const logger = createLogger();
logger.info('Weather Forecasting Platform initialized');

// Global styles for consistent theming
const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    scroll-behavior: smooth;
    font-size: 16px;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
                 'Oxygen', 'Ubuntu', 'Cantarell', 'Open Sans', 'Helvetica Neue', sans-serif;
    line-height: 1.6;
    color: ${({ theme }) => theme.colors.text};
    background-color: ${({ theme }) => theme.colors.background};
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  img {
    max-width: 100%;
    height: auto;
  }

  button {
    cursor: pointer;
    border: none;
    background: none;
    font-family: inherit;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.scrollbarTrack};
  }

  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.scrollbarThumb};
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.colors.scrollbarThumbHover};
  }
`;

// Enhanced styled components with better responsiveness and animations
const AppContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: 100vh;

  overflow-y: ${({ $noscroll }) => ($noscroll ? "hidden" : "auto")};
  overflow-x: hidden;
  pointer-events: ${({ $isloading }) => ($isloading ? "none" : "auto")};

  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  background: ${({ theme, $isDarkMode }) => {
    const { colors, gradients } = theme;

    if ($isDarkMode) {
      return `linear-gradient(135deg, ${colors?.darkBackground} 0%, ${colors?.darkSecondary} 100%)`;
    } else {
      return `linear-gradient(135deg, ${colors?.lightBackground} 0%, ${colors?.lightSecondary} 100%)`;
    }
  }};

  @media (max-width: 768px) {
    background: ${({ theme, $isDarkMode }) => {
    const { gradients } = theme;
    return $isDarkMode
      ? gradients?.darkMobileBackground || gradients?.background
      : gradients?.background;
  }};
  }

  /* Enhanced backdrop blur for glassmorphism effect */
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
`;

const MainContent = styled.main`
 width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  pointer-events: ${({ $isloading }) => ($isloading ? 'none' : 'auto')};
  opacity: ${({ $isloading }) => ($isloading ? 0.7 : 1)};
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 1;

  /* Add subtle animation on page transitions */
  animation: slideIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const FooterWrapper = styled.div`
  flex-shrink: 0;
  margin-top: auto;
  pointer-events: ${({ $isloading }) => ($isloading ? 'none' : 'auto')};
  transition: all 0.3s ease;
  z-index: 2;
`;

const SectionDivider = styled.div`
  background: ${({ theme, $isDarkMode }) =>
    $isDarkMode
      ? `linear-gradient(90deg, transparent, ${theme.colors.accent}40, transparent)`
      : `linear-gradient(90deg, transparent, ${theme.colors.highlight}60, transparent)`
  };
  height: ${({ theme }) => theme.spacing.freeSpaceHeight || '2px'};
  width: 100%;
  margin: ${({ theme }) => theme.spacing.freeSpaceMarginTop || '2rem'} 0;
  border-radius: 2px;
  box-shadow: ${({ theme, $isDarkMode }) =>
    $isDarkMode
      ? `0 2px 10px ${theme.colors.accent}20`
      : `0 2px 10px ${theme.colors.highlight}30`
  };
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: ${({ theme, $isDarkMode }) =>
    $isDarkMode
      ? 'rgba(15, 15, 35, 0.95)'
      : 'rgba(255, 255, 255, 0.95)'
  };
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: ${({ theme }) => theme.zIndex.loadingScreen || 9999};
  animation: fadeIn 0.3s ease-in-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const LoadingContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
  border-radius: 16px;
  background: ${({ theme, $isDarkMode }) =>
    $isDarkMode
      ? 'rgba(30, 30, 50, 0.8)'
      : 'rgba(255, 255, 255, 0.8)'
  };
  backdrop-filter: blur(20px);
  border: 1px solid ${({ theme, $isDarkMode }) =>
    $isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
  };
  box-shadow: ${({ theme, $isDarkMode }) =>
    $isDarkMode
      ? '0 20px 40px rgba(0, 0, 0, 0.3)'
      : '0 20px 40px rgba(0, 0, 0, 0.1)'
  };
`;

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 3px solid ${({ theme, $isDarkMode }) =>
    $isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
  };
  border-top: 3px solid ${({ theme }) => theme.colors.primary || '#007bff'};
  border-radius: 50%;
  animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.div`
  color: ${({ theme, $isDarkMode }) =>
    $isDarkMode ? theme.colors.lightText : theme.colors.darkText
  };
  font-size: 1.1rem;
  font-weight: 500;
  text-align: center;
  letter-spacing: 0.5px;
`;

const ErrorBoundaryFallback = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 2rem;
  text-align: center;
  color: ${({ theme }) => theme.colors.error || '#dc3545'};

  h2 {
    margin-bottom: 1rem;
    font-size: 1.5rem;
  }

  p {
    margin-bottom: 1.5rem;
    opacity: 0.8;
  }

  button {
    padding: 0.75rem 1.5rem;
    background: ${({ theme }) => theme.colors.primary};
    color: white;
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    }
  }
`;

// Enhanced Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logger.error('Application Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorBoundaryFallback>
          <h2>🌪 Something went wrong</h2>
          <p>We're sorry, but there was an unexpected error in the weather platform.</p>
          <button onClick={() => window.location.reload()}>
            Reload Application
          </button>
        </ErrorBoundaryFallback>
      );
    }

    return this.props.children;
  }
}

// Enhanced Loading Component
const LoadingScreen = ({ isDarkMode, message = "Loading..." }) => (
  <LoadingOverlay $isDarkMode={isDarkMode}>
    <LoadingContent $isDarkMode={isDarkMode}>
      <LoadingSpinner $isDarkMode={isDarkMode} />
      <LoadingText $isDarkMode={isDarkMode}>{message}</LoadingText>
    </LoadingContent>
  </LoadingOverlay>
);

// Enhanced Layout Component with better state management
const Layout = () => {
  const location = useLocation();
  const isMobile = useIsMobile();

  // Memoized route checks for better performance
  const routeChecks = useMemo(() => ({
    isLoginPage: location.pathname === '/login',
    isRegisterPage: location.pathname === '/register',
    isDashboardPage: location.pathname === '/dashboard',
    isEditPage: location.pathname === '/edit',
  }), [location.pathname]);

  const { isLoginPage, isRegisterPage, isDashboardPage, isEditPage } = routeChecks;
  const isAuthPage = isLoginPage || isRegisterPage;

  // Enhanced state management
  const [modalVisible, setModalVisible] = useState(false);
  const [accessDeniedVisible, setAccessDeniedVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const stored = localStorage.getItem('isDarkMode');
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });

  // Persist theme preference
  useEffect(() => {
    try {
      localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
      // Update meta theme-color for mobile browsers
      const metaThemeColor = document.querySelector("meta[name=theme-color]");
      if (metaThemeColor) {
        metaThemeColor.setAttribute("content",
          isDarkMode ? "#1a1a2e" : "#ffffff"
        );
      }
    } catch (error) {
      logger.warn('Failed to persist theme preference:', error);
    }
  }, [isDarkMode]);

  // Mobile edit page modal handling
  useEffect(() => {
    if (isMobile && isEditPage) {
      setModalVisible(true);
    }
  }, [isMobile, isEditPage]);

  // Enhanced loading state management
  useEffect(() => {
    setIsLoading(true);
    const timeout = isEditPage || isAuthPage ? 1200 : 600;
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, timeout);
    return () => clearTimeout(timer);
  }, [location, isEditPage, isAuthPage]);

  // Optimized callback functions
  const handleModalClose = useCallback(() => {
    setModalVisible(false);
    window.location.href = '/';
  }, []);

  const handleAccessDeniedClose = useCallback(() => {
    setAccessDeniedVisible(false);
    window.location.href = '/login';
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  // Memoized layout conditions
  const layoutConfig = useMemo(() => ({
    showHeader: !(isAuthPage || isDashboardPage),
    showFooter: !(isEditPage || isAuthPage || isDashboardPage),
    showDivider: !(isEditPage || isAuthPage || isDashboardPage),
    addTopPadding: !isAuthPage && !isDashboardPage,
  }), [isAuthPage, isDashboardPage, isEditPage]);

  const { showHeader, showFooter, showDivider, addTopPadding } = layoutConfig;

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : theme}>
      <GlobalStyle />
      <AppContainer
        $noscroll={isEditPage}
        $isloading={isLoading}
        $isDarkMode={isDarkMode}
      >
        {showHeader && (
          <Suspense fallback={<div style={{ height: '60px' }} />}>
            <HeaderNavbar
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
              toggleTheme={toggleTheme}
            />
          </Suspense>
        )}

        <MainContent
          $isloading={isLoading}
          style={{ paddingTop: addTopPadding ? undefined : 0 }}
        >
          {isLoading && (
            <LoadingScreen
              isDarkMode={isDarkMode}
              message={isEditPage ? "Loading Editor..." : "Loading..."}
            />
          )}

          <Suspense fallback={<LoadingScreen isDarkMode={isDarkMode} />}>
            <Routes>
              <Route
                path="/"
                element={<Home isDarkMode={isDarkMode} />}
              />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/edit"
                element={
                  isMobile ? (
                    <MobileAccessModal
                      isOpen={modalVisible}
                      onClose={handleModalClose}
                    />
                  ) : (
                    <ProtectedRoute
                      element={() => (
                        <Edit
                          isDarkMode={isDarkMode}
                          setIsDarkMode={setIsDarkMode}
                          logger={logger}
                        />
                      )}
                      onDeny={() => (
                        <AccessDeniedModal
                          isOpen={true}
                          onClose={handleAccessDeniedClose}
                        />
                      )}
                      requireAuth={true}
                    />
                  )
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedAdminRoute
                    element={Dashboard}
                    requireAuth={true}
                    onDeny={() => (
                      <OnlyAdminModal
                        isOpen={true}
                        onClose={handleAccessDeniedClose}
                      />
                    )}
                  />
                }
              />
              <Route
                path="/charts"
                element={<Charts isDarkMode={isDarkMode} />}
              />
              <Route
                path="/about-us"
                element={<AboutUs isDarkMode={isDarkMode} />}
              />
            </Routes>
          </Suspense>

          {showDivider && <SectionDivider $isDarkMode={isDarkMode} />}
        </MainContent>

        {showFooter && (
          <FooterWrapper $isloading={isLoading}>
            <Suspense fallback={<div style={{ height: '100px' }} />}>
              <Footer isDarkMode={isDarkMode} />
            </Suspense>
          </FooterWrapper>
        )}
      </AppContainer>
    </ThemeProvider>
  );
};

// Main App Component with Error Boundary
const App = () => (
  <ErrorBoundary>
    <Router>
      <Layout />
    </Router>
  </ErrorBoundary>
);

export default App;