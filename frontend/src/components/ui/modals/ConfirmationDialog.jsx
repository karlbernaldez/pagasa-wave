import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  layerName,
  isDarkMode,
}) => {
  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
        onClose();
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, onConfirm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 ${
          isDarkMode ? 'bg-black/70' : 'bg-black/50'
        } backdrop-blur-md`}
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        className={`relative w-full max-w-md rounded-2xl backdrop-blur-xl shadow-2xl transition-all duration-300
        ${
          isDarkMode
            ? 'bg-[#0b1220]/60 border border-white/10'
            : 'bg-white/70 border border-black/10'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b
          ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg
              ${isDarkMode ? 'bg-orange-400/15' : 'bg-orange-500/15'}`}
            >
              <AlertTriangle
                size={20}
                strokeWidth={2.5}
                className={isDarkMode ? 'text-orange-400' : 'text-orange-600'}
              />
            </div>

            <div
              className={`text-sm font-semibold tracking-wide
              ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
            >
              {title}
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition hover:scale-110
            ${
              isDarkMode
                ? 'hover:bg-white/10 text-white/50 hover:text-white'
                : 'hover:bg-black/10 text-slate-500 hover:text-slate-900'
            }`}
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-6">
          <p
            className={`text-sm leading-relaxed
            ${isDarkMode ? 'text-white/80' : 'text-slate-700'}`}
          >
            {message}{' '}
            <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>
              "{layerName}"
            </strong>
            ?
          </p>

          <p
            className={`text-xs mt-2
            ${isDarkMode ? 'text-white/40' : 'text-slate-500'}`}
          >
            This action cannot be undone.
          </p>
        </div>

        {/* Footer */}
        <div
          className={`flex items-center gap-2 px-5 py-4 border-t
          ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}
        >
          <button
            onClick={onClose}
            className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all hover:scale-[1.02] group
            ${
              isDarkMode
                ? 'bg-white/10 hover:bg-white/20 text-white/80 border border-white/10'
                : 'bg-black/5 hover:bg-black/10 text-slate-700 border border-black/10'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              Cancel
              
            </div>
          </button>

          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all hover:scale-[1.02]
            ${
              isDarkMode
                ? 'bg-gradient-to-r from-red-500/90 to-orange-500/90 hover:from-red-400 hover:to-orange-400 text-white shadow-lg shadow-red-500/20'
                : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-lg shadow-red-500/30'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              Yes, delete it
              
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;