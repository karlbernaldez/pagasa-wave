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
  background-color: #f4f9ff !important;
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
    linear-gradient(90deg, rgba(219, 234, 254, 0.82) 0%, rgba(248, 251, 255, 0.72) 28%, rgba(248, 251, 255, 0.82) 64%, rgba(207, 250, 254, 0.88) 100%),
    radial-gradient(circle at 7% 26%, rgba(37, 99, 235, 0.22), transparent 25rem),
    radial-gradient(circle at 94% 38%, rgba(34, 211, 238, 0.28), transparent 31rem),
    url("data:image/svg+xml,%3Csvg width='1500' height='540' viewBox='0 0 1500 540' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%232563eb' stroke-opacity='0.16' stroke-width='2.2'%3E%3Cpath d='M-120 125C40 66 167 188 337 126C511 63 635 188 804 126C972 65 1097 188 1265 126C1370 88 1435 90 1580 118'/%3E%3Cpath d='M-120 193C46 136 178 254 348 194C520 132 648 254 816 194C982 136 1110 254 1275 194C1381 158 1446 158 1580 184'/%3E%3Cpath d='M-120 261C54 207 182 320 358 261C526 205 660 319 826 261C994 206 1118 318 1284 261C1388 228 1450 226 1580 252'/%3E%3Cpath d='M-120 329C50 279 186 386 365 329C536 275 665 385 834 329C1004 277 1128 384 1290 329C1394 297 1454 297 1580 322'/%3E%3Cpath d='M-120 397C56 348 188 452 369 396C540 344 670 452 840 396C1012 346 1132 451 1298 396C1400 365 1458 366 1580 390'/%3E%3C/g%3E%3Cg fill='%230ea5e9' fill-opacity='0.16'%3E%3Ccircle cx='118' cy='152' r='3.8'/%3E%3Ccircle cx='164' cy='187' r='2.8'/%3E%3Ccircle cx='222' cy='148' r='3.1'/%3E%3Ccircle cx='262' cy='206' r='2.5'/%3E%3Ccircle cx='1190' cy='150' r='4'/%3E%3Ccircle cx='1242' cy='188' r='2.8'/%3E%3Ccircle cx='1304' cy='160' r='3.1'/%3E%3Ccircle cx='1344' cy='212' r='2.6'/%3E%3Ccircle cx='1168' cy='374' r='3.8'/%3E%3Ccircle cx='1224' cy='410' r='2.8'/%3E%3Ccircle cx='1288' cy='382' r='3.1'/%3E%3Ccircle cx='1328' cy='432' r='2.6'/%3E%3C/g%3E%3C/svg%3E"),
    url("data:image/svg+xml,%3Csvg width='320' height='320' viewBox='0 0 320 320' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%230ea5e9' fill-opacity='0.13'%3E%3Ccircle cx='18' cy='24' r='2'/%3E%3Ccircle cx='58' cy='45' r='1.7'/%3E%3Ccircle cx='104' cy='28' r='1.9'/%3E%3Ccircle cx='144' cy='58' r='1.5'/%3E%3Ccircle cx='196' cy='34' r='1.8'/%3E%3Ccircle cx='244' cy='64' r='1.6'/%3E%3Ccircle cx='286' cy='38' r='1.9'/%3E%3Ccircle cx='40' cy='126' r='1.7'/%3E%3Ccircle cx='92' cy='156' r='1.5'/%3E%3Ccircle cx='138' cy='128' r='1.8'/%3E%3Ccircle cx='184' cy='164' r='1.6'/%3E%3Ccircle cx='236' cy='134' r='1.9'/%3E%3Ccircle cx='278' cy='168' r='1.6'/%3E%3Ccircle cx='24' cy='236' r='1.9'/%3E%3Ccircle cx='78' cy='264' r='1.6'/%3E%3Ccircle cx='128' cy='236' r='1.9'/%3E%3Ccircle cx='178' cy='278' r='1.5'/%3E%3Ccircle cx='230' cy='246' r='1.8'/%3E%3Ccircle cx='288' cy='278' r='1.7'/%3E%3C/g%3E%3C/svg%3E");
  background-repeat: no-repeat, no-repeat, no-repeat, repeat-y, repeat;
  background-size: cover, auto, auto, 1500px 540px, 320px 320px;
  background-position: center, left 4rem top 9rem, right 2rem top 11rem, center 5.5rem, left top;
  opacity: 1;
}

.wavelab-home.bg-slate-950::before {
  opacity: 0.48;
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
