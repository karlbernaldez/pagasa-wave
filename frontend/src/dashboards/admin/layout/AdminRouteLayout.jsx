import { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { useTheme } from '@/app/providers/ThemeProvider';
import ProtectedAdminRoute from '@/middleware/ProtectedAdminRoute';
import { AdminDashboardProvider } from '@dashboards/admin/context/AdminDashboardContext';
import {
  ADMIN_PERMISSION_BY_TAB,
  ADMIN_TABS,
  PAGE_META,
  getAdminRouteForTab,
  getAdminTabForPath,
} from '@dashboards/admin/constants/navigation';
import AdminShell from './AdminShell';

const TAB_STORAGE_KEY = 'adminActiveTab';
const PAGINATED_TABS = new Set([ADMIN_TABS.USERS, ADMIN_TABS.USERS_LIST]);

function buildSearchForTab(tab, searchParams) {
  const next = new URLSearchParams();

  if (PAGINATED_TABS.has(tab)) {
    next.set('page', searchParams.get('page') ?? '1');
    next.set('limit', searchParams.get('limit') ?? '5');
  }

  return next.toString();
}

function AdminDashboardLayoutContent() {
  const { isDarkMode, setIsDarkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const activeTab = getAdminTabForPath(location.pathname);
  const activeMeta = PAGE_META[activeTab] ?? PAGE_META[ADMIN_TABS.DASHBOARD];

  const setActiveTab = useCallback(
    (tab) => {
      const route = getAdminRouteForTab(tab);
      const search = buildSearchForTab(tab, searchParams);

      localStorage.setItem(TAB_STORAGE_KEY, tab);
      navigate(search ? `${route}?${search}` : route, { replace: false });
    },
    [navigate, searchParams]
  );

  useEffect(() => {
    const legacyTab = searchParams.get('tab');
    if (!legacyTab) return;

    const route = getAdminRouteForTab(legacyTab);
    const search = buildSearchForTab(legacyTab, searchParams);

    localStorage.setItem(TAB_STORAGE_KEY, legacyTab);
    navigate(search ? `${route}?${search}` : route, { replace: true });
  }, [navigate, searchParams]);

  useEffect(() => {
    localStorage.setItem(TAB_STORAGE_KEY, activeTab);
  }, [activeTab]);

  useEffect(() => {
    document.title = activeMeta?.title ? `WaveLab – ${activeMeta.title}` : 'WaveLab – Dashboard';
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
    [activeMeta, activeTab, isDarkMode, setActiveTab]
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
  const location = useLocation();
  const activeTab = getAdminTabForPath(location.pathname);
  const permission = ADMIN_PERMISSION_BY_TAB[activeTab] ?? null;

  return (
    <ProtectedAdminRoute requireAuth permission={permission}>
      <AdminDashboardLayoutContent />
    </ProtectedAdminRoute>
  );
}
