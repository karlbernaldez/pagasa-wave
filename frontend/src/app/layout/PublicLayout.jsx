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
.wavelab-home {
  isolation: isolate;
}

.wavelab-home::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image:
    radial-gradient(circle at 10% 20%, rgba(37, 99, 235, 0.14), transparent 24rem),
    radial-gradient(circle at 90% 32%, rgba(34, 211, 238, 0.18), transparent 28rem),
    url("data:image/svg+xml,%3Csvg width='900' height='340' viewBox='0 0 900 340' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%232563eb' stroke-opacity='0.08' stroke-width='2'%3E%3Cpath d='M0 95C120 45 210 145 340 94C474 41 560 143 690 94C778 61 835 63 900 85'/%3E%3Cpath d='M0 165C126 115 225 216 350 163C481 108 576 209 705 163C790 132 845 132 900 151'/%3E%3Cpath d='M0 235C130 187 225 281 352 232C476 184 584 276 710 231C788 203 843 204 900 220'/%3E%3C/g%3E%3Cg fill='%230ea5e9' fill-opacity='0.08'%3E%3Ccircle cx='145' cy='74' r='4'/%3E%3Ccircle cx='525' cy='137' r='5'/%3E%3Ccircle cx='775' cy='222' r='4'/%3E%3C/g%3E%3C/svg%3E");
  background-repeat: no-repeat, no-repeat, repeat-x;
  background-size: auto, auto, 900px 340px;
  background-position: center, center, center 7rem;
  opacity: 0.9;
}

.wavelab-home > div.relative.z-10 {
  gap: 1.25rem !important;
}

.wavelab-home > div.relative.z-10 > section:first-of-type + section {
  margin-top: 0.75rem !important;
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
