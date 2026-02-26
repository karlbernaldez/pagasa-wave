import { useEffect, useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import Sidebar               from '@dashboards/admin/components/Sidebar';
import Header                from '@dashboards/admin/components/Header';
import DashboardOverview     from '@dashboards/admin/sections/Overview';
import ChartReviewSection    from '@dashboards/admin/sections/ChartReview';
import UserManagementSection from '@dashboards/admin/sections/user-management/UserManagement';
import AnalyticsSection      from '@dashboards/admin/sections/Analytics';
import CalendarSection       from '@dashboards/admin/sections/Calendar';
import SettingsSection       from '@dashboards/admin/sections/Settings';

import { ADMIN_TABS, MENU_ITEMS, PAGE_META } from '@dashboards/admin/constants/navigation';
import { useTheme } from '@/app/providers/ThemeProvider';

// ─── Constants ────────────────────────────────────────────────────────────────

const TAB_STORAGE_KEY = 'adminActiveTab';

// Only these tabs carry ?page & ?limit in the URL
const PAGINATED_TABS = new Set([ADMIN_TABS.USERS, ADMIN_TABS.USERS_LIST]);

// ─── Section map ──────────────────────────────────────────────────────────────
// Factory functions so sections are only instantiated for the active tab.

const SECTION_MAP = {
  [ADMIN_TABS.CHARTS]:      (dark) => <ChartReviewSection    isDarkMode={dark} />,
  [ADMIN_TABS.USERS_ROLES]: (dark) => <UserManagementSection isDarkMode={dark} mode="roles" />,
  [ADMIN_TABS.USERS_LIST]:  (dark) => <UserManagementSection isDarkMode={dark} mode="list"  />,
  [ADMIN_TABS.USERS]:       (dark) => <UserManagementSection isDarkMode={dark} mode="list"  />,
  [ADMIN_TABS.ANALYTICS]:   (dark) => <AnalyticsSection      isDarkMode={dark} />,
  [ADMIN_TABS.CALENDAR]:    (dark) => <CalendarSection       isDarkMode={dark} />,
  [ADMIN_TABS.SETTINGS]:    (dark) => <SettingsSection       isDarkMode={dark} />,
};

const renderSection = (tab, isDarkMode) =>
  (SECTION_MAP[tab]?.(isDarkMode)) ?? <DashboardOverview isDarkMode={isDarkMode} />;

// ─── Component ────────────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const { isDarkMode, setIsDarkMode } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isMobileOpen,       setIsMobileOpen]       = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // ── Active tab — URL → localStorage → default ────────────────────────────
  const activeTab =
    searchParams.get('tab') ||
    localStorage.getItem(TAB_STORAGE_KEY) ||
    ADMIN_TABS.DASHBOARD;

  // ── Tab setter ────────────────────────────────────────────────────────────
  // Paginated tabs keep ?page & ?limit so the table survives a reload.
  // Every other tab gets a clean URL with only ?tab= — no pagination clutter.
  const setActiveTab = useCallback(
    (tab) => {
      localStorage.setItem(TAB_STORAGE_KEY, tab);

      const next = new URLSearchParams({ tab });

      if (PAGINATED_TABS.has(tab)) {
        // Carry forward existing pagination or start at page 1
        next.set('page',  searchParams.get('page')  ?? '1');
        next.set('limit', searchParams.get('limit') ?? '5');
      }

      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  // ── Page title ────────────────────────────────────────────────────────────
  const activeMeta = PAGE_META[activeTab] ?? PAGE_META[ADMIN_TABS.DASHBOARD];

  useEffect(() => {
    document.title = activeMeta?.title
      ? `WaveLab – ${activeMeta.title}`
      : 'WaveLab – Dashboard';
  }, [activeMeta]);

  // ── Stable toggle callbacks ───────────────────────────────────────────────
  const toggleMobileMenu = useCallback(() => setIsMobileOpen((p) => !p),  []);
  const toggleDarkMode   = useCallback(() => setIsDarkMode((p)  => !p),   [setIsDarkMode]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className={`min-h-screen flex transition-colors duration-500 ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}
    >
      <Sidebar
        menuItems={MENU_ITEMS}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        isDarkMode={isDarkMode}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        <Header
          activeMeta={activeMeta}
          onMobileMenuToggle={toggleMobileMenu}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
        />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {renderSection(activeTab, isDarkMode)}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;