import { useEffect } from 'react';
import { Lock, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AccessDeniedModal = ({ isOpen, onClose, isDarkMode = true }) => {
  const navigate = useNavigate();

  const handleCancel = () => {
    navigate('/');
  };

  useEffect(() => {
    if (isOpen) {
      document.title = "Access Denied";
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop with animated gradient */}
      <div className={`absolute inset-0 backdrop-blur-md transition-all duration-500 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-900/70 via-red-900/30 to-slate-900/70' 
          : 'bg-black/50'
      }`} />
      
      {/* Modal */}
      <div className={`relative w-full max-w-md rounded-2xl backdrop-blur-xl shadow-2xl transition-all duration-300 ${
        isDarkMode
          ? 'bg-[#0b1220]/60 border border-red-500/20'
          : 'bg-white/70 border border-red-500/20'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${
          isDarkMode ? 'border-white/10' : 'border-black/10'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg relative ${
              isDarkMode ? 'bg-red-500/20' : 'bg-red-500/20'
            }`}>
              <Lock 
                size={20} 
                strokeWidth={2.5}
                className={isDarkMode ? 'text-red-400' : 'text-red-600'}
              />
              {/* Subtle pulse effect */}
              <div className={`absolute inset-0 rounded-lg animate-pulse ${
                isDarkMode ? 'bg-red-500/10' : 'bg-red-500/10'
              }`} />
            </div>
            <div>
              <div className={`text-base font-semibold tracking-wide ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                Access Denied
              </div>
              <div className={`text-xs mt-0.5 ${
                isDarkMode ? 'text-white/50' : 'text-slate-600'
              }`}>
                Authentication required
              </div>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition hover:scale-110 ${
              isDarkMode
                ? 'hover:bg-white/10 text-white/50 hover:text-white'
                : 'hover:bg-black/10 text-slate-500 hover:text-slate-900'
            }`}
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Icon Display */}
          <div className="flex justify-center mb-6">
            <div className={`relative w-20 h-20 rounded-2xl flex items-center justify-center ${
              isDarkMode ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-500/10 border border-red-500/30'
            }`}>
              <Lock 
                size={36} 
                strokeWidth={2.5}
                className={isDarkMode ? 'text-red-400' : 'text-red-600'}
              />
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500/20 to-transparent blur-xl" />
            </div>
          </div>

          {/* Message */}
          <div className="text-center mb-6">
            <h3 className={`text-lg font-semibold mb-2 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              Authentication Required
            </h3>
            <p className={`text-sm leading-relaxed ${
              isDarkMode ? 'text-white/60' : 'text-slate-600'
            }`}>
              You need to be authenticated to access this content. Please log in to continue.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Primary Action - Login */}
            <button
              onClick={onClose}
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all duration-300 ${
                isDarkMode
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              <Lock size={18} strokeWidth={2.5} />
              Login Now
            </button>

            {/* Secondary Action - Cancel */}
            <button
              onClick={handleCancel}
              className={`w-full rounded-xl py-3 text-sm font-medium transition-all duration-300 ${
                isDarkMode
                  ? 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10'
                  : 'bg-black/5 hover:bg-black/10 text-slate-700 hover:text-slate-900 border border-black/10'
              }`}
            >
              Cancel
            </button>
          </div>

          {/* Helper Text */}
          <div className={`text-xs text-center mt-4 ${
            isDarkMode ? 'text-white/40' : 'text-slate-500'
          }`}>
            Return to home or authenticate to proceed
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessDeniedModal;