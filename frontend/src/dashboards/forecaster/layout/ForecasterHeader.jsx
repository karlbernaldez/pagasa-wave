// src/dashboards/forecaster/layout/ForecasterHeader.jsx

export default function ForecasterHeader({ onMenuClick }) {
  return (
    <header className="flex items-center justify-between border-b bg-white px-4 py-3">
      {/* Mobile menu */}
      <button
        className="md:hidden"
        onClick={onMenuClick}
      >
        ☰
      </button>

      <div className="font-semibold">
        Forecast Dashboard
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">
          User
        </span>
      </div>
    </header>
  );
}