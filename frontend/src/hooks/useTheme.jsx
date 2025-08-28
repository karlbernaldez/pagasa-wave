import { useState, useEffect } from 'react';

export const useTheme = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const stored = localStorage.getItem('isDarkMode');
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
      const metaThemeColor = document.querySelector("meta[name=theme-color]");
      if (metaThemeColor) {
        metaThemeColor.setAttribute("content", isDarkMode ? "#1a1a2e" : "#ffffff");
      }
    } catch (error) {
      console.warn('Failed to persist theme preference:', error);
    }
  }, [isDarkMode]);

  return [isDarkMode, setIsDarkMode];
};
