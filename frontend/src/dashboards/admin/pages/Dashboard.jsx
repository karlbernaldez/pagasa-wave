import { useEffect, useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import AdminShell from '@dashboards/admin/layout/AdminShell';
import DashboardOverview from '@dashboards/admin/sections/Overview';
import ChartReviewSection from '@dashboards/admin/sections/chart-review/ChartReview';
import UserManagementSection from '@dashboards/admin/sections/user-management/UserManagement';
import AnalyticsSection from '@dashboards/admin/sections/Analytics';
import CalendarSection from '@dashboards/admin/sections/Calendar';
import SettingsSection from '@dashboards/admin/sections/Settings';

import { ADMIN_TABS, PAGE_META } from '@dashboards/admin/constants/navigation';
import { useTheme } from '@/app/providers/ThemeProvider';

const TAB_STORAGE_KEY = 'adminActiveTab';
const PAGINATED_TABS = new Set([ADMIN_TABS.USERS, ADMIN_TABS.USERS_LIST]);

const SECTION_MAP = {
  [ADMIN_TABS.CHARTS]: (dark) => <ChartReviewSection isDarkMode={dark} />,
  [ADMIN_TABS.USERS_ROLES]: (dark) => <UserManagementSection isDarkMode={dark} mode="roles" />,
  [ADMIN_TABS.USERS_LIST]: (dark) => <UserManagementSection isDarkMode={dark} mode="list" />,
  [ADMIN_TABS.USERS]: (dark) => <UserManagementSection isDarkMode={dark} mode="list" />,
  [ADMIN_TABS.ANALYTICS]: (dark) => <AnalyticsSection isDarkMode={dark} />,
  [ADMIN_TABS.CALENDAR]: (dark) => <CalendarSection isDarkMode={dark} />,
  [ADMIN_TABS.SETTINGS]: (dark) => <SettingsSection isDarkMode={dark} />,
};

const renderSection = (tab, isDarkMode, setActiveTab) =>
  (SECTION_MAP[tab]?.(isDarkMode)) ?? (
    <DashboardOverview
      isDarkMode={isDarkMode}
      onSelectTab={setActiveTab}
    />
  );

const AdminDashboard = () => {
  const { isDarkMode, setIsDarkMode } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const activeTab =
    searchParams.get('tab') ||
    localStorage.getItem(TAB_STORAGE_KEY) ||
    ADMIN_TABS.DASHBOARD;

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

  const activeMeta = PAGE_META[activeTab] ?? PAGE_META[ADMIN_TABS.DASHBOARD];

  useEffect(() => {
    document.title = activeMeta?.title
      ? `WaveLab – ${activeMeta.title}`
      : 'WaveLab – Dashboard';
  }, [activeMeta]);

  const toggleMobileMenu = useCallback(() => setIsMobileOpen((p) => !p), []);
  const toggleDarkMode = useCallback(() => setIsDarkMode((p) => !p), [setIsDarkMode]);

  const activeSection = useMemo(
    () => renderSection(activeTab, isDarkMode, setActiveTab),
    [activeTab, isDarkMode, setActiveTab],
  );

  return (
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
      {activeSection}
    </AdminShell>
  );
};

export default AdminDashboard;
