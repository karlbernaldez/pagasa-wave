import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import HeaderNavbar from '@shared/layouts/components/header/Header';
import Footer from '@shared/layouts/components/Footer';
import Chatbot from '@/components/Chatbot/index';

const publicPageOverrides = `
.wavelab-home > header {
  display: none !important;
}
`;

const publicChartsOverrides = `
.wavelab-home > div.relative.z-10 {
  gap: 2rem !important;
}

.wavelab-home > div.relative.z-10 > section:first-of-type + section {
  margin-top: 1.75rem !important;
  position: relative !important;
  top: auto !important;
}
`;

const publicHomeOverrides = `
main.relative.min-h-screen > footer {
  display: none !important;
}

main.relative.min-h-screen > div.pointer-events-none.absolute.inset-0.overflow-hidden {
  display: none !important;
}

main.relative.min-h-screen > div.relative.z-10 {
  overflow: visible !important;
}

main.relative.min-h-screen > div.relative.z-10::before {
  content: none !important;
  display: none !important;
  background: none !important;
}
`;

const PublicLayout = () => {
  const location = useLocation();
  const isPublicHome = location.pathname === '/';
  const isPublicCharts = location.pathname === '/charts';

  return (
    <>
      <style>{publicPageOverrides}</style>
      {isPublicHome && <style>{publicHomeOverrides}</style>}
      {isPublicCharts && <style>{publicChartsOverrides}</style>}

      <Suspense fallback={<div style={{ height: 60 }} />}>
        <HeaderNavbar showAccountControls />
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
