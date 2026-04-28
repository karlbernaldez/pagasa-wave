export default function ForecasterHeader({ onMobileMenuToggle, isDarkMode }) {
  return (
    <header
      className={`h-16 flex items-center justify-between px-4 border-b ${
        isDarkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
      }`}
    >
      <button onClick={onMobileMenuToggle} className="text-sm font-medium">
        Menu
      </button>

      <div className="text-sm font-semibold">Forecaster Dashboard</div>

      <div />
    </header>
  );
}
