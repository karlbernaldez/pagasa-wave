import { useState } from 'react';
import { ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { NAV_ITEMS, CHART_TYPES } from './constants/navigation';
import { Avatar } from './UserDropdown';

/**
 * Full-screen overlay menu shown on mobile viewports.
 * Owns its own chart-sub-menu open state to stay self-contained.
 */
export function MobileMenu({ isDarkMode, isLoggedIn, currentUser, activeChartType, isActiveRoute, onNavigate, onSelectChartType, onNavigateUser, onSignOut }) {
  const [isChartSubMenuOpen, setIsChartSubMenuOpen] = useState(false);

  return (
    <div className={`
      fixed top-[70px] left-0 w-full h-[calc(100%-70px)]
      backdrop-blur-lg z-40 px-4 py-8 overflow-y-auto flex flex-col gap-4
      ${isDarkMode ? 'bg-slate-900/95' : 'bg-white/95'}
    `}>
      {/* Nav Links */}
      {NAV_ITEMS.map((item) => (
        <div key={item.href}>
          {item.hasDropdown ? (
            <>
              <button
                onClick={() => setIsChartSubMenuOpen((prev) => !prev)}
                className={`
                  text-xl px-4 py-3 w-full text-left flex items-center justify-between
                  border-none bg-transparent cursor-pointer font-medium rounded-md
                  transition-all duration-200
                  ${isActiveRoute(item.href)
                    ? isDarkMode ? 'text-blue-400 bg-blue-900/20' : 'text-blue-600 bg-blue-100'
                    : isDarkMode ? 'text-gray-300 hover:text-blue-300 hover:bg-gray-800'
                                 : 'text-gray-700 hover:text-blue-800 hover:bg-slate-50'}
                `}
              >
                {item.name}
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${isChartSubMenuOpen ? 'rotate-180' : 'rotate-0'} ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                />
              </button>

              {isChartSubMenuOpen && (
                <div className="pl-6 mt-2 space-y-1">
                  {CHART_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isActive = activeChartType === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => onSelectChartType(type.id)}
                        className={`
                          w-full flex items-center gap-3 p-3 rounded-lg cursor-pointer
                          transition-all duration-200 text-left border-none
                          ${isActive
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg scale-[1.02]'
                            : isDarkMode
                              ? 'bg-transparent text-gray-100 hover:bg-slate-700/70 hover:text-white hover:shadow-md hover:scale-[1.02]'
                              : 'bg-transparent text-gray-800 hover:bg-blue-50 hover:text-blue-900 hover:shadow-md hover:scale-[1.02]'}
                        `}
                      >
                        <Icon size={18} className={isActive ? 'text-white' : ''} />
                        <div className="flex-1">
                          <div className={`font-semibold text-sm ${isActive ? 'text-white' : isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                            {type.name}
                          </div>
                          <div className={`text-xs ${isActive ? 'text-white/90' : isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {type.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <button
              onClick={() => onNavigate(item.href)}
              className={`
                text-xl px-4 py-3 w-full text-left border-none bg-transparent
                cursor-pointer font-medium rounded-md transition-all duration-200 relative
                ${isActiveRoute(item.href)
                  ? isDarkMode
                    ? 'text-blue-400 bg-blue-900/20 before:content-[""] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-5 before:bg-blue-400 before:rounded-r-sm'
                    : 'text-blue-600 bg-blue-100 before:content-[""] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-5 before:bg-blue-600 before:rounded-r-sm'
                  : isDarkMode ? 'text-gray-300 hover:text-blue-300 hover:bg-gray-800'
                               : 'text-gray-700 hover:text-blue-800 hover:bg-slate-50'}
              `}
            >
              {item.name}
            </button>
          )}
        </div>
      ))}

      <hr className={`my-4 ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`} />

      {/* Auth section */}
      {isLoggedIn ? (
        <div className={`pt-3 border-t mt-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          {/* User identity */}
          <div className="flex items-center px-4 py-2 gap-3 mb-4">
            <Avatar user={currentUser} isDarkMode={isDarkMode} size={10} />
            <div className="flex-1 min-w-0">
              <div className={`font-semibold text-sm break-words ${isDarkMode ? 'text-gray-50' : 'text-gray-900'}`}>
                {currentUser?.username ?? 'Loading…'}
              </div>
              <div className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {currentUser?.position ?? 'Please wait…'}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <MobileActionButton icon={User}     label="View Profile" onClick={() => onNavigateUser('/profile')} />
            <MobileActionButton icon={Settings} label="Settings"     onClick={() => onNavigateUser('/settings')} />
            <MobileActionButton icon={LogOut}   label="Sign Out"     onClick={onSignOut} />
          </div>
        </div>
      ) : (
        <MobileActionButton
          icon={User}
          label="Staff Login"
          onClick={() => onNavigate('/login')}
          className="mt-4"
          quiet
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function MobileActionButton({ icon: Icon, label, onClick, className = '', quiet = false, isDarkMode = false }) {
  return (
    <button
      onClick={onClick}
      className={`
        rounded-xl px-6 py-3 font-semibold text-sm cursor-pointer transition-all duration-300
        flex items-center justify-center gap-2 shadow-lg w-full
        hover:-translate-y-0.5 hover:scale-[1.02]
        ${quiet
          ? isDarkMode
            ? 'border border-slate-700 bg-slate-800/40 text-slate-300 shadow-none hover:bg-slate-800 hover:text-white'
            : 'border border-slate-200 bg-white text-slate-600 shadow-none hover:bg-slate-50 hover:text-slate-900'
          : 'border-none bg-gradient-to-br from-sky-500 to-blue-600 text-white hover:shadow-xl'}
        ${className}
      `}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}
