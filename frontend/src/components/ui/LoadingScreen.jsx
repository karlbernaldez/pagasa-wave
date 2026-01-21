// components/LoadingScreen.js
import React from 'react';

const LoadingScreen = ({ isDarkMode, message = "Loading..." }) => (
  <div 
    className={`fixed inset-0 w-full h-screen backdrop-blur-[10px] flex justify-center items-center z-[9999] animate-fadeIn ${
      isDarkMode ? 'bg-[#0f0f23]/95' : 'bg-white/95'
    }`}
  >
    <div 
      className={`flex flex-col items-center gap-6 p-8 rounded-2xl backdrop-blur-[20px] border ${
        isDarkMode 
          ? 'bg-[#1e1e32]/80 border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.3)]' 
          : 'bg-white/80 border-black/10 shadow-[0_20px_40px_rgba(0,0,0,0.1)]'
      }`}
    >
      <div 
        className={`w-[50px] h-[50px] border-[3px] rounded-full animate-spin ${
          isDarkMode 
            ? 'border-white/10 border-t-blue-500' 
            : 'border-black/10 border-t-blue-600'
        }`}
      />
      <div 
        className={`text-lg font-medium text-center tracking-wide ${
          isDarkMode ? 'text-gray-100' : 'text-gray-900'
        }`}
      >
        {message}
      </div>
    </div>
  </div>
);

export default LoadingScreen;