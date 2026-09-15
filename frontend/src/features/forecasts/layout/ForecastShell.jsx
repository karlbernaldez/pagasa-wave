import { useCallback, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useTheme } from '@/app/providers/ThemeProvider';
import {
  ACCOUNT_ITEM,
  buildDashboardSidebarGroups,
} from '@/features/dashboard/OperationalDashboardShell';
import { getAdminTabForPath } from '@dashboards/admin/constants/navigation';
import DashboardShell from '@/shared/dashboard-shell/DashboardShell';
import useCurrentDashboardUser from '@/shared/hooks/useCurrentDashboardUser';

export default function ForecastShell({ children, user: fallbackUser = null }) {
  const { isDarkMode, setIsDarkMode } = useTheme();
  const location = useLocation();
  const { user, rawUser } = useCurrentDashboardUser(fallbackUser);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const sidebarGroups = useMemo(() => buildDashboardSidebarGroups(rawUser), [rawUser]);
  const activeId = useMemo(() => getAdminTabForPath(location.pathname), [location.pathname]);

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
        groups: sidebarGroups,
        utilityItems: [ACCOUNT_ITEM],
        label: 'Workspace',
      }}
      header={{
        accountSettingsPath: '/account',
        hideContext: true,
        user,
      }}
    >
      {children}
    </DashboardShell>
  );
}
