import { useCallback, useMemo, useState } from 'react';
import { ClipboardCheck, FolderKanban, Settings } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import { useTheme } from '@/app/providers/ThemeProvider';
import { hasEffectivePermission } from '@/core/auth/resolveLandingPath';
import DashboardShell from '@/shared/dashboard-shell/DashboardShell';
import useCurrentDashboardUser from '@/shared/hooks/useCurrentDashboardUser';

const FORECAST_NAV_ITEMS = [
  {
    id: 'forecast-packages',
    label: 'Forecast Packages',
    path: '/forecasts',
    icon: FolderKanban,
    permission: 'forecast.view',
  },
  {
    id: 'forecast-review',
    label: 'Review Queue',
    path: '/forecasts/review',
    icon: ClipboardCheck,
    permission: 'forecast.review',
  },
];

const ACCOUNT_ITEM = {
  id: 'account-settings',
  label: 'Account Settings',
  path: '/profile',
  icon: Settings,
};

export default function ForecastShell({ children, user: fallbackUser = null }) {
  const { isDarkMode, setIsDarkMode } = useTheme();
  const location = useLocation();
  const { user, rawUser } = useCurrentDashboardUser(fallbackUser);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const navItems = useMemo(
    () => FORECAST_NAV_ITEMS.filter((item) => hasEffectivePermission(rawUser, item.permission)),
    [rawUser]
  );

  const activeId = useMemo(() => {
    if (location.pathname === '/forecasts/review') return 'forecast-review';
    if (location.pathname === '/forecasts' || location.pathname.startsWith('/forecasts/')) {
      return 'forecast-packages';
    }
    if (location.pathname === '/profile') return 'account-settings';
    return undefined;
  }, [location.pathname]);

  const toggleMobileMenu = useCallback(() => setIsMobileOpen((open) => !open), []);
  const toggleDarkMode = useCallback(() => setIsDarkMode((dark) => !dark), [setIsDarkMode]);

  return (
    <DashboardShell
      activeId={activeId}
      backgroundVariant="ocean"
      isDarkMode={isDarkMode}
      isMobileOpen={isMobileOpen}
      isSidebarCollapsed={isSidebarCollapsed}
      setIsMobileOpen={setIsMobileOpen}
      setIsSidebarCollapsed={setIsSidebarCollapsed}
      onMobileMenuToggle={toggleMobileMenu}
      onThemeToggle={toggleDarkMode}
      sidebar={{
        items: navItems,
        utilityItems: [ACCOUNT_ITEM],
        label: 'Forecast Operations',
      }}
      header={{
        hideContext: true,
        user,
      }}
    >
      {children}
    </DashboardShell>
  );
}
