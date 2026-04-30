import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import HeaderNavbar from '@shared/layouts/components/header/Header';
import Footer from '@shared/layouts/components/Footer';
import Chatbot from '@/components/Chatbot/index';

const PublicLayout = () => {
  return (
    <>
      <Suspense fallback={<div style={{ height: 60 }} />}>
        <HeaderNavbar />
      </Suspense>

      <Outlet />

      <Suspense fallback={<div style={{ height: 100 }} />}>
        <Footer />
        <Chatbot />
      </Suspense>
    </>
  );
};

export default PublicLayout;
