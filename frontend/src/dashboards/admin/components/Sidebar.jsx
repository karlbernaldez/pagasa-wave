import { X, Waves } from 'lucide-react';

const Sidebar = ({ menuItems, activeTab, setActiveTab, isMobileOpen, setIsMobileOpen, isDarkMode }) => (
  <>
    {isMobileOpen && (
      <div
        className="fixed inset-0 bg-black/50 lg:hidden z-30 backdrop-blur-sm"
        onClick={() => setIsMobileOpen(false)}
      />
    )}

    <aside
      className={`fixed lg:static inset-y-0 left-0 w-64 transition-all duration-300 z-40 overflow-y-auto ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } ${isDarkMode
        ? 'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-gray-700/50'
        : 'bg-gradient-to-b from-white via-gray-50 to-white border-gray-200/50'
      } border-r backdrop-blur-xl`}
    >
      <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-gray-700/30' : 'border-gray-200/30'}`}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-blue-400 via-cyan-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
            <Waves size={24} className="text-white" />
          </div>
          <div>
            <h1 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>WaveAdmin</h1>
            <p className={`text-xs font-semibold ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>Forecast Hub</p>
          </div>
        </div>
        <button
          onClick={() => setIsMobileOpen(false)}
          className={`lg:hidden p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
        >
          <X size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
        </button>
      </div>

      <nav className="p-4 space-y-2 mt-6">
        {menuItems.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;

          return (
            <button
              key={id}
              onClick={() => {
                setActiveTab(id);
                setIsMobileOpen(false);
              }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-semibold transition-all duration-300 relative group ${
                isActive
                  ? isDarkMode
                    ? 'bg-gradient-to-r from-blue-600/80 to-cyan-600/80 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-700'
                  : isDarkMode
                    ? 'text-gray-300 hover:bg-gray-700/40'
                    : 'text-gray-700 hover:bg-gray-100/50'
              }`}
            >
              {isActive && (
                <div className={`absolute inset-0 rounded-xl ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/20'
                    : 'bg-gradient-to-r from-blue-400/10 to-cyan-400/10'
                } animate-pulse`} />
              )}
              <Icon size={20} className={isActive ? '' : 'group-hover:scale-110 transition-transform'} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  </>
);

export default Sidebar;