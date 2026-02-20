import { useEffect, useMemo, useState } from 'react';

import Sidebar from '@dashboards/admin/components/Sidebar';
import Header from '@dashboards/admin/components/Header';
import DashboardOverview from '@dashboards/admin/sections/Overview';
import ChartReviewSection from '@dashboards/admin/sections/ChartReview';
import UserManagementSection from '@dashboards/admin/sections/UserManagement';
import AnalyticsSection from '@dashboards/admin/sections/Analytics';
import CalendarSection from '@dashboards/admin/sections/Calendar';
import SettingsSection from '@dashboards/admin/sections/Settings';
import { ADMIN_TABS, MENU_ITEMS, PAGE_META } from '@dashboards/admin/constants/navigation';
import { useTheme } from '@/app/providers/ThemeProvider';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState(ADMIN_TABS.DASHBOARD);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { isDarkMode, setIsDarkMode } = useTheme();

  useEffect(() => {
    document.title = 'WaveLab - Dashboard';
  }, []);

  const activeMeta = useMemo(() => PAGE_META[activeTab] || PAGE_META[ADMIN_TABS.DASHBOARD], [activeTab]);

  const renderedSection = useMemo(() => {
    switch (activeTab) {
      case ADMIN_TABS.CHARTS:
        return <ChartReviewSection isDarkMode={isDarkMode} />;
      case ADMIN_TABS.USERS_ROLES:
        return <UserManagementSection isDarkMode={isDarkMode} mode="roles" />;
      case ADMIN_TABS.USERS_LIST:
      case ADMIN_TABS.USERS:
        return <UserManagementSection isDarkMode={isDarkMode} mode="list" />;
      case ADMIN_TABS.ANALYTICS:
        return <AnalyticsSection isDarkMode={isDarkMode} />;
      case ADMIN_TABS.CALENDAR:
        return <CalendarSection isDarkMode={isDarkMode} />;
      case ADMIN_TABS.SETTINGS:
        return <SettingsSection isDarkMode={isDarkMode} />;
      default:
        return <DashboardOverview isDarkMode={isDarkMode} />;
    }
  }, [activeTab, isDarkMode]);

  return (
    <div className={`min-h-screen flex transition-colors duration-500 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
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
          onMobileMenuToggle={() => setIsMobileOpen((prev) => !prev)}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
        />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">{renderedSection}</main>
      </div>
    </div>
  );
};

export default AdminDashboard;
