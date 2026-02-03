import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Check } from 'lucide-react';

const animationVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const MarkerTitleModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  inputValue, 
  onInputChange,
  isDarkMode = false 
}) => {
  const handleSave = () => {
    const title = inputValue || 'Untitled Marker';
    onSave(title);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

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
              <h2 className={`text-xl font-bold text-center mb-2 ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                Enter Typhoon or Storm Name
              </h2>

              {/* Subtitle */}
              <p className={`text-sm text-center mb-6 ${
                isDarkMode ? 'text-white/60' : 'text-slate-600'
              }`}>
                Give your marker a memorable name
              </p>

              {/* Input Field */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => onInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g. Kristine"
                    autoFocus
                    className={`w-full px-4 py-3 rounded-xl outline-none transition-all duration-200 ${
                      isDarkMode
                        ? 'bg-white/10 border border-white/20 focus:border-cyan-400/50 focus:bg-white/15 text-white placeholder:text-white/40'
                        : 'bg-white/50 border border-white/30 focus:border-blue-500/50 focus:bg-white/70 text-slate-900 placeholder:text-slate-500'
                    } backdrop-blur-sm`}
                  />
                  {inputValue && (
                    <button
                      onClick={() => onInputChange('')}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-all duration-200 ${
                        isDarkMode
                          ? 'hover:bg-white/10 text-white/40 hover:text-white/70'
                          : 'hover:bg-black/10 text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      <X size={16} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              </div>

              {/* Button Group */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    isDarkMode
                      ? 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 hover:border-white/20'
                      : 'bg-black/5 hover:bg-black/10 text-slate-700 border border-black/10 hover:border-black/20'
                  } hover:-translate-y-0.5 active:translate-y-0`}
                >
                  Cancel
                </button>

                <button
                  onClick={handleSave}
                  className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                    isDarkMode
                      ? 'bg-cyan-500/30 hover:bg-cyan-500/40 text-white border border-cyan-400/50 hover:border-cyan-400/70'
                      : 'bg-blue-500/30 hover:bg-blue-500/40 text-blue-900 border border-blue-500/50 hover:border-blue-500/70'
                  } hover:-translate-y-0.5 active:translate-y-0 shadow-lg ${
                    isDarkMode ? 'shadow-cyan-500/20' : 'shadow-blue-500/20'
                  }`}
                >
                  <Check size={18} strokeWidth={2.5} />
                  Add Marker
                </button>
              </div>

              {/* Hint text */}
              <p className={`text-xs text-center mt-4 ${
                isDarkMode ? 'text-white/40' : 'text-slate-500'
              }`}>
                Press Enter to save • Esc to cancel
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MarkerTitleModal;