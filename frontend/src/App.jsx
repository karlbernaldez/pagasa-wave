import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { GlobalStyle, AppContainer, MainContent, FooterWrapper } from '@/styles/global';
import LoadingScreen from '@/components/ui/LoadingScreen';
import useIsMobile from '@/hooks/useIsMobile';
import { darkTheme, theme } from '@/styles/theme';
import { useTheme } from '@/hooks/useTheme';
import createLogger from '@adovelopers/logado';
import useRouteChecks from '@/hooks/useRouteChecks';
import getLayoutConfig from '@/utils/getLayoutConfig';

// Components (Lazy Loaded)
const HeaderNavbar = lazy(() => import('@/components/layout/Header'));
const Footer = lazy(() => import('@/components/layout/Footer'));
const ProtectedRoute = lazy(() => import('@/middleware/ProtectedRoute'));
const ProtectedAdminRoute = lazy(() => import('@/middleware/ProtectedAdminRoute'));
const ErrorBoundary = lazy(() => import('@/components/layout/ErrorBoundary'));

// Pages (Lazy Loaded)
const Home = lazy(() => import('@/pages/Home'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const Studio = lazy(() => import('@/pages/Studio'));
const Charts = lazy(() => import('@/pages/Charts'));
const AboutUs = lazy(() => import('@/pages/AboutUs'));

// Modals (Lazy Loaded)
const MobileAccessModal = lazy(() => import('@/components/ui/modals/MobileAccessModal'));
const AccessDeniedModal = lazy(() => import('@/components/ui/modals/AccessDeniedModal'));
const OnlyAdminModal = lazy(() => import('@/components/ui/modals/OnlyAdminModal'));

// Initialize logger
const logger = createLogger();
logger.info('VOTE: WaveLab Platform initialized');

// Enhanced Layout Component
const Layout = () => {
  const isMobile = useIsMobile();
  const { isLoginPage, isRegisterPage, isDashboardPage, isStudioPage, isChartsPage } = useRouteChecks();
  const isAuthPage = isLoginPage || isRegisterPage;

  // State management
  const [modalVisible, setModalVisible] = useState(false);
  const [accessDeniedVisible, setAccessDeniedVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDarkMode, setIsDarkMode] = useTheme();
  const [activeChartType, setActiveChartType] = useState('wave-wind');

  // Persist theme preference
  useTheme(isDarkMode);

  // Mobile edit page modal handling
  useEffect(() => {
    if (isMobile && isStudioPage) {
      setModalVisible(true);
    }
  }, [isMobile, isStudioPage]);

  // Enhanced loading state management
  useEffect(() => {
    setIsLoading(true);
    const timeout = isStudioPage || isAuthPage ? 1200 : 600;
    const timer = setTimeout(() => setIsLoading(false), timeout);
    return () => clearTimeout(timer);
  }, [isStudioPage, isAuthPage]);

  // Callback functions
  const handleModalClose = useCallback(() => {
    setModalVisible(false);
    window.location.href = '/';
  }, []);

  const handleAccessDeniedClose = useCallback(() => {
    setAccessDeniedVisible(false);
    window.location.href = '/login';
  }, []);

  const toggleTheme = useCallback(() => setIsDarkMode(prev => !prev), []);

  // Get layout configuration
  const layoutConfig = useMemo(() => getLayoutConfig({ isAuthPage, isDashboardPage, isStudioPage, isChartsPage }), [isAuthPage, isDashboardPage, isStudioPage, isChartsPage]);

  const { showHeader, showFooter, showDivider, addTopPadding } = layoutConfig;

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : theme}>
      <GlobalStyle />
      <AppContainer $noscroll={isStudioPage} $isloading={isLoading} $isDarkMode={isDarkMode}>
        {/* Header */}
        {showHeader && (
          <Suspense fallback={<div style={{ height: '60px' }} />}>
            <HeaderNavbar
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
              isLoggedIn={isLoggedIn}
              setIsLoggedIn={setIsLoggedIn}
              toggleTheme={toggleTheme}
              activeChartType={activeChartType}
              setActiveChartType={setActiveChartType}
            />
          </Suspense>
        )}

        {/* Main Content */}
        <MainContent $isloading={isLoading} style={{ paddingTop: addTopPadding ? undefined : 0 }}>
          {isLoading && <LoadingScreen isDarkMode={isDarkMode} message={isStudioPage ? "Loading Editor..." : "Loading..."} />}
          <Suspense fallback={<LoadingScreen isDarkMode={isDarkMode} />}>
            <Routes>
              <Route path="/" element={<Home isDarkMode={isDarkMode} />} />
              <Route path="/login" element={<Login isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/studio"
                element={
                  isMobile ? (
                    <MobileAccessModal isOpen={modalVisible} onClose={handleModalClose} />
                  ) : (
                    <ProtectedRoute
                      element={() => (
                        <Studio isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} logger={logger} isLoggedIn={isLoggedIn} />
                      )}
                      onDeny={() => <AccessDeniedModal isOpen={true} onClose={handleAccessDeniedClose} />}
                      requireAuth={true}
                      setIsLoggedIn={setIsLoggedIn}
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
                    onDeny={() => <OnlyAdminModal isOpen={true} onClose={handleAccessDeniedClose} />}
                  />
                }
              />
              <Route path="/charts" element={<Charts isDarkMode={isDarkMode} activeChartType={activeChartType} />} />
              <Route path="/about-us" element={<AboutUs isDarkMode={isDarkMode} />} />
            </Routes>
          </Suspense>

        </MainContent>

        {/* Footer */}
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
