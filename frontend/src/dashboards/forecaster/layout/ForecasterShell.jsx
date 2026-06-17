import { useCallback, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  BarChart3,
  Box,
  CloudSun,
  FolderKanban,
  Map,
  RadioTower,
  Settings,
  Waves,
} from 'lucide-react';

import { useTheme } from '@/app/providers/ThemeProvider';
import DashboardShell from '@/shared/dashboard-shell/DashboardShell';
import useCurrentDashboardUser from '@/shared/hooks/useCurrentDashboardUser';

const NAV_ITEMS = [
  { id: 'project-library', label: 'Project Library', path: '/studio', icon: FolderKanban },
  { id: 'models', label: 'Models', path: '/studio?section=models', icon: Box, disabled: true },
  { id: 'observations', label: 'Observations', path: '/studio?section=observations', icon: CloudSun, disabled: true },
  { id: 'nowcast', label: 'Nowcast', path: '/studio?section=nowcast', icon: RadioTower, disabled: true },
  { id: 'analytics', label: 'Analytics', path: '/studio?section=analytics', icon: BarChart3, disabled: true },
  { id: 'map-viewer', label: 'Map Viewer', path: '/studio?section=map-viewer', icon: Map, disabled: true },
  { id: 'report-builder', label: 'Report Builder', path: '/pdf', icon: Waves, disabled: true },
  { id: 'settings', label: 'Settings', path: '/profile', icon: Settings },
];

export default function ForecasterShell({ children, user: fallbackUser = null }) {
  const { isDarkMode, setIsDarkMode } = useTheme();
  const location = useLocation();
  const userOptions = useMemo(() => ({ roleOverride: 'Forecaster' }), []);
  const { user } = useCurrentDashboardUser(fallbackUser, userOptions);
  const activeId = useMemo(() => {
    const activeItem = NAV_ITEMS.find((item) => {
      if (item.disabled || !item.path) return false;

      const [pathname] = item.path.split('?');
      return pathname === location.pathname;
    });

    return activeItem?.id;
  }, [location.pathname]);

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleMobileMenu = useCallback(() => setIsMobileOpen((p) => !p), []);
  const toggleDarkMode = useCallback(() => setIsDarkMode((p) => !p), [setIsDarkMode]);

  return (
    <DashboardShell
      activeId={activeId}
      isDarkMode={isDarkMode}
      isMobileOpen={isMobileOpen}
      isSidebarCollapsed={isSidebarCollapsed}
      setIsMobileOpen={setIsMobileOpen}
      setIsSidebarCollapsed={setIsSidebarCollapsed}
      onMobileMenuToggle={toggleMobileMenu}
      onThemeToggle={toggleDarkMode}
      sidebar={{
        items: NAV_ITEMS,
        label: 'Forecaster Studio',
      }}
      header={{
        eyebrow: 'Forecaster Studio',
        title: 'WaveLab Operations',
        description: 'Track, manage, and continue active marine forecast projects',
        user,
      }}
    >
      {children}
    </DashboardShell>
  );
}
