import React from 'react';
import { Package, X } from 'lucide-react';

const ExportConfirmModal = ({ visible, onConfirm, onCancel, isDarkMode = false }) => {
  if (!visible) return null;

  return (
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-fadeIn bg-black/50 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className={`relative w-full max-w-md rounded-2xl transition-all duration-300 animate-slideUp ${
          isDarkMode
            ? 'bg-black/40 border border-white/20'
            : 'bg-white/60 border border-white/40'
        } backdrop-blur-xl shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          className={`absolute top-4 right-4 p-1.5 rounded-lg transition-all duration-200 ${
            isDarkMode
              ? 'hover:bg-white/10 text-white/60 hover:text-white/90'
              : 'hover:bg-black/10 text-slate-600 hover:text-slate-900'
          }`}
        >
          <X size={18} strokeWidth={2.5} />
        </button>

        {/* Content */}
        <div className="px-8 pt-10 pb-8">
          {/* Icon */}
          <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${
            isDarkMode
              ? 'bg-cyan-500/20 ring-1 ring-cyan-400/40'
              : 'bg-blue-500/20 ring-1 ring-blue-500/50'
          }`}>
            <Package 
              size={32} 
              className={`${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`}
              strokeWidth={2}
            />
          </div>

          {/* Title */}
          <h2 className={`text-2xl font-bold text-center mb-3 ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}>
            Export Project
          </h2>

          {/* Message */}
          <p className={`text-center mb-8 leading-relaxed ${
            isDarkMode ? 'text-white/80' : 'text-slate-700'
          }`}>
            Are you sure you want to export this project? This will download all project data as a ZIP file.
          </p>

          {/* Button Group */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                isDarkMode
                  ? 'bg-white/10 hover:bg-white/15 text-white/90 border border-white/20 hover:border-white/30'
                  : 'bg-black/10 hover:bg-black/15 text-slate-800 border border-black/20 hover:border-black/30'
              } hover:-translate-y-0.5 active:translate-y-0 shadow-lg`}
            >
              Cancel
            </button>
            
            <button
              onClick={onConfirm}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                isDarkMode
                  ? 'bg-cyan-500/30 hover:bg-cyan-500/40 text-white border border-cyan-400/50 hover:border-cyan-400/70'
                  : 'bg-blue-500/30 hover:bg-blue-500/40 text-blue-900 border border-blue-500/50 hover:border-blue-500/70'
              } hover:-translate-y-0.5 active:translate-y-0 shadow-lg ${
                isDarkMode ? 'shadow-cyan-500/20' : 'shadow-blue-500/20'
              }`}
            >
              Yes, Export
            </button>
          </div>
        </div>

        {/* Footer badge */}
        <div className={`px-4 py-2.5 rounded-b-2xl border-t ${
          isDarkMode 
            ? 'bg-white/5 border-white/10' 
            : 'bg-black/5 border-black/10'
        }`}>
          <div className="flex items-center justify-center">
            <span className={`text-xs font-medium ${
              isDarkMode ? 'text-white/50' : 'text-slate-600'
            }`}>
              💾 Your data will be safely packaged
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ExportConfirmModal;