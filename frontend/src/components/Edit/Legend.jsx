import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const LegendItem = ({ label, symbol, isDarkMode }) => (
  <li className="flex items-center gap-3 group">
    <span className="w-6 h-6 flex items-center justify-center flex-shrink-0">
      {symbol}
    </span>
    <span
      className={`
        text-[13px] font-medium
        ${isDarkMode
          ? "text-white/90 group-hover:text-white/70"
          : "text-gray-900 group-hover:text-gray-700"}
        transition-colors duration-200
      `}
    >
      {label}
    </span>
  </li>
);

const LegendBox = ({ isDarkMode = false }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={`
        fixed bottom-7 left-2 w-96
        ${isDarkMode
          ? "bg-[rgba(20,20,20,0.25)]"
          : "bg-[rgba(255,255,255,0.35)]"}    /* ← slightly stronger white for better contrast */
        backdrop-blur-3xl backdrop-saturate-150
        rounded-2xl border border-white/10
        shadow-[0_8px_32px_rgba(0,0,0,0.1)]
        z-50 overflow-hidden
        transition-all duration-500
      `}
    >
      {/* Header */}
      <div
        className={`
          px-5 py-3 border-b border-black/10 dark:border-white/10 
          ${isDarkMode ? "bg-white/5" : "bg-white/40"}   /* ← lighter tone for contrast */
          cursor-pointer select-none
          hover:bg-opacity-80 transition-all duration-200
        `}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center justify-between">
          <h3
            className={`text-[15px] font-semibold tracking-tight
              ${isDarkMode ? "text-white/90" : "text-gray-900/95"}
            `}
          >
            Legend
          </h3>
          <button
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors duration-200"
            aria-label={isCollapsed ? "Expand legend" : "Collapse legend"}
          >
            {isCollapsed ? (
              <ChevronDown size={18} className="opacity-70" />
            ) : (
              <ChevronUp size={18} className="opacity-70" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        className={`
          overflow-hidden transition-all duration-500 ease-in-out
          ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'}
        `}
      >
        <div className={`px-5 py-4 ${isDarkMode ? "bg-black/10" : "bg-white/30"}`}>
          <ul className="flex flex-wrap gap-x-8 gap-y-3.5">
            <LegendItem
              label="Wave Heights"
              isDarkMode={isDarkMode}
              symbol={
                <img
                  src="/wave.png"
                  alt="Wave Height"
                  className="w-5 h-5 object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)] group-hover:scale-105 transition-transform duration-150"
                />
              }
            />
            <LegendItem
              label="Tropical Cyclone"
              isDarkMode={isDarkMode}
              symbol={
                <img
                  src="/hurricane.png"
                  alt="Tropical Cyclone"
                  className="w-5 h-5 object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)] group-hover:scale-105 transition-transform duration-150"
                />
              }
            />
            <LegendItem
              label="LPA"
              isDarkMode={isDarkMode}
              symbol={
                <span className="text-[17px] font-black text-red-600 dark:text-red-500 drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)] group-hover:scale-105 transition-transform duration-150">
                  L
                </span>
              }
            />
            <LegendItem
              label="HPA"
              isDarkMode={isDarkMode}
              symbol={
                <span className="text-[17px] font-black text-blue-600 dark:text-blue-500 drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)] group-hover:scale-105 transition-transform duration-150">
                  H
                </span>
              }
            />
            <LegendItem
              label="Surface Fronts"
              isDarkMode={isDarkMode}
              symbol={
                <div
                  className="w-6 h-[3px] rounded-[1px] group-hover:scale-105 transition-transform duration-150"
                  style={{
                    backgroundImage:
                      'linear-gradient(to right, #2563eb 25%, #ef4444 25%, #ef4444 50%, #2563eb 50%, #2563eb 75%, #ef4444 75%)'
                  }}
                />
              }
            />
          </ul>
        </div>

        {/* Footer */}
        <div
          className={`
            px-5 py-2.5 border-t border-black/10 dark:border-white/10 
            ${isDarkMode ? "bg-white/5" : "bg-white/40"}  /* brighter for light mode */
          `}
        >
          <div className="flex justify-between items-center text-[11px] font-medium text-gray-700/80 dark:text-gray-300/80">
            {/* <span>
              : <strong className="text-cyan-600 dark:text-cyan-400 font-semibold">JAE</strong>
            </span> */}
            {/* <span>
              By: <strong className="text-cyan-600 dark:text-cyan-400 font-semibold">KSBB</strong>
            </span> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegendBox;
