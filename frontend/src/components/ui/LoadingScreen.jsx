import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingScreen = ({ isDarkMode = false, message = "Please wait..." }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/65 backdrop-blur-sm animate-fadeIn">
      <div
        className={`relative rounded-2xl transition-all duration-300 animate-scaleIn ${
          isDarkMode
            ? 'bg-black/50 border border-white/20'
            : 'bg-white/70 border border-white/40'
        } backdrop-blur-xl shadow-2xl px-10 py-8`}
      >
        {/* Main Content */}
        <div className="flex flex-col items-center text-center">
          {/* Animated Icon */}
          <div className="relative mb-6">
            {/* Outer pulse ring */}
            <div 
              className={`absolute inset-0 rounded-full animate-ping opacity-20 ${
                isDarkMode ? 'bg-cyan-400' : 'bg-blue-500'
              }`} 
              style={{ animationDuration: '2s' }} 
            />
            
            {/* Icon container */}
            <div className={`relative w-16 h-16 rounded-full flex items-center justify-center ${
              isDarkMode
                ? 'bg-cyan-500/20 ring-2 ring-cyan-400/40'
                : 'bg-blue-500/20 ring-2 ring-blue-500/50'
            }`}>
              <Loader2 
                size={32} 
                className={`animate-spin ${
                  isDarkMode ? 'text-cyan-400' : 'text-blue-600'
                }`}
                strokeWidth={2}
                style={{ animationDuration: '1s' }}
              />
            </div>
          </div>

          {/* Loading Text */}
          <p className={`text-lg font-semibold max-w-xs ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}>
            {message}
          </p>
        </div>

        {/* Bottom gradient accent */}
        <div className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl ${
          isDarkMode
            ? 'bg-gradient-to-r from-cyan-500/50 via-blue-500/50 to-purple-500/50'
            : 'bg-gradient-to-r from-blue-500/50 via-indigo-500/50 to-purple-500/50'
        }`} />
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

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;