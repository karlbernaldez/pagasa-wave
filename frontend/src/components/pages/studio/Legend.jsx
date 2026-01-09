import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

const LegendBox = ({ isDarkMode = false }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const legendItems = [
    {
      icon: '/wave.png',
      label: 'Wave Heights',
      subtitle: 'Ocean surface conditions'
    },
    {
      icon: '/hurricane.png',
      label: 'Tropical Cyclone',
      subtitle: 'Active storm systems'
    },
    {
      text: 'L',
      label: 'Low Pressure',
      subtitle: 'LPA',
      textColor: isDarkMode ? 'text-red-400' : 'text-red-600',
      bgColor: isDarkMode ? 'bg-red-500/20' : 'bg-red-400/30'
    },
    {
      text: 'H',
      label: 'High Pressure',
      subtitle: 'HPA',
      textColor: isDarkMode ? 'text-blue-400' : 'text-blue-600',
      bgColor: isDarkMode ? 'bg-blue-500/20' : 'bg-blue-400/30'
    },
    {
      pattern: true,
      label: 'Surface Fronts',
      subtitle: 'Weather boundaries'
    }
  ];

  return (
    <div className="fixed bottom-8 left-4 z-50 w-72">
      <div
        className={`rounded-xl transition-all duration-300 ${
          isDarkMode
            ? 'bg-black/40 border border-white/20'
            : 'bg-white/60 border border-white/40'
        } backdrop-blur-xl shadow-xl`}
      >
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-t-xl transition-colors ${
            isDarkMode
              ? 'hover:bg-slate-700/30'
              : 'hover:bg-slate-100/50'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className={`p-1 rounded-lg ${
              isDarkMode ? 'bg-cyan-500/20' : 'bg-blue-500/20'
            }`}>
              <Info 
                size={14} 
                className={`${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`}
                strokeWidth={2.5}
              />
            </div>
            <span className={`text-xs font-bold ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              Map Legend
            </span>
          </div>
          
          {isExpanded ? (
            <ChevronUp 
              size={14} 
              className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}
              strokeWidth={2.5}
            />
          ) : (
            <ChevronDown 
              size={14} 
              className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}
              strokeWidth={2.5}
            />
          )}
        </button>

        {/* Divider */}
        {isExpanded && (
          <div className={`h-px ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-200/50'}`} />
        )}

        {/* Content */}
        {isExpanded && (
          <div className="p-2.5 space-y-1.5">
            {legendItems.map((item, index) => (
              <div
                key={index}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-200 ${
                  isDarkMode
                    ? 'hover:bg-slate-700/30'
                    : 'hover:bg-slate-100/50'
                }`}
              >
                {/* Icon/Symbol Container */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                  item.bgColor || (isDarkMode ? 'bg-slate-700/50' : 'bg-slate-200/50')
                }`}>
                  {item.icon && (
                    <img
                      src={item.icon}
                      alt={item.label}
                      className="w-4 h-4 object-contain"
                    />
                  )}
                  {item.text && (
                    <span className={`text-xs font-black ${item.textColor}`}>
                      {item.text}
                    </span>
                  )}
                  {item.pattern && (
                    <div className="w-4 h-1 rounded-full" style={{
                      background: 'repeating-linear-gradient(90deg, #3b82f6 0px, #3b82f6 3px, #ef4444 3px, #ef4444 6px)'
                    }} />
                  )}
                </div>

                {/* Label */}
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-semibold ${
                    isDarkMode ? 'text-slate-200' : 'text-slate-800'
                  }`}>
                    {item.label}
                  </div>
                  <div className={`text-[10px] font-medium ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {item.subtitle}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {isExpanded && (
          <>
            <div className={`h-px ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-200/50'}`} />
            <div className="px-3 py-2">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-medium ${
                  isDarkMode ? 'text-slate-500' : 'text-slate-600'
                }`}>
                  Live data
                </span>
                <span className={`text-[10px] font-bold tracking-wide ${
                  isDarkMode ? 'text-cyan-400' : 'text-blue-600'
                }`}>
                  PAGASA
                </span>
              </div>
            </div>
          </>
        )}
      </div>
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