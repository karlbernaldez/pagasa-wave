import { Outlet } from 'react-router-dom';
import { useState } from 'react';

import ForecasterSidebar from '../components/sidebar/ForecasterSidebar';

export default function ForecasterRouteLayout() {
  const [isDarkMode, setIsDarkMode] =
    useState(true);

  const [isMobileOpen, setIsMobileOpen] =
    useState(false);

  const [
    isSidebarCollapsed,
    setIsSidebarCollapsed,
  ] = useState(false);

  return (
    <div
      className={`flex h-screen overflow-hidden ${
        isDarkMode
          ? 'bg-[#020c1b]'
          : 'bg-[#f3f6fa]'
      }`}
    >
      <ForecasterSidebar
        isDarkMode={isDarkMode}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={
          setIsMobileOpen
        }
        isSidebarCollapsed={
          isSidebarCollapsed
        }
        setIsSidebarCollapsed={
          setIsSidebarCollapsed
        }
      />

      <main className="flex flex-1 flex-col overflow-hidden min-h-0">
        <Outlet
          context={{
            isDarkMode,
            setIsDarkMode,
          }}
        />
      </main>
    </div>
  );
}