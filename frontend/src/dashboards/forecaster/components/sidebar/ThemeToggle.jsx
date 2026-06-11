import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle({ isDarkMode, setIsDarkMode, collapsed = false }) {
  return (
    <button
      type="button"
      onClick={() => setIsDarkMode((prev) => !prev)}
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
        collapsed ? 'justify-center' : 'w-full'
      } ${
        isDarkMode
          ? 'text-slate-300 hover:bg-[#0d2348] hover:text-white'
          : 'border border-gray-200 text-gray-700 hover:bg-gray-100/60'
      }`}
    >
      {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
      {!collapsed && <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
    </button>
  );
}