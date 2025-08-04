//  ╔═══════════════════════════════════════════════════════════════════════╗
//  ║                        🌪 Component B Project 1                       ║
//  ╠═══════════════════════════════════════════════════════════════════════╣
//  ║  📁 Project       : DOST-MECO-TECO-VOTE III Component-B               ║
//  ║  📝 Description   :  Weather forecasting platform                     ║
//  ║  👨‍💻 Author        : Karl Santiago Bernaldez                           ║
//  ║  📅 Created       : 2025-03-24                                        ║
//  ║  🕓 Last Updated  : 2025-05-29                                        ║
//  ║  🧭 Version       : v1.0.0                                            ║
//  ╚═══════════════════════════════════════════════════════════════════════╝

import React, { useState, useEffect } from 'react';
// eslint-disable-next-line
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import ProtectedRoute from './middleware/ProtectedRoute';
import ProtectedAdminRoute from './middleware/ProtectedAdminRoute';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Edit from './pages/Edit';
import Charts from './pages/Charts';
import AboutUs from './pages/AboutUs';
import HeaderNavbar from "./components/Header";
import Footer from "./components/Footer";
import styled from 'styled-components';
import useIsMobile from './hooks/useIsMobile';
import MobileAccessModal from './components/modals/MobileAccessModal';
import AccessDeniedModal from './components/modals/AccessDeniedModal';
import OnlyAdminModal from './components/modals/OnlyAdminModal';
import { ThemeProvider } from 'styled-components';
import { darkTheme, theme } from './styles/theme';
import createLogger from '@adovelopers/logado';

const logger = createLogger();
logger.info('Server started');

// Styled components for Layout
const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  overflow-y: ${({ $noscroll }) => ($noscroll ? "hidden" : "auto")};
  overflow-x: hidden;
  pointer-events: ${({ $isloading }) => ($isloading ? "none" : "auto")};

  background-color: ${({ theme, $isDarkMode }) =>
    $isDarkMode ? theme.colors.darkBackground : theme.colors.lightBackground};

  @media (max-width: 768px) {
    background: ${({ theme }) => theme.gradients.background};
  }
`;

const StickyHeader = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: ${({ theme }) => theme.spacing.headerHeight};
  z-index: ${({ theme }) => theme.zIndex.stickyHeader};
  background: ${({ theme }) => theme.gradients.stickyHeader};
  backdrop-filter: blur(${({ theme }) => theme.blur.regular});
  -webkit-backdrop-filter: blur(${({ theme }) => theme.blur.regular});
  box-shadow: ${({ theme }) => theme.colors.boxShadow};
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-top: ${({ theme }) => theme.spacing.headerHeight};
  pointer-events: ${({ isloading }) => (isloading ? 'none' : 'auto')};
`;

const FooterWrapper = styled.div`
  flex-shrink: 0;
  margin-top: auto;
  pointer-events: ${({ isloading }) => (isloading ? 'none' : 'auto')};
`;

const FreeSpace = styled.div`
  background-color: ${({ theme }) => theme.colors.highlight};
  height: ${({ theme }) => theme.spacing.freeSpaceHeight};
  width: 100%;
  margin-top: ${({ theme }) => theme.spacing.freeSpaceMarginTop};
`;

const LoadingScreen = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background-color: ${({ theme }) => theme.colors.loadingBackground};
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: ${({ theme }) => theme.zIndex.loadingScreen};
  color: ${({ theme }) => theme.colors.loadingText};
  font-size: 24px;
  font-weight: bold;
`;

const LoadingSpinner = styled.div`
  border: 4px solid ${({ theme }) => theme.colors.loadingSpinnerBorder};
  border-top: 4px solid ${({ theme }) => theme.colors.loadingSpinnerBorderTop};
  border-radius: 50%;
  width: 60px;
  height: 60px;
  animation: ${({ theme }) => theme.animations.spin};
`;

const Layout = () => {
  // eslint-disable-next-line
  const location = useLocation();
  const isMobile = useIsMobile();

  const isLoginPage = location.pathname === '/login';
  const isRegisterPage = location.pathname === '/register';
  const isDashboardPage = location.pathname === '/dashboard';
  const isLoginOrRegister = isLoginPage || isRegisterPage;
  const isEditPage = location.pathname === '/edit';

  const [modalVisible, setModalVisible] = useState(false); // eslint-disable-next-line
  const [accessDeniedVisible, setAccessDeniedVisible] = useState(false);
  const [isloading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem('isDarkMode');
    return stored ? JSON.parse(stored) : false; // default to light mode
  });

  useEffect(() => {
    localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    if (isMobile && isEditPage) {
      setModalVisible(true);
    }
  }, [isMobile, isEditPage]);

  useEffect(() => {
    setIsLoading(true);
    const timeout = isEditPage || isLoginPage || isRegisterPage ? 1000 : 500;
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, timeout);
    return () => clearTimeout(timer); // eslint-disable-next-line
  }, [location]);

  const handleModalClose = () => {
    setModalVisible(false);
    handleRedirect('/');
  };

  const handleAccessDeniedClose = () => {
    setAccessDeniedVisible(false);
    handleRedirect('/login');
  };

  const handleRedirect = (path = '/') => {
    window.location.href = path;
  };

  const showHeader = !(isLoginOrRegister || isDashboardPage);
  const showFooter = !(isEditPage || isLoginOrRegister || isDashboardPage);
  const showFreeSpace = !(isEditPage || isLoginOrRegister || isDashboardPage);
  const addTopPadding = !isLoginOrRegister && !isDashboardPage;

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : theme}>
      <AppContainer $noscroll={isEditPage} $isloading={isloading} $isDarkMode={isDarkMode}>
        {showHeader && (
          <StickyHeader $isloading={isloading}>
            <HeaderNavbar isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
          </StickyHeader>
        )}

        <MainContent $isloading={isloading} style={{ paddingTop: addTopPadding ? undefined : 0 }}>
          {isloading && (
            <LoadingScreen>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <LoadingSpinner />
                <div>Loading...</div>
              </div>
            </LoadingScreen>
          )}

          <Routes>
            <Route path="/" element={<Home isDarkMode={isDarkMode} />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/edit"
              element={
                isMobile ? (
                  <MobileAccessModal isOpen={modalVisible} onClose={handleModalClose} />
                ) : (
                  <ProtectedRoute
                    element={() => <Edit isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} logger={logger} />}
                    onDeny={() => (
                      <AccessDeniedModal isOpen={true} onClose={handleAccessDeniedClose} />
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
                  onDeny={() => {
                    return <OnlyAdminModal isOpen={true} onClose={handleAccessDeniedClose} />;
                  }}
                />
              }
            />

            <Route path="/charts" element={<Charts />} />
            <Route path="/about-us" element={<AboutUs />} />
          </Routes>

          {showFreeSpace && <FreeSpace />}
        </MainContent>

        {showFooter && (
          <FooterWrapper $isloading={isloading}>
            <Footer />
          </FooterWrapper>
        )}
      </AppContainer>
    </ThemeProvider>
  );
};

const App = () => (
  <Router>
    <Layout />
  </Router>
);

export default App;
