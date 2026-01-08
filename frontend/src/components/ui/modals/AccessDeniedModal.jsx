import { useEffect } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // <-- import navigation

const AccessDeniedModal = ({ isOpen, onClose, theme = 'dark' }) => {
  const isDark = theme === 'dark';
  const navigate = useNavigate(); // <-- react-router navigation

  const handleCancel = () => {
    navigate('/'); // go to home
  };

  useEffect(() => {
    document.title = "Access Denied";
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Animated Background */}
          <motion.div
            className={`absolute inset-0 backdrop-blur-md ${isDark
                ? 'bg-gradient-to-br from-slate-900/60 via-blue-900/40 to-slate-900/60'
                : 'bg-white/5'
              }`}
            initial={{ backdropFilter: 'blur(0px)' }}
            animate={{ backdropFilter: 'blur(12px)' }}
            exit={{ backdropFilter: 'blur(0px)' }}
          />

          {/* Floating Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className={`absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl ${isDark
                  ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20'
                  : 'bg-white/10'
                }`}
              animate={{
                x: [0, 50, -50, 0],
                y: [0, -30, 30, 0],
                scale: [1, 1.1, 0.9, 1]
              }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className={`absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full blur-3xl ${isDark
                  ? 'bg-gradient-to-r from-indigo-500/20 to-blue-500/20'
                  : 'bg-white/10'
                }`}
              animate={{
                x: [0, -40, 40, 0],
                y: [0, 40, -40, 0],
                scale: [1, 0.8, 1.2, 1]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          {/* Modal Container */}
          <motion.div
            className="relative backdrop-blur-2xl rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/20"
            initial={{ scale: 0.8, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              boxShadow:
                '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Icon Container */}
            <motion.div
              className="relative mx-auto mb-6 w-20 h-20 rounded-2xl backdrop-blur-xl border border-red-500/30 flex items-center justify-center"
              style={{ background: 'rgba(239, 68, 68, 0.1)' }}
              animate={{
                boxShadow: [
                  '0 0 20px rgba(239, 68, 68, 0.3)',
                  '0 0 40px rgba(239, 68, 68, 0.5)',
                  '0 0 20px rgba(239, 68, 68, 0.3)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Lock size={32} className="text-red-400" />
              </motion.div>

              {/* Glow Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500/10 to-transparent blur-xl" />
            </motion.div>

            {/* Title */}
            <motion.h2
              className="text-2xl font-bold text-center mb-3 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Access Denied
            </motion.h2>

            {/* Description */}
            <motion.p
              className="text-white/70 text-center mb-8 leading-relaxed"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              You need to be authenticated to access this content. Please log in to continue.
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              className="space-y-3"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.button
                onClick={onClose}
                className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                whileHover={{
                  boxShadow:
                    '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)'
                }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div className="flex items-center justify-center gap-2" whileHover={{ x: 2 }}>
                  <Lock size={18} />
                  Login Now
                </motion.div>
              </motion.button>

              <motion.button
                onClick={handleCancel}
                className="w-full py-3 px-6 bg-white/10 hover:bg-white/20 text-white/90 font-medium rounded-2xl transition-all duration-300 border border-white/20 hover:border-white/30"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
              >
                Cancel
              </motion.button>
            </motion.div>

            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden rounded-3xl">
              <div className="absolute top-4 left-4 w-2 h-2 bg-white/30 rounded-full animate-pulse" />
              <div className="absolute top-6 right-8 w-1 h-1 bg-blue-400/50 rounded-full animate-ping" />
              <div
                className="absolute bottom-8 left-8 w-1.5 h-1.5 bg-cyan-400/40 rounded-full animate-pulse"
                style={{ animationDelay: '1s' }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AccessDeniedModal;
