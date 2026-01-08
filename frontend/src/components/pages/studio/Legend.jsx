import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const LegendBox = ({ isDarkMode = false }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const legendItems = [
    {
      icon: '/wave.png',
      label: 'Waves',
      color: isDarkMode ? 'from-blue-500/20 to-cyan-500/20' : 'from-blue-400/30 to-cyan-400/30',
      iconBg: isDarkMode ? 'bg-blue-500/10' : 'bg-blue-400/20'
    },
    {
      icon: '/hurricane.png',
      label: 'Cyclone',
      color: isDarkMode ? 'from-orange-500/20 to-red-500/20' : 'from-orange-400/30 to-red-400/30',
      iconBg: isDarkMode ? 'bg-orange-500/10' : 'bg-orange-400/20'
    },
    {
      text: 'L',
      label: 'Low',
      color: isDarkMode ? 'from-red-500/20 to-red-600/20' : 'from-red-400/30 to-red-500/30',
      textColor: isDarkMode ? 'text-red-400' : 'text-red-600',
      iconBg: isDarkMode ? 'bg-red-500/10' : 'bg-red-400/20'
    },
    {
      text: 'H',
      label: 'High',
      color: isDarkMode ? 'from-blue-500/20 to-blue-600/20' : 'from-blue-400/30 to-blue-500/30',
      textColor: isDarkMode ? 'text-blue-400' : 'text-blue-600',
      iconBg: isDarkMode ? 'bg-blue-500/10' : 'bg-blue-400/20'
    },
    {
      pattern: true,
      label: 'Fronts',
      color: isDarkMode ? 'from-purple-500/20 to-indigo-500/20' : 'from-purple-400/30 to-indigo-400/30',
      iconBg: isDarkMode ? 'bg-purple-500/10' : 'bg-purple-400/20'
    }
  ];

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={`group fixed bottom-6 left-6 flex items-center gap-2 pl-3 pr-2.5 py-2.5 rounded-full z-50 transition-all duration-300 hover:scale-105 ${
          isDarkMode
            ? 'bg-slate-900/80 hover:bg-slate-900/90 border border-white/10 shadow-lg shadow-black/50'
            : 'bg-white/70 hover:bg-white/80 border border-black/5 shadow-lg shadow-black/10'
        } backdrop-blur-xl`}
      >
        <span className={`text-xs font-semibold ${
          isDarkMode ? 'text-white/90' : 'text-slate-800'
        }`}>
          Legend
        </span>
        <ChevronRight 
          size={14} 
          className={`transition-transform duration-200 group-hover:translate-x-0.5 ${
            isDarkMode ? 'text-white/60' : 'text-slate-600'
          }`}
          strokeWidth={2.5}
        />
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 left-6 rounded-2xl z-50 transition-all duration-300 ${
        isDarkMode
          ? 'bg-slate-900/80 border border-white/10 shadow-2xl shadow-black/50'
          : 'bg-white/70 border border-black/5 shadow-xl shadow-black/10'
      } backdrop-blur-xl`}
      style={{ 
        maxWidth: 'fit-content'
      }}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
        <div className={`absolute inset-0 opacity-20 ${
          isDarkMode
            ? 'bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10'
            : 'bg-gradient-to-br from-blue-400/10 via-transparent to-cyan-400/10'
        }`} />
      </div>

      <div className="relative flex items-center gap-3 px-3.5 py-3">
        {/* Legend Items */}
        <div className="flex items-center gap-2.5">
          {legendItems.map((item, index) => (
            <div
              key={index}
              className={`group relative flex items-center gap-2 px-2.5 py-2 rounded-xl transition-all duration-200 hover:scale-105 cursor-default ${
                isDarkMode
                  ? 'hover:bg-white/5'
                  : 'hover:bg-black/5'
              }`}
            >
              {/* Icon Container */}
              <div className={`relative w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${item.color} ${item.iconBg} transition-all duration-200 group-hover:scale-110`}>
                {/* Subtle inner glow */}
                <div className="absolute inset-0 rounded-lg bg-white/5" />
                
                {item.icon && (
                  <img
                    src={item.icon}
                    alt={item.label}
                    className="relative w-4.5 h-4.5 object-contain drop-shadow-md z-10"
                  />
                )}
                {item.text && (
                  <span className={`relative text-sm font-black ${item.textColor} drop-shadow-sm z-10`}>
                    {item.text}
                  </span>
                )}
                {item.pattern && (
                  <div className="relative w-4.5 h-1.5 rounded-full z-10" style={{
                    background: 'repeating-linear-gradient(90deg, #3b82f6 0px, #3b82f6 3px, #ef4444 3px, #ef4444 6px)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }} />
                )}
              </div>
              
              {/* Label */}
              <span className={`text-xs font-semibold whitespace-nowrap ${
                isDarkMode ? 'text-white/90' : 'text-slate-800'
              }`}>
                {item.label}
              </span>

              {/* Tooltip on hover */}
              <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none ${
                isDarkMode
                  ? 'bg-slate-800 text-white border border-white/10'
                  : 'bg-white text-slate-800 border border-black/10'
              } backdrop-blur-xl shadow-lg`}>
                {item.label === 'Waves' && 'Ocean surface conditions'}
                {item.label === 'Cyclone' && 'Tropical storm systems'}
                {item.label === 'Low' && 'Low pressure area'}
                {item.label === 'High' && 'High pressure area'}
                {item.label === 'Fronts' && 'Weather boundaries'}
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className={`w-px h-8 ${
          isDarkMode ? 'bg-white/10' : 'bg-black/10'
        }`} />

        {/* Collapse Button */}
        <button
          onClick={() => setIsExpanded(false)}
          className={`group flex-shrink-0 p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
            isDarkMode
              ? 'hover:bg-white/10 text-white/60 hover:text-white/90'
              : 'hover:bg-black/10 text-slate-600 hover:text-slate-900'
          }`}
          aria-label="Collapse legend"
        >
          <ChevronLeft 
            size={14} 
            strokeWidth={2.5}
            className="transition-transform duration-200 group-hover:-translate-x-0.5"
          />
        </button>
      </div>

      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-0 right-0 h-px ${
        isDarkMode
          ? 'bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent'
          : 'bg-gradient-to-r from-transparent via-blue-500/20 to-transparent'
      }`} />
    </div>
  );
};

export default LegendBox;


// LEGEND - OLD VERSION
//--------------------------------------------------------------------------

// import React, { useState } from 'react';
// import { ChevronDown, Info } from 'lucide-react';

// const LegendBox = ({ isDarkMode = false }) => {
//   const [isExpanded, setIsExpanded] = useState(false);

//   const legendItems = [
//     {
//       icon: '/wave.png',
//       label: 'Waves',
//       color: isDarkMode ? 'bg-blue-500/20' : 'bg-blue-400/30',
//       ringColor: isDarkMode ? 'ring-blue-400/40' : 'ring-blue-500/50'
//     },
//     {
//       icon: '/hurricane.png',
//       label: 'Cyclone',
//       color: isDarkMode ? 'bg-orange-500/20' : 'bg-orange-400/30',
//       ringColor: isDarkMode ? 'ring-orange-400/40' : 'ring-orange-500/50'
//     },
//     {
//       text: 'L',
//       label: 'Low',
//       color: isDarkMode ? 'bg-red-500/20' : 'bg-red-400/30',
//       ringColor: isDarkMode ? 'ring-red-400/40' : 'ring-red-500/50',
//       textColor: isDarkMode ? 'text-red-300' : 'text-red-600'
//     },
//     {
//       text: 'H',
//       label: 'High',
//       color: isDarkMode ? 'bg-blue-500/20' : 'bg-blue-400/30',
//       ringColor: isDarkMode ? 'ring-blue-400/40' : 'ring-blue-500/50',
//       textColor: isDarkMode ? 'text-blue-300' : 'text-blue-600'
//     },
//     {
//       pattern: true,
//       label: 'Fronts',
//       color: isDarkMode ? 'bg-purple-500/20' : 'bg-purple-400/30',
//       ringColor: isDarkMode ? 'ring-purple-400/40' : 'ring-purple-500/50'
//     }
//   ];

//   return (
//     <div className="fixed bottom-6 left-6 z-50">
//       {/* Collapsed State - Minimal Pill */}
//       {!isExpanded && (
//         <button
//           onClick={() => setIsExpanded(true)}
//           className={`group flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300 hover:scale-105 ${
//             isDarkMode
//               ? 'bg-black/40 hover:bg-black/50 border border-white/20'
//               : 'bg-white/60 hover:bg-white/70 border border-black/10'
//           } backdrop-blur-xl shadow-lg`}
//         >
//           <Info 
//             size={16} 
//             className={`${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`}
//             strokeWidth={2.5}
//           />
//           <span className={`text-xs font-semibold ${
//             isDarkMode ? 'text-white/90' : 'text-slate-800'
//           }`}>
//             Legend
//           </span>
//           <ChevronDown 
//             size={14} 
//             className={`${isDarkMode ? 'text-white/60' : 'text-slate-600'} group-hover:translate-y-0.5 transition-transform`}
//             strokeWidth={2.5}
//           />
//         </button>
//       )}

//       {/* Expanded State - Clean Card */}
//       {isExpanded && (
//         <div
//           className={`rounded-2xl transition-all duration-300 ${
//             isDarkMode
//               ? 'bg-black/40 border border-white/20'
//               : 'bg-white/60 border border-white/40'
//           } backdrop-blur-xl shadow-xl`}
//           style={{ 
//             minWidth: '280px',
//             maxWidth: '320px'
//           }}
//         >
//           {/* Header - Collapsible */}
//           <button
//             onClick={() => setIsExpanded(false)}
//             className={`w-full flex items-center justify-between px-4 py-3 rounded-t-2xl transition-colors ${
//               isDarkMode
//                 ? 'hover:bg-white/5'
//                 : 'hover:bg-black/5'
//             }`}
//           >
//             <div className="flex items-center gap-2">
//               <Info 
//                 size={16} 
//                 className={`${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`}
//                 strokeWidth={2.5}
//               />
//               <span className={`text-sm font-bold ${
//                 isDarkMode ? 'text-white' : 'text-slate-900'
//               }`}>
//                 Map Legend
//               </span>
//             </div>
//             <ChevronDown 
//               size={16} 
//               className={`${isDarkMode ? 'text-white/60' : 'text-slate-600'} rotate-180 transition-transform`}
//               strokeWidth={2.5}
//             />
//           </button>

//           {/* Divider */}
//           <div className={`h-px ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`} />

//           {/* Legend Items - Vertical Stack */}
//           <div className="p-3 space-y-2">
//             {legendItems.map((item, index) => (
//               <div
//                 key={index}
//                 className={`group flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 ${
//                   isDarkMode
//                     ? 'hover:bg-white/5'
//                     : 'hover:bg-black/5'
//                 }`}
//               >
//                 {/* Icon Container - Consistent circular design */}
//                 <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${item.color} ring-1 ${item.ringColor} transition-transform duration-200 group-hover:scale-110`}>
//                   {item.icon && (
//                     <img
//                       src={item.icon}
//                       alt={item.label}
//                       className="w-4 h-4 object-contain"
//                     />
//                   )}
//                   {item.text && (
//                     <span className={`text-xs font-bold ${item.textColor}`}>
//                       {item.text}
//                     </span>
//                   )}
//                   {item.pattern && (
//                     <div className="w-4 h-1 rounded-full" style={{
//                       background: 'repeating-linear-gradient(90deg, #3b82f6 0px, #3b82f6 3px, #ef4444 3px, #ef4444 6px)'
//                     }} />
//                   )}
//                 </div>
                
//                 {/* Label */}
//                 <span className={`text-xs font-medium ${
//                   isDarkMode ? 'text-white/80' : 'text-slate-700'
//                 }`}>
//                   {item.label}
//                 </span>
//               </div>
//             ))}
//           </div>

//           {/* Footer - Subtle timestamp */}
//           <div className={`px-4 py-2 rounded-b-2xl ${
//             isDarkMode ? 'bg-white/5' : 'bg-black/5'
//           }`}>
//             <div className="flex items-center justify-between">
//               <span className={`text-[10px] font-medium ${
//                 isDarkMode ? 'text-white/40' : 'text-slate-500'
//               }`}>
//                 Live data
//               </span>
//               <span className={`text-[10px] font-bold tracking-wide ${
//                 isDarkMode
//                   ? 'text-cyan-400/80'
//                   : 'text-blue-600/80'
//               }`}>
//                 PAGASA
//               </span>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default LegendBox;