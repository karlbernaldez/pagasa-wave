import DashboardHeader from './DashboardHeader';
import DashboardSidebar from './DashboardSidebar';

const DashboardShell = ({
  activeId,
  backgroundVariant = 'default',
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
  const isOceanBackground = backgroundVariant === 'ocean';
  const backgroundClass = isOceanBackground
    ? isDarkMode
      ? 'bg-[#021a36] bg-[radial-gradient(circle_at_48%_-10%,rgba(14,165,233,0.24),transparent_40%),radial-gradient(circle_at_88%_42%,rgba(6,182,212,0.12),transparent_34%),linear-gradient(145deg,#03182f_0%,#052e55_54%,#02152c_100%)]'
      : 'bg-[#e8f5fb] bg-[radial-gradient(circle_at_45%_-10%,rgba(14,165,233,0.18),transparent_42%),radial-gradient(circle_at_90%_45%,rgba(6,182,212,0.10),transparent_36%),linear-gradient(145deg,#f0f9ff_0%,#e8f4f8_55%,#eef6ff_100%)]'
    : isDarkMode
      ? 'bg-[linear-gradient(135deg,#020617_0%,#0f172a_48%,#082f49_100%)]'
      : 'bg-[linear-gradient(135deg,#e0f2fe_0%,#f8fafc_42%,#eef2ff_100%)]';

  return (
    <div
      className={`relative flex min-h-screen overflow-x-hidden transition-colors duration-500 ${backgroundClass}`}
      style={isOceanBackground ? {
        backgroundImage: isDarkMode
          ? "linear-gradient(145deg,rgba(3,24,47,.86),rgba(5,46,85,.76) 54%,rgba(2,21,44,.88)), url('/images/WavelabPublicHeroNight.png')"
          : "linear-gradient(145deg,rgba(240,249,255,.82),rgba(232,244,248,.74) 55%,rgba(238,246,255,.84)), url('/images/WavelabPublicHero.png')",
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      } : undefined}
    >
      {isOceanBackground && <div className={`pointer-events-none fixed inset-0 z-0 opacity-30 ${isDarkMode ? 'mix-blend-screen' : 'mix-blend-multiply'}`} style={{ backgroundImage: 'repeating-radial-gradient(ellipse at 92% 110%, transparent 0 22px, rgba(56,189,248,.15) 23px 24px), linear-gradient(180deg, rgba(255,255,255,.05), transparent 24%)' }} aria-hidden="true" />}
      <DashboardSidebar
        activeId={activeId}
        backgroundVariant={backgroundVariant}
        isDarkMode={isDarkMode}
        isMobileOpen={isMobileOpen}
        isSidebarCollapsed={isSidebarCollapsed}
        onItemSelect={onItemSelect}
        setIsMobileOpen={setIsMobileOpen}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        {...sidebar}
      />

      <div
        className={`relative z-10 flex min-h-screen min-w-0 flex-1 flex-col transition-[margin] duration-300 ${
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
