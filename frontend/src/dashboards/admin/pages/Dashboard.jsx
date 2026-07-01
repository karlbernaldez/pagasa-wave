import { useMemo } from 'react';

import { useAdminDashboard } from '@dashboards/admin/context/AdminDashboardContext';
import DashboardOverview from '@dashboards/admin/sections/Overview';
import ChartReviewSection from '@dashboards/admin/sections/chart-review/ChartReview';
import UserManagementSection from '@dashboards/admin/sections/user-management/UserManagement';
import AnalyticsSection from '@dashboards/admin/sections/Analytics';
import CalendarSection from '@dashboards/admin/sections/Calendar';
import SettingsSection from '@dashboards/admin/sections/Settings';
import { ADMIN_TABS } from '@dashboards/admin/constants/navigation';

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
  const { activeTab, isDarkMode, setActiveTab } = useAdminDashboard();

  return useMemo(
    () => renderSection(activeTab, isDarkMode, setActiveTab),
    [activeTab, isDarkMode, setActiveTab],
  );
};

export default AdminDashboard;
