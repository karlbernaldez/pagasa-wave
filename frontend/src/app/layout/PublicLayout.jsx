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

.wavelab-home::before,
.wavelab-home::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.wavelab-home::before {
  background-image:
    linear-gradient(90deg, rgba(219, 234, 254, 0.74) 0%, rgba(248, 251, 255, 0.46) 30%, rgba(248, 251, 255, 0.62) 62%, rgba(207, 250, 254, 0.84) 100%),
    radial-gradient(circle at 7% 26%, rgba(37, 99, 235, 0.26), transparent 25rem),
    radial-gradient(circle at 94% 38%, rgba(34, 211, 238, 0.32), transparent 31rem),
    url("data:image/svg+xml,%3Csvg width='340' height='340' viewBox='0 0 340 340' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%230ea5e9' fill-opacity='0.16'%3E%3Ccircle cx='18' cy='24' r='2.1'/%3E%3Ccircle cx='58' cy='45' r='1.8'/%3E%3Ccircle cx='104' cy='28' r='2'/%3E%3Ccircle cx='144' cy='58' r='1.6'/%3E%3Ccircle cx='196' cy='34' r='1.9'/%3E%3Ccircle cx='244' cy='64' r='1.7'/%3E%3Ccircle cx='286' cy='38' r='2'/%3E%3Ccircle cx='40' cy='126' r='1.8'/%3E%3Ccircle cx='92' cy='156' r='1.6'/%3E%3Ccircle cx='138' cy='128' r='1.9'/%3E%3Ccircle cx='184' cy='164' r='1.7'/%3E%3Ccircle cx='236' cy='134' r='2'/%3E%3Ccircle cx='278' cy='168' r='1.7'/%3E%3Ccircle cx='24' cy='236' r='2'/%3E%3Ccircle cx='78' cy='264' r='1.7'/%3E%3Ccircle cx='128' cy='236' r='2'/%3E%3Ccircle cx='178' cy='278' r='1.6'/%3E%3Ccircle cx='230' cy='246' r='1.9'/%3E%3Ccircle cx='288' cy='278' r='1.8'/%3E%3C/g%3E%3C/svg%3E");
  background-repeat: no-repeat, no-repeat, no-repeat, repeat;
  background-size: cover, auto, auto, 340px 340px;
  background-position: center, left 4rem top 9rem, right 2rem top 11rem, left top;
  opacity: 1;
}

.wavelab-home::after {
  background-image:
    url("data:image/svg+xml,%3Csvg width='520' height='980' viewBox='0 0 520 980' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%232563eb' stroke-opacity='0.28' stroke-width='2.6'%3E%3Cpath d='M-45 80C42 37 110 122 205 78C304 33 370 119 465 78C510 58 548 57 585 70'/%3E%3Cpath d='M-45 150C46 108 118 193 211 150C308 104 378 191 472 150C518 131 552 130 585 142'/%3E%3Cpath d='M-45 220C45 180 120 263 215 220C312 176 382 262 475 220C520 202 554 202 585 214'/%3E%3Cpath d='M-45 290C48 251 124 334 220 290C316 247 386 333 480 290C524 272 556 273 585 286'/%3E%3Cpath d='M-45 360C48 322 124 404 220 360C318 318 388 403 480 360C525 343 557 344 585 356'/%3E%3Cpath d='M-45 430C48 394 124 474 220 430C318 389 388 474 480 430C525 414 557 414 585 426'/%3E%3Cpath d='M-45 500C48 464 124 544 220 500C318 459 388 544 480 500C525 484 557 484 585 496'/%3E%3Cpath d='M-45 570C48 534 124 614 220 570C318 529 388 614 480 570C525 554 557 554 585 566'/%3E%3C/g%3E%3Cg fill='%230ea5e9' fill-opacity='0.22'%3E%3Ccircle cx='70' cy='118' r='4'/%3E%3Ccircle cx='132' cy='162' r='3'/%3E%3Ccircle cx='196' cy='126' r='3.4'/%3E%3Ccircle cx='104' cy='332' r='3.8'/%3E%3Ccircle cx='170' cy='374' r='3'/%3E%3Ccircle cx='238' cy='338' r='3.2'/%3E%3Ccircle cx='84' cy='552' r='3.8'/%3E%3Ccircle cx='150' cy='596' r='3'/%3E%3Ccircle cx='218' cy='558' r='3.4'/%3E%3C/g%3E%3C/svg%3E"),
    url("data:image/svg+xml,%3Csvg width='520' height='980' viewBox='0 0 520 980' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%230ea5e9' stroke-opacity='0.30' stroke-width='2.8'%3E%3Cpath d='M-70 90C38 38 128 140 244 88C362 36 438 137 555 88'/%3E%3Cpath d='M-70 170C42 119 132 220 248 170C365 118 442 218 555 170'/%3E%3Cpath d='M-70 250C42 201 132 300 248 250C365 199 442 298 555 250'/%3E%3Cpath d='M-70 330C42 282 132 380 248 330C365 279 442 379 555 330'/%3E%3Cpath d='M-70 410C42 362 132 460 248 410C365 359 442 459 555 410'/%3E%3Cpath d='M-70 490C42 442 132 540 248 490C365 439 442 539 555 490'/%3E%3C/g%3E%3Cg fill='%230ea5e9' fill-opacity='0.24'%3E%3Ccircle cx='310' cy='126' r='4'/%3E%3Ccircle cx='370' cy='170' r='3'/%3E%3Ccircle cx='435' cy='132' r='3.4'/%3E%3Ccircle cx='292' cy='348' r='3.8'/%3E%3Ccircle cx='358' cy='390' r='3'/%3E%3Ccircle cx='426' cy='352' r='3.4'/%3E%3C/g%3E%3C/svg%3E");
  background-repeat: repeat-y, repeat-y;
  background-size: 520px 980px, 520px 980px;
  background-position: left 1.5rem top 7rem, right 1.5rem top 8rem;
  opacity: 1;
}

.wavelab-home.bg-slate-950::before {
  opacity: 0.48;
  filter: saturate(0.9) brightness(0.72);
}

.wavelab-home.bg-slate-950::after {
  opacity: 0.55;
  filter: saturate(0.95) brightness(0.75);
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
