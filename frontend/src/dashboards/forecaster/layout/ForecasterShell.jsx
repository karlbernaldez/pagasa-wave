import { useState } from 'react';
import ForecasterSidebar from '../components/sidebar/ForecasterSidebar';
import ForecasterHeader from '../components/header/ForecasterHeader';
import { useTheme } from '@/app/providers/ThemeProvider';

export default function ForecasterShell({ children }) {
  const { isDarkMode } = useTheme();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className={`min-h-screen flex transition-colors duration-500 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <ForecasterSidebar
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        isDarkMode={isDarkMode}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        <ForecasterHeader
          onMobileMenuToggle={() => setIsMobileOpen((p) => !p)}
          isDarkMode={isDarkMode}
        />

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
