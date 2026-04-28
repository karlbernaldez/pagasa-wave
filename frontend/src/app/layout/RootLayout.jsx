import { Suspense, useMemo } from 'react';
import { Outlet } from 'react-router-dom';

import HeaderNavbar from '@shared/layouts/components/header/Header';
import Footer from '@shared/layouts/components/Footer';
import LoadingScreen from '@/components/ui/LoadingScreen';
import Chatbot from '@/components/Chatbot/index';

import useRouteChecks from '@/hooks/useRouteChecks';
import getLayoutConfig from '@/utils/getLayoutConfig';

import { AppContainer, MainContent, FooterWrapper } from '@/styles/global';

const RootLayout = () => {
  const {
    isLoginPage,
    isRegisterPage,
    isVerifyEmailPage,
    isDashboardPage,
    isStudioPage,
    isStudioProjectPage,
    isForecasterDashboardPage,
    isChartsPage,
  } = useRouteChecks();

  const layoutConfig = useMemo(
    () =>
      getLayoutConfig({
        isAuthPage: isLoginPage || isRegisterPage,
        isDashboardPage,
        isStudioPage,
        isStudioProjectPage,
        isForecasterDashboardPage,
        isChartsPage,
        isVerifyEmailPage,
      }),
    [isLoginPage, isRegisterPage, isDashboardPage, isStudioPage, isStudioProjectPage, isForecasterDashboardPage, isChartsPage, isVerifyEmailPage]
  );

  const { showHeader, showFooter, addTopPadding } = layoutConfig;

  return (
    <AppContainer $noscroll={isStudioPage}>
      {showHeader && (
        <Suspense fallback={<div style={{ height: 60 }} />}>
          <HeaderNavbar isStudioProjectPage={isStudioProjectPage} />
        </Suspense>
      )}

      <MainContent style={{ paddingTop: addTopPadding ? undefined : 0 }}>
        <Suspense fallback={<LoadingScreen />}>
          <Outlet />
        </Suspense>
      </MainContent>

      {showFooter && (
        <FooterWrapper>
          <Suspense fallback={<div style={{ height: 100 }} />}>
            <Footer />
            <Chatbot />
          </Suspense>
        </FooterWrapper>
      )}
    </AppContainer>
  );
};

export default RootLayout;
