import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';

import { useTheme } from '@/app/providers/ThemeProvider';
import { useChartType } from '@/app/providers/ChartTypeProvider';
import { logoutUser } from '@/api/auth';

import { NAV_ITEMS } from './constants/navigation';
import { invalidateHeaderUserCache } from './utils/userCache';
import { useHeaderUser } from './hooks/useHeaderUser';
import { ThemeToggle } from './ThemeToggle';
import { ChartDropdown } from './ChartDropdown';
import { UserDropdown } from './UserDropdown';
import { MobileMenu } from './MobileMenu';

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const { isDarkMode, setIsDarkMode } = useTheme();
    const { activeChartType, setActiveChartType } = useChartType();
    const { currentUser, isLoggedIn, isLoading } = useHeaderUser();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    const isActiveRoute = useCallback((href) => {
        if (href.startsWith('#')) return location.pathname === '/' && location.hash === href;
        return location.pathname === href;
    }, [location]);

    const handleNavigate = useCallback((href) => {
        if (href.startsWith('#')) {
            document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
        } else {
            navigate(href);
        }
        setIsMobileMenuOpen(false);
    }, [navigate]);

    const handleSelectChartType = useCallback((typeId) => {
        setActiveChartType?.(typeId);
        navigate('/charts');
        setIsMobileMenuOpen(false);
    }, [setActiveChartType, navigate]);

    const handleSignOut = useCallback(() => {
        logoutUser();
        invalidateHeaderUserCache();
        setIsMobileMenuOpen(false);
        // useHeaderUser will reflect the cleared cache on next render cycle.
        // A full page redirect is the cleanest approach after logout.
        navigate('/');
    }, [navigate]);

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------

    return (
        <>
            {/* ── Top bar ─────────────────────────────────────────────────────── */}
            <header className={`
        fixed top-0 left-0 right-0 z-[1000]
        backdrop-blur-xl border-b transition-all duration-300
        ${isDarkMode ? 'border-gray-600/30' : 'border-gray-200/20'}
      `}>
                <nav className="max-w-[1400px] mx-auto px-4 md:px-6 flex items-center justify-between h-16">

                    {/* Logo */}
                    <Logo isDarkMode={isDarkMode} onClick={() => handleNavigate('/')} />

                    {/* Desktop nav links */}
                    <div className="hidden md:flex items-center gap-8">
                        {NAV_ITEMS.map((item) =>
                            item.hasDropdown ? (
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
                            )
                        )}
                    </div>

                    {/* Right-side actions */}
                    <div className="flex items-center gap-3">
                        <ThemeToggle isDarkMode={isDarkMode} onToggle={() => setIsDarkMode((prev) => !prev)} />

                        {/* Authenticated — user menu | Unauthenticated — sign-in CTA */}
                        {isLoggedIn ? (
                            <UserDropdown
                                currentUser={currentUser}
                                isDarkMode={isDarkMode}
                                onNavigate={handleNavigate}
                                onSignOut={handleSignOut}
                            />
                        ) : !isLoading && (
                            <button
                                onClick={() => handleNavigate('/login')}
                                className="hidden md:flex bg-gradient-to-br from-sky-500 to-blue-600 border-none rounded-xl px-6 py-3 text-white font-semibold text-sm cursor-pointer transition-all duration-300 items-center gap-2 shadow-lg hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl active:translate-y-0 active:scale-[0.98]"
                            >
                                <User size={16} />
                                Sign In
                            </button>
                        )}

                        {/* Hamburger */}
                        <button
                            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                            className={`
                md:hidden rounded-xl p-3 cursor-pointer transition-all duration-300
                backdrop-blur-xl border flex items-center justify-center
                hover:-translate-y-0.5 hover:scale-105
                ${isDarkMode
                                    ? 'bg-gray-800/80 border-gray-600/30 text-gray-300 hover:text-white hover:bg-gray-800'
                                    : 'bg-white/90 border-white/20 text-gray-600 hover:text-gray-900 hover:bg-white'}
              `}
                        >
                            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </nav>
            </header>

            {/* ── Mobile overlay ──────────────────────────────────────────────── */}
            {isMobileMenuOpen && (
                <MobileMenu
                    isDarkMode={isDarkMode}
                    isLoggedIn={isLoggedIn}
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

// ─── File-private presentational components ──────────────────────────────────
// Small enough to not warrant their own file, but extracted for readability.

function Logo({ isDarkMode, onClick }) {
    return (
        <div
            onClick={onClick}
            className="flex items-center gap-3 cursor-pointer group select-none"
        >
        <div className={`
            w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
            ring-1 backdrop-blur-sm shadow-md
            transition-all duration-300
            group-hover:-translate-y-0.5 group-hover:scale-105
            group-hover:shadow-[0_6px_20px_rgba(14,165,233,0.25)]
        ${isDarkMode
                    ? 'bg-gray-800/70 ring-gray-600/40 group-hover:ring-sky-500/40'
                    : 'bg-white/85 ring-gray-200/70 group-hover:ring-sky-400/50'}
        `}>
                <img
                    src="/pagasa-logo.png"
                    alt="PAGASA logo"
                    className="w-8 h-8 object-contain"
                    draggable={false}
                />
            </div>

            {/* Wordmark */}
            <div className="flex flex-col leading-none gap-[3px]">
                <span className={`
          text-[1.3rem] font-black tracking-tight leading-none
          transition-all duration-300 origin-left group-hover:scale-[1.04]
          ${isDarkMode
                        ? 'text-white drop-shadow-[0_1px_8px_rgba(56,189,248,0.4)]'
                        : 'text-gray-900'}
        `}>
                    Wave
                    <span className={isDarkMode ? 'text-sky-400' : 'text-sky-500'}>Lab</span>
                </span>
                <span className={`
          text-[0.58rem] font-semibold uppercase tracking-[0.22em] leading-none
          ${isDarkMode ? 'text-sky-400/50' : 'text-sky-500/60'}
        `}>
                    PAGASA · VOTE
                </span>
            </div>
        </div>
    );
}

function NavButton({ item, isDarkMode, isActive, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`
        px-4 py-2 border-none bg-transparent cursor-pointer text-base font-semibold
        rounded-md transition-all duration-200 relative
        ${isActive
                    ? isDarkMode ? 'text-white bg-blue-900/30' : 'text-gray-900 bg-blue-100'
                    : isDarkMode ? 'text-gray-100 hover:text-white hover:bg-gray-800'
                        : 'text-gray-900 hover:text-blue-900 hover:bg-slate-50'}
      `}
        >
            {item.name}
            {isActive && (
                <span className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-sm ${isDarkMode ? 'bg-blue-400' : 'bg-blue-600'}`} />
            )}
        </button>
    );
}