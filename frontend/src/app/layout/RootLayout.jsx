import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import LoadingScreen from '@/components/ui/LoadingScreen';
import { AppContainer, MainContent } from '@/styles/global';

const RootLayout = () => {
  return (
    <AppContainer>
      <MainContent>
        <Suspense fallback={<LoadingScreen />}>
          <Outlet />
        </Suspense>
      </MainContent>
    </AppContainer>
  );
};

export default RootLayout;
