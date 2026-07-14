import { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Menu, X } from 'lucide-react';

import { logoutUser } from '@/api/auth';
import { useChartType } from '@/app/providers/ChartTypeProvider';
import { useTheme } from '@/app/providers/ThemeProvider';

import { ChartDropdown } from './ChartDropdown';
import { MobileMenu } from './MobileMenu';
import { NAV_ITEMS } from './constants/navigation';
import { ThemeToggle } from './ThemeToggle';
import { UserDropdown } from './UserDropdown';
import { useHeaderUser } from './hooks/useHeaderUser';
import { invalidateHeaderUserCache } from './utils/userCache';

const DASHBOARD_BY_ROLE = {
  admin: { label: 'Admin Dashboard', path: '/dashboard' },
  forecaster: { label: 'Forecaster Dashboard', path: '/studio' },
};

const Header = ({ isStudioProjectPage, showAccountControls = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, setIsDarkMode } = useTheme();
  const { activeChartType, setActiveChartType } = useChartType();
  const { currentUser, isLoggedIn } = useHeaderUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dashboard = isLoggedIn ? DASHBOARD_BY_ROLE[currentUser?.role] : null;

  const isActiveRoute = useCallback((href) => {
    if (href.startsWith('#')) return location.pathname === '/' && location.hash === href;
    return location.pathname === href
      || (href === '/wave-charts' && location.pathname.startsWith('/wave-charts/'))
      || (href === '/wave-charts' && location.pathname.startsWith('/forecasts'));
  }, [location]);

  const handleNavigate = useCallback((href) => {
    if (href.startsWith('#')) document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
    else navigate(href);
    setIsMobileMenuOpen(false);
  }, [navigate]);

  const handleSelectChartType = useCallback((typeId) => {
    setActiveChartType?.(typeId);
    navigate('/charts');
    setIsMobileMenuOpen(false);
  }, [navigate, setActiveChartType]);

  const handleSignOut = useCallback(() => {
    logoutUser();
    invalidateHeaderUserCache();
    setIsMobileMenuOpen(false);
    navigate('/');
  }, [navigate]);

  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-[1000] transition-all duration-300 ${
        isStudioProjectPage
          ? 'border-none bg-transparent backdrop-blur-0'
          : `border-b backdrop-blur-xl ${isDarkMode ? 'border-gray-600/30' : 'border-gray-200/20'}`
      }`}>
        <nav className={`flex h-16 items-center justify-between ${
          isStudioProjectPage ? 'w-full px-3 md:px-4' : 'mx-auto max-w-[1400px] px-4 md:px-6'
        }`}>
          <Logo isDarkMode={isDarkMode} onClick={() => handleNavigate('/')} />

          {!isStudioProjectPage && (
            <div className="hidden items-center gap-8 md:flex">
              {NAV_ITEMS.map((item) => item.hasDropdown ? (
                <ChartDropdown
                  key={item.href}
                  isDarkMode={isDarkMode}
                  activeChartType={activeChartType}
                  isActive={isActiveRoute(item.href)}
                  onNavigate={handleNavigate}
                  onSelectType={handleSelectChartType}
                />
              ) : (
                <NavButton
                  key={item.href}
                  item={item}
                  isDarkMode={isDarkMode}
                  isActive={isActiveRoute(item.href)}
                  onClick={() => handleNavigate(item.href)}
                />
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            <ThemeToggle isDarkMode={isDarkMode} onToggle={() => setIsDarkMode((prev) => !prev)} />

            {showAccountControls && dashboard && (
              <DashboardButton dashboard={dashboard} isDarkMode={isDarkMode} onClick={() => handleNavigate(dashboard.path)} />
            )}

            {showAccountControls && (isLoggedIn ? (
              <UserDropdown
                currentUser={currentUser}
                isDarkMode={isDarkMode}
                onNavigate={handleNavigate}
                onSignOut={handleSignOut}
              />
            ) : (
              <button
                type="button"
                aria-label="Go to staff login"
                onClick={() => handleNavigate('/login')}
                className={`cursor-pointer rounded-lg border border-transparent px-3 py-2 text-sm font-semibold transition-colors duration-200 ${
                  isDarkMode
                    ? 'text-gray-300/80 hover:bg-white/[0.06] hover:text-white'
                    : 'text-gray-600 hover:bg-slate-100 hover:text-gray-900'
                }`}
              >
                Staff Login
              </button>
            ))}

            <button
              type="button"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className={`flex cursor-pointer items-center justify-center rounded-xl border p-3 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 md:hidden ${
                isDarkMode
                  ? 'border-gray-600/30 bg-gray-800/80 text-gray-300 hover:bg-gray-800 hover:text-white'
                  : 'border-white/20 bg-white/90 text-gray-600 hover:bg-white hover:text-gray-900'
              }`}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
      </header>

      {isMobileMenuOpen && (
        <MobileMenu
          isDarkMode={isDarkMode}
          isLoggedIn={showAccountControls && isLoggedIn}
          currentUser={currentUser}
          activeChartType={activeChartType}
          isActiveRoute={isActiveRoute}
          onNavigate={handleNavigate}
          onSelectChartType={handleSelectChartType}
          onNavigateUser={handleNavigate}
          onSignOut={handleSignOut}
        />
      )}
    </>
  );
};

export default Header;

function DashboardButton({ dashboard, isDarkMode, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open ${dashboard.label}`}
      className={`hidden h-10 items-center gap-2 rounded-xl border px-3 text-sm font-bold shadow-[0_4px_18px_rgba(0,0,0,0.12)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 md:inline-flex ${
        isDarkMode
          ? 'border-sky-300/20 bg-sky-400/10 text-sky-100 hover:border-sky-300/35 hover:bg-sky-400/16'
          : 'border-sky-200/80 bg-white/65 text-sky-800 hover:border-sky-300 hover:bg-white/90'
      }`}
    >
      <LayoutDashboard size={17} aria-hidden="true" />
      <span className="hidden xl:inline">{dashboard.label}</span>
      <span className="xl:hidden">Dashboard</span>
    </button>
  );
}

