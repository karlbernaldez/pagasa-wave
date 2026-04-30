import DashboardHeader from './DashboardHeader';
import DashboardSidebar from './DashboardSidebar';

const DashboardShell = ({
  activeId,
  children,
  contentClassName = 'flex-1 overflow-y-auto',
  header,
  isDarkMode,
  isMobileOpen,
  isSidebarCollapsed,
  onItemSelect,
  onMobileMenuToggle,
  onThemeToggle,
  setIsMobileOpen,
  setIsSidebarCollapsed,
  sidebar,
}) => {
  return (
    <div
      className={`min-h-screen flex transition-colors duration-500 ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}
    >
      <DashboardSidebar
        activeId={activeId}
        isDarkMode={isDarkMode}
        isMobileOpen={isMobileOpen}
        isSidebarCollapsed={isSidebarCollapsed}
        onItemSelect={onItemSelect}
        setIsMobileOpen={setIsMobileOpen}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        {...sidebar}
      />

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <DashboardHeader
          isDarkMode={isDarkMode}
          onMobileMenuToggle={onMobileMenuToggle}
          onThemeToggle={onThemeToggle}
          {...header}
        />

        <main className={contentClassName}>{children}</main>
      </div>
    </div>
  );
};

export default DashboardShell;
