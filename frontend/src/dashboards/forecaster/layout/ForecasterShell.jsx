import { useCallback, useState } from 'react';
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
import DashboardHeader from '@/shared/dashboard-shell/DashboardHeader';
import DashboardSidebar from '@/shared/dashboard-shell/DashboardSidebar';

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

export default function ForecasterShell({ children }) {
  const { isDarkMode, setIsDarkMode } = useTheme();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleMobileMenu = useCallback(() => setIsMobileOpen((p) => !p), []);
  const toggleDarkMode = useCallback(() => setIsDarkMode((p) => !p), [setIsDarkMode]);

  return (
    <div
      className={`min-h-screen flex transition-colors duration-500 ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}
    >
      <DashboardSidebar
        isDarkMode={isDarkMode}
        isMobileOpen={isMobileOpen}
        isSidebarCollapsed={isSidebarCollapsed}
        items={NAV_ITEMS}
        label="Forecaster Studio"
        setIsMobileOpen={setIsMobileOpen}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
      />

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <DashboardHeader
          eyebrow="Forecaster Studio"
          title="WaveLab Operations"
          description="Track, manage, and continue active marine forecast projects"
          isDarkMode={isDarkMode}
          onMobileMenuToggle={toggleMobileMenu}
          onThemeToggle={toggleDarkMode}
          user={{ name: 'Juan Dela Cruz', role: 'Forecaster', initials: 'JD' }}
        />

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
