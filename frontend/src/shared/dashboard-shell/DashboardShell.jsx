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
        isDarkMode
          ? 'bg-[linear-gradient(135deg,#020617_0%,#0f172a_48%,#082f49_100%)]'
          : 'bg-[linear-gradient(135deg,#e0f2fe_0%,#f8fafc_42%,#eef2ff_100%)]'
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

      <div
        className={`flex min-h-screen min-w-0 flex-1 flex-col transition-[margin] duration-300 ${
          isSidebarCollapsed ? 'lg:ml-[86px]' : 'lg:ml-[292px]'
        }`}
      >
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
