import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, MapPinned, Navigation, X } from 'lucide-react';

const animationVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const PointInputChoiceModal = ({ isOpen, onClose, onSelect, isDarkMode = false }) => {
  const options = [
    {
      id: 'manual',
      icon: Navigation,
      label: 'Enter Coordinates',
      description: 'Latitude & Longitude',
      color: isDarkMode ? 'cyan' : 'blue'
    },
    {
      id: 'map',
      icon: MapPinned,
      label: 'Click on Map',
      description: 'Point and select',
      color: isDarkMode ? 'purple' : 'indigo'
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            variants={animationVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`relative w-full max-w-sm rounded-2xl transition-all duration-300 ${
              isDarkMode
                ? 'bg-black/40 border border-white/20'
                : 'bg-white/60 border border-white/40'
            } backdrop-blur-xl shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className={`absolute top-4 right-4 p-1.5 rounded-lg transition-all duration-200 ${
                isDarkMode
                  ? 'hover:bg-white/10 text-white/60 hover:text-white/90'
                  : 'hover:bg-black/10 text-slate-600 hover:text-slate-900'
              }`}
            >
              <X size={18} strokeWidth={2.5} />
            </button>

            {/* Content */}
            <div className="px-6 pt-10 pb-6">
              {/* Icon */}
              <div className={`w-14 h-14 mx-auto mb-5 rounded-full flex items-center justify-center ${
                isDarkMode
                  ? 'bg-cyan-500/20 ring-1 ring-cyan-400/40'
                  : 'bg-blue-500/20 ring-1 ring-blue-500/50'
              }`}>
                <MapPin 
                  size={28} 
                  className={`${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`}
                  strokeWidth={2}
                />
              </div>

              {/* Title */}
              <h2 className={`text-xl font-bold text-center mb-6 ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                Select Marker Input Method
              </h2>

              {/* Option Cards */}
              <div className="space-y-3 mb-4">
                {options.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.id}
                      onClick={() => onSelect(option.id)}
                      className={`group w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 ${
                        isDarkMode
                          ? 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20'
                          : 'bg-white/40 hover:bg-white/60 border border-white/30 hover:border-white/50'
                      } hover:-translate-y-0.5 active:translate-y-0 shadow-lg`}
                    >
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
                        option.color === 'cyan'
                          ? 'bg-cyan-500/20 ring-1 ring-cyan-400/40 group-hover:bg-cyan-500/30'
                          : option.color === 'purple'
                          ? 'bg-purple-500/20 ring-1 ring-purple-400/40 group-hover:bg-purple-500/30'
                          : option.color === 'blue'
                          ? 'bg-blue-500/20 ring-1 ring-blue-500/50 group-hover:bg-blue-500/30'
                          : 'bg-indigo-500/20 ring-1 ring-indigo-500/50 group-hover:bg-indigo-500/30'
                      }`}>
                        <Icon 
                          size={22} 
                          className={`${
                            option.color === 'cyan'
                              ? 'text-cyan-400'
                              : option.color === 'purple'
                              ? 'text-purple-400'
                              : option.color === 'blue'
                              ? 'text-blue-600'
                              : 'text-indigo-600'
                          }`}
                          strokeWidth={2}
                        />
                      </div>

                      {/* Text */}
                      <div className="flex-1 text-left">
                        <div className={`text-sm font-semibold mb-0.5 ${
                          isDarkMode ? 'text-white' : 'text-slate-900'
                        }`}>
                          {option.label}
                        </div>
                        <div className={`text-xs ${
                          isDarkMode ? 'text-white/60' : 'text-slate-600'
                        }`}>
                          {option.description}
                        </div>
                      </div>

                      {/* Arrow indicator */}
                      <div className={`flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1 ${
                        isDarkMode ? 'text-white/40' : 'text-slate-400'
                      }`}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Cancel button */}
              <button
                onClick={onClose}
                className={`w-full px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  isDarkMode
                    ? 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 hover:border-white/20'
                    : 'bg-black/5 hover:bg-black/10 text-slate-700 border border-black/10 hover:border-black/20'
                } hover:-translate-y-0.5 active:translate-y-0`}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PointInputChoiceModal;