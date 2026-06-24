import { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, useSearchParams } from 'react-router-dom';

import { useTheme } from '@/app/providers/ThemeProvider';
import ProtectedAdminRoute from '@/middleware/ProtectedAdminRoute';
import { AdminDashboardProvider } from '@dashboards/admin/context/AdminDashboardContext';
import { ADMIN_TABS, PAGE_META } from '@dashboards/admin/constants/navigation';
import AdminShell from './AdminShell';

const TAB_STORAGE_KEY = 'adminActiveTab';
const PAGINATED_TABS = new Set([ADMIN_TABS.USERS, ADMIN_TABS.USERS_LIST]);

function getInitialTab(searchParams) {
  return (
    searchParams.get('tab') ||
    localStorage.getItem(TAB_STORAGE_KEY) ||
    ADMIN_TABS.DASHBOARD
  );
}

function AdminDashboardLayoutContent() {
  const { isDarkMode, setIsDarkMode } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const activeTab = getInitialTab(searchParams);
  const activeMeta = PAGE_META[activeTab] ?? PAGE_META[ADMIN_TABS.DASHBOARD];

  const setActiveTab = useCallback(
    (tab) => {
      localStorage.setItem(TAB_STORAGE_KEY, tab);

      const next = new URLSearchParams({ tab });

      if (PAGINATED_TABS.has(tab)) {
        next.set('page', searchParams.get('page') ?? '1');
        next.set('limit', searchParams.get('limit') ?? '5');
      }

      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    document.title = activeMeta?.title
      ? `WaveLab – ${activeMeta.title}`
      : 'WaveLab – Dashboard';
  }, [activeMeta]);

  const toggleMobileMenu = useCallback(() => setIsMobileOpen((p) => !p), []);
  const toggleDarkMode = useCallback(() => setIsDarkMode((p) => !p), [setIsDarkMode]);

  const contextValue = useMemo(
    () => ({
      activeMeta,
      activeTab,
      isDarkMode,
      setActiveTab,
    }),
    [activeMeta, activeTab, isDarkMode, setActiveTab],
  );

  return (
    <AdminDashboardProvider value={contextValue}>
      <AdminShell
        activeMeta={activeMeta}
        activeTab={activeTab}
        isDarkMode={isDarkMode}
        isMobileOpen={isMobileOpen}
        isSidebarCollapsed={isSidebarCollapsed}
        onMobileMenuToggle={toggleMobileMenu}
        onToggleDarkMode={toggleDarkMode}
        setActiveTab={setActiveTab}
        setIsMobileOpen={setIsMobileOpen}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
      >
        <Outlet />
      </AdminShell>
    </AdminDashboardProvider>
  );
}

export default function AdminRouteLayout() {
  return (
    <ProtectedAdminRoute requireAuth>
      <AdminDashboardLayoutContent />
    </ProtectedAdminRoute>
  );
}
