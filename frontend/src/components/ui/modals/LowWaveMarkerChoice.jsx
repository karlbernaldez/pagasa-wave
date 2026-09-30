import { AnimatePresence, motion } from 'framer-motion';
import { Waves, X } from 'lucide-react';

const OPTIONS = [
  { value: '<1', label: '<1', description: 'Wave height below 1 meter' },
  { value: '<2', label: '<2', description: 'Wave height below 2 meters' },
];

const LowWaveMarkerChoice = ({ isOpen, onClose, onSelect, isDarkMode = false }) => (
  <AnimatePresence>
    {isOpen && (
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`relative w-full max-w-sm rounded-2xl border p-6 shadow-2xl backdrop-blur-xl ${
            isDarkMode ? 'border-white/20 bg-black/40' : 'border-white/40 bg-white/60'
          }`}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className={`absolute right-4 top-4 rounded-lg p-1.5 ${
              isDarkMode
                ? 'text-white/60 hover:bg-white/10 hover:text-white'
                : 'text-slate-600 hover:bg-black/10 hover:text-slate-900'
            }`}
          >
            <X size={18} />
          </button>

          <div
            className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
              isDarkMode
                ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/40'
                : 'bg-blue-500/20 text-blue-700 ring-1 ring-blue-500/40'
            }`}
          >
            <Waves size={28} />
          </div>

          <h2
            className={`mb-5 text-center text-xl font-bold ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            Select Low Wave Marker
          </h2>

          <div className="space-y-3">
            {OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onSelect(option.value)}
                className={`w-full rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 ${
                  isDarkMode
                    ? 'border-white/10 bg-white/5 hover:border-cyan-400/40 hover:bg-white/10'
                    : 'border-white/50 bg-white/50 hover:border-blue-300 hover:bg-white/80'
                }`}
              >
                <div
                  className={`text-lg font-black ${
                    isDarkMode ? 'text-cyan-300' : 'text-emerald-700'
                  }`}
                >
                  {option.label}
                </div>
                <div
                  className={`mt-1 text-xs ${
                    isDarkMode ? 'text-white/60' : 'text-slate-600'
                  }`}
                >
                  {option.description}
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export default LowWaveMarkerChoice;