function Logo({ isDarkMode, onClick }) {
  return (
    <button type="button" onClick={onClick} aria-label="Go to WaveLab home" className="group flex select-none items-center gap-3 text-left">
      <span className={`grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border backdrop-blur-xl transition-all duration-300 group-hover:-translate-y-0.5 group-hover:scale-105 ${
        isDarkMode
          ? 'border-cyan-300/20 bg-[#061c38]/72 shadow-[0_5px_22px_rgba(14,165,233,.22)] group-hover:border-cyan-300/40'
          : 'border-white/85 bg-white/72 shadow-[0_5px_20px_rgba(14,116,144,.18)] group-hover:border-cyan-200'
      }`}>
        <img src="/wavelab-mark.svg" alt="" aria-hidden="true" className="h-10 w-10 object-contain" draggable={false} />
      </span>

      <span className="flex flex-col gap-[3px] leading-none">
        <span className={`text-[1.3rem] font-black leading-none tracking-tight transition-transform duration-300 group-hover:scale-[1.03] ${
          isDarkMode ? 'text-white drop-shadow-[0_1px_8px_rgba(56,189,248,.35)]' : 'text-slate-950'
        }`}>
          Wave<span className={isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}>Lab</span>
        </span>
        <span className={`text-[0.58rem] font-semibold uppercase leading-none tracking-[0.22em] ${
          isDarkMode ? 'text-cyan-300/55' : 'text-cyan-700/65'
        }`}>
          PAGASA · VOTE
        </span>
      </span>
    </button>
  );
}

function NavButton({ item, isDarkMode, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative cursor-pointer rounded-md border-none bg-transparent px-4 py-2 text-base font-semibold transition-all duration-200 ${
        isActive
          ? isDarkMode ? 'bg-blue-900/30 text-white' : 'bg-blue-100 text-gray-900'
          : isDarkMode ? 'text-gray-100 hover:bg-gray-800 hover:text-white' : 'text-gray-900 hover:bg-slate-50 hover:text-blue-900'
      }`}
    >
      {item.name}
      {isActive && (
        <span className={`absolute -bottom-0.5 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-sm ${isDarkMode ? 'bg-blue-400' : 'bg-blue-600'}`} />
      )}
    </button>
  );
}