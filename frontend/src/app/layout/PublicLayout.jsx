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
  background-color: #f8fbff !important;
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
    radial-gradient(circle at 8% 28%, rgba(37, 99, 235, 0.14), transparent 24rem),
    radial-gradient(circle at 92% 34%, rgba(34, 211, 238, 0.18), transparent 28rem),
    radial-gradient(circle at 82% 78%, rgba(59, 130, 246, 0.10), transparent 24rem),
    url("data:image/svg+xml,%3Csvg width='1440' height='520' viewBox='0 0 1440 520' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%232563eb' stroke-opacity='0.075' stroke-width='1.8'%3E%3Cpath d='M-80 135C70 72 182 189 340 129C503 67 622 185 780 128C947 67 1063 184 1228 128C1324 96 1386 91 1500 120'/%3E%3Cpath d='M-80 205C76 145 198 260 352 199C512 135 636 255 792 198C954 139 1078 254 1238 198C1337 164 1397 162 1500 188'/%3E%3Cpath d='M-80 275C82 219 201 327 363 268C518 212 648 320 804 268C964 214 1088 318 1248 268C1342 238 1404 238 1500 258'/%3E%3Cpath d='M-80 345C78 291 203 394 366 338C525 283 655 388 812 338C974 286 1094 386 1254 338C1348 310 1408 308 1500 328'/%3E%3C/g%3E%3Cg fill='%230ea5e9' fill-opacity='0.075'%3E%3Ccircle cx='142' cy='156' r='3.2'/%3E%3Ccircle cx='192' cy='178' r='2.2'/%3E%3Ccircle cx='244' cy='146' r='2.5'/%3E%3Ccircle cx='1180' cy='156' r='3.5'/%3E%3Ccircle cx='1225' cy='190' r='2.2'/%3E%3Ccircle cx='1282' cy='170' r='2.7'/%3E%3Ccircle cx='1196' cy='372' r='3.1'/%3E%3Ccircle cx='1252' cy='402' r='2.3'/%3E%3Ccircle cx='1310' cy='378' r='2.6'/%3E%3C/g%3E%3C/svg%3E");
  background-repeat: no-repeat, no-repeat, no-repeat, repeat-y;
  background-size: auto, auto, auto, 1440px 520px;
  background-position: left top, right top, right bottom, center 5.5rem;
  opacity: 1;
}

.wavelab-home.bg-slate-950::before {
  opacity: 0.42;
  filter: saturate(0.9) brightness(0.75);
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
