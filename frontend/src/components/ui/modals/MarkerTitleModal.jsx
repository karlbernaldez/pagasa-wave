import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Check, Tag } from 'lucide-react';

const animationVariants = {
  hidden: { opacity: 0, y: -20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.97, pointerEvents: 'none' }
};

const typeConfig = {
  typhoon: { label: 'Storm', accent: { dark: 'purple', light: 'violet' } },
  low_pressure: { label: 'Low Pressure Area', accent: { dark: 'cyan', light: 'blue' } },
  high_pressure: { label: 'High Pressure Area', accent: { dark: 'orange', light: 'orange' } },
  less_1: { label: 'Low Waves', accent: { dark: 'green', light: 'green' } },
};

const MarkerTitleModal = ({ isOpen, onClose, onSubmit, isDarkMode = false, markerType = 'typhoon' }) => {
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const config = typeConfig[markerType] || typeConfig.typhoon;
  const accentKey = isDarkMode ? config.accent.dark : config.accent.light;

  const accentClasses = {
    purple: {
      icon: 'bg-purple-500/20 ring-1 ring-purple-400/40',
      iconColor: 'text-purple-400',
      input: 'focus:border-purple-400/60 focus:ring-purple-400/20',
      button: 'bg-purple-500/20 hover:bg-purple-500/30 border-purple-400/40 text-purple-300',
      dot: 'bg-purple-400',
    },
    cyan: {
      icon: 'bg-cyan-500/20 ring-1 ring-cyan-400/40',
      iconColor: 'text-cyan-400',
      input: 'focus:border-cyan-400/60 focus:ring-cyan-400/20',
      button: 'bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-400/40 text-cyan-300',
      dot: 'bg-cyan-400',
    },
    blue: {
      icon: 'bg-blue-500/20 ring-1 ring-blue-500/50',
      iconColor: 'text-blue-600',
      input: 'focus:border-blue-400/60 focus:ring-blue-400/20',
      button: 'bg-blue-500/20 hover:bg-blue-500/30 border-blue-400/40 text-blue-700',
      dot: 'bg-blue-500',
    },
    orange: {
      icon: 'bg-orange-500/20 ring-1 ring-orange-400/40',
      iconColor: isDarkMode ? 'text-orange-400' : 'text-orange-600',
      input: 'focus:border-orange-400/60 focus:ring-orange-400/20',
      button: isDarkMode
        ? 'bg-orange-500/20 hover:bg-orange-500/30 border-orange-400/40 text-orange-300'
        : 'bg-orange-500/20 hover:bg-orange-500/30 border-orange-400/40 text-orange-700',
      dot: 'bg-orange-400',
    },
    violet: {
      icon: 'bg-violet-500/20 ring-1 ring-violet-500/50',
      iconColor: 'text-violet-600',
      input: 'focus:border-violet-400/60 focus:ring-violet-400/20',
      button: 'bg-violet-500/20 hover:bg-violet-500/30 border-violet-400/40 text-violet-700',
      dot: 'bg-violet-500',
    },
    green: {
      icon: 'bg-green-500/20 ring-1 ring-green-400/40',
      iconColor: isDarkMode ? 'text-green-400' : 'text-green-600',
      input: 'focus:border-green-400/60 focus:ring-green-400/20',
      button: isDarkMode
        ? 'bg-green-500/20 hover:bg-green-500/30 border-green-400/40 text-green-300'
        : 'bg-green-500/20 hover:bg-green-500/30 border-green-400/40 text-green-700',
      dot: 'bg-green-400',
    },
  };

  const accent = accentClasses[accentKey];

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setError('');
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!title.trim()) {
      setError('Please enter a marker name.');
      return;
    }
    onSubmit(title.trim());
    setTitle('');
    setError('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') onClose();
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

            <div className="px-6 pt-10 pb-6">
              {/* Icon */}
              <div className={`w-14 h-14 mx-auto mb-5 rounded-full flex items-center justify-center ${accent.icon}`}>
                <Tag size={26} className={accent.iconColor} strokeWidth={2} />
              </div>

              {/* Title */}
              <h2 className={`text-xl font-bold text-center mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Name this Marker
              </h2>
              <p className={`text-xs text-center mb-6 ${isDarkMode ? 'text-white/50' : 'text-slate-500'}`}>
                {config.label}
              </p>

              {/* Input */}
              <div className="mb-4">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); setError(''); }}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g. Typhoon Carina"
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 outline-none border ring-2 ring-transparent ${
                      isDarkMode
                        ? `bg-white/5 border-white/10 text-white placeholder-white/30 ${accent.input}`
                        : `bg-black/5 border-black/10 text-slate-900 placeholder-slate-400 ${accent.input}`
                    } ${error ? 'border-red-400/60 ring-red-400/20' : ''}`}
                  />
                </div>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-400 mt-1.5 ml-1"
                  >
                    {error}
                  </motion.p>
                )}
              </div>

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 border hover:-translate-y-0.5 active:translate-y-0 shadow-lg mb-3 ${accent.button}`}
              >
                <Check size={16} strokeWidth={2.5} />
                Confirm Marker
              </button>

              {/* Cancel */}
              <button
                onClick={onClose}
                className={`w-full px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
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

export default MarkerTitleModal;