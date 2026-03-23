import { ChevronDown } from 'lucide-react';
import { CHART_TYPES } from './constants/navigation';
import { useHoverDropdown } from './hooks/useHoverDropdown';

/**
 * "Charts" nav button with a hover-triggered dropdown for chart-type selection.
 */
export function ChartDropdown({ isDarkMode, activeChartType, isActive, onNavigate, onSelectType }) {
  const { isOpen, handlers } = useHoverDropdown(150);

  return (
    <div className="relative" {...handlers}>
      {/* Trigger */}
      <button
        onClick={() => onNavigate('/charts')}
        className={`
          px-4 py-2 border-none bg-transparent cursor-pointer text-base font-semibold
          rounded-md transition-all duration-200 relative flex items-center gap-2
          ${isActive
            ? isDarkMode ? 'text-white bg-blue-900/30'  : 'text-gray-900 bg-blue-100'
            : isDarkMode ? 'text-gray-100 hover:text-white hover:bg-gray-800'
                         : 'text-gray-900 hover:text-blue-900 hover:bg-slate-50'}
        `}
      >
        Charts
        <ChevronDown
          size={14}
          className={`
            transition-transform duration-200
            ${isOpen ? 'rotate-180' : 'rotate-0'}
            ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}
          `}
        />
        {isActive && (
          <span className={`
            absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-sm
            ${isDarkMode ? 'bg-blue-400' : 'bg-blue-600'}
          `} />
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className={`
          absolute top-full left-0 mt-2 w-[280px] rounded-xl backdrop-blur-2xl border
          shadow-2xl z-50 p-2
          ${isDarkMode
            ? 'bg-slate-800/95 border-slate-600/50'
            : 'bg-white/95 border-gray-200/50'}
        `}>
          <div className={`px-4 py-3 mb-2 border-b ${isDarkMode ? 'border-white/20' : 'border-gray-200'}`}>
            <h4 className={`text-sm font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Chart Types
            </h4>
            <p className={`text-xs m-0 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Select your preferred chart display
            </p>
          </div>

          {CHART_TYPES.map((type) => (
            <ChartTypeOption
              key={type.id}
              type={type}
              isActive={activeChartType === type.id}
              isDarkMode={isDarkMode}
              onClick={() => onSelectType(type.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Internal sub-component — not exported; only used by ChartDropdown
// ---------------------------------------------------------------------------

function ChartTypeOption({ type, isActive, isDarkMode, onClick }) {
  const { icon: Icon } = type;

  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 p-3 rounded-lg border-none cursor-pointer
        transition-all duration-200 mb-1
        ${isActive
          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg scale-[1.02]'
          : isDarkMode
            ? 'bg-transparent text-gray-100 hover:bg-slate-700/70 hover:text-white hover:shadow-md hover:scale-[1.02]'
            : 'bg-transparent text-gray-800 hover:bg-blue-50 hover:text-blue-900 hover:shadow-md hover:scale-[1.02]'}
      `}
    >
      <Icon size={18} className={isActive ? 'text-white' : ''} />

      <div className="flex-1 text-left">
        <div className={`font-semibold text-sm mb-0.5 ${isActive ? 'text-white' : isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
          {type.name}
        </div>
        <div className={`text-xs ${isActive ? 'text-white/90' : isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {type.description}
        </div>
      </div>

      {isActive && <div className="w-2 h-2 rounded-full bg-white shadow-sm" />}
    </button>
  );
}