import { useMemo } from 'react';

import { useOperationalDashboard } from './OperationalDashboardContext';
import DashboardOverview from '@dashboards/admin/sections/Overview';
import ChartReviewSection from '@dashboards/admin/sections/chart-review/ChartReview';
import UserManagementSection from '@dashboards/admin/sections/user-management/UserManagement';
import WaveModelManagement from '@dashboards/admin/sections/wave-models/WaveModelManagement';
import WavePipelineStatus from '@dashboards/admin/sections/wave-models/WavePipelineStatus';
import WaveModelOnboarding from '@dashboards/admin/sections/wave-models/WaveModelOnboarding';
import AnalyticsAccess from '@dashboards/admin/sections/AnalyticsAccess';
import CalendarSection from '@dashboards/admin/sections/Calendar';
import SettingsSection from '@dashboards/admin/sections/Settings';
import { ADMIN_TABS } from '@dashboards/admin/constants/navigation';

const SECTION_MAP = {
  [ADMIN_TABS.CHARTS]: (dark) => <ChartReviewSection isDarkMode={dark} />,
  [ADMIN_TABS.WAVE_MODELS]: (dark, setActiveTab) => (
    <WaveModelManagement isDarkMode={dark} onSelectTab={setActiveTab} />
  ),
  [ADMIN_TABS.WAVE_PIPELINE]: (dark) => <WavePipelineStatus isDarkMode={dark} />,
  [ADMIN_TABS.WAVE_MODEL_ONBOARDING]: (dark) => <WaveModelOnboarding isDarkMode={dark} />,
  [ADMIN_TABS.USERS_ROLES]: (dark) => <UserManagementSection isDarkMode={dark} mode="roles" />,
  [ADMIN_TABS.USERS_LIST]: (dark) => <UserManagementSection isDarkMode={dark} mode="list" />,
  [ADMIN_TABS.USERS]: (dark) => <UserManagementSection isDarkMode={dark} mode="list" />,
  [ADMIN_TABS.ANALYTICS]: (dark) => <AnalyticsAccess isDarkMode={dark} />,
  [ADMIN_TABS.CALENDAR]: (dark) => <CalendarSection isDarkMode={dark} />,
  [ADMIN_TABS.SETTINGS]: (dark) => <SettingsSection isDarkMode={dark} />,
};

const renderSection = (tab, isDarkMode, setActiveTab) =>
  SECTION_MAP[tab]?.(isDarkMode, setActiveTab) ?? (
    <DashboardOverview isDarkMode={isDarkMode} onSelectTab={setActiveTab} />
  );

export default function OperationalDashboardPage() {
  const { activeTab, isDarkMode, setActiveTab } = useOperationalDashboard();

  return useMemo(
    () => renderSection(activeTab, isDarkMode, setActiveTab),
    [activeTab, isDarkMode, setActiveTab]
  );
}
