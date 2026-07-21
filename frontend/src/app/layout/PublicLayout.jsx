import { lazy, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import HeaderNavbar from '@shared/layouts/components/header/Header';
import Footer from '@shared/layouts/components/Footer';
import { isChatbotEnabled } from '@/config/featureFlags';

const Chatbot = lazy(() => import('@/components/Chatbot/index'));

const publicPageOverrides = `
.wavelab-home > header {
  display: none !important;
}
`;

const publicChartsOverrides = `
.wavelab-home {
  isolation: isolate;
  background-color: #f7fbff !important;
}

.wavelab-home.bg-slate-950 {
  background-color: #020617 !important;
}

.wavelab-home::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image:
    linear-gradient(90deg, rgba(219, 234, 254, 0.58) 0%, rgba(248, 251, 255, 0.78) 32%, rgba(248, 251, 255, 0.84) 64%, rgba(207, 250, 254, 0.60) 100%),
    radial-gradient(circle at 8% 26%, rgba(37, 99, 235, 0.13), transparent 25rem),
    radial-gradient(circle at 94% 38%, rgba(34, 211, 238, 0.16), transparent 31rem),
    url("data:image/svg+xml,%3Csvg width='1440' height='560' viewBox='0 0 1440 560' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%232563eb' stroke-opacity='0.075' stroke-width='1.8'%3E%3Cpath d='M-90 125C70 66 190 185 355 124C520 63 640 185 805 124C970 65 1090 185 1256 124C1356 88 1425 90 1530 118'/%3E%3Cpath d='M-90 225C76 166 198 284 365 224C530 164 650 284 815 224C980 166 1102 284 1266 224C1366 190 1432 190 1530 218'/%3E%3Cpath d='M-90 325C78 270 202 382 370 324C536 268 656 382 822 324C988 270 1110 380 1272 324C1372 292 1436 292 1530 318'/%3E%3Cpath d='M-90 425C80 372 206 482 376 424C542 370 662 482 828 424C994 372 1118 480 1278 424C1378 394 1440 394 1530 418'/%3E%3C/g%3E%3Cg fill='%230ea5e9' fill-opacity='0.065'%3E%3Ccircle cx='118' cy='152' r='3.2'/%3E%3Ccircle cx='184' cy='187' r='2.2'/%3E%3Ccircle cx='246' cy='148' r='2.6'/%3E%3Ccircle cx='1190' cy='150' r='3.2'/%3E%3Ccircle cx='1252' cy='188' r='2.2'/%3E%3Ccircle cx='1314' cy='160' r='2.6'/%3E%3Ccircle cx='1168' cy='392' r='3.1'/%3E%3Ccircle cx='1234' cy='428' r='2.2'/%3E%3Ccircle cx='1298' cy='400' r='2.6'/%3E%3C/g%3E%3C/svg%3E");
  background-repeat: no-repeat, no-repeat, no-repeat, repeat-y;
  background-size: cover, auto, auto, 1440px 560px;
  background-position: center, left 4rem top 10rem, right 2rem top 12rem, center 6rem;
}

.wavelab-home.bg-slate-950::before {
  opacity: 0.42;
  filter: saturate(0.9) brightness(0.72);
}

.wavelab-home > div.relative.z-10 {
  gap: 1.1rem !important;
}

.wavelab-home > div.relative.z-10 > section:first-of-type + section {
  margin-top: 0.35rem !important;
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
  const chatbotEnabled = isChatbotEnabled();

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
        {chatbotEnabled && <Chatbot />}
      </Suspense>
    </>
  );
};

export default PublicLayout;
