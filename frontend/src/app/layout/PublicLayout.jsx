import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import HeaderNavbar from '@shared/layouts/components/header/Header';
import Footer from '@shared/layouts/components/Footer';
import Chatbot from '@/components/Chatbot/index';

const PublicLayout = () => {
  const location = useLocation();
  const isPublicHome = location.pathname === '/';

  return (
    <>
      {!isPublicHome && (
        <Suspense fallback={<div style={{ height: 60 }} />}>
          <HeaderNavbar showAccountControls />
        </Suspense>
      )}

      <Outlet />

      <Suspense fallback={<div style={{ height: 100 }} />}>
        {!isPublicHome && <Footer />}
        <Chatbot />
      </Suspense>
    </>
  );
};

export default PublicLayout;
