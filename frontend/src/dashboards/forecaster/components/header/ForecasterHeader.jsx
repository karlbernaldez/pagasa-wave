import { Bell, ChevronDown, Menu, Waves, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/app/providers/ThemeProvider';

export default function ForecasterHeader({ onMobileMenuToggle }) {
  const { isDarkMode, setIsDarkMode } = useTheme();

  return (
    <header
      className={`sticky top-0 z-30 flex h-[72px] items-center justify-between border-b px-6 transition-colors ${
        isDarkMode
          ? 'bg-gray-900 border-gray-700'
          : 'bg-white border-slate-200'
      }`}
    >
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border lg:hidden ${
            isDarkMode
              ? 'border-gray-700 text-gray-300'
              : 'border-slate-200 text-slate-600'
          }`}
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-3">
          <Waves className={isDarkMode ? 'text-cyan-400' : 'text-blue-600'} size={28} strokeWidth={2.2} />
          <div className="flex items-baseline gap-2">
            <span className={`text-lg font-black tracking-tight ${
              isDarkMode ? 'text-gray-100' : 'text-blue-800'
            }`}>
              WaveLab
            </span>
            <span className={`text-sm font-semibold ${
              isDarkMode ? 'text-cyan-400' : 'text-blue-500'
            }`}>
              Studio
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5">
        {/* Theme toggle */}
        <button
          onClick={() => setIsDarkMode((p) => !p)}
          className={`h-10 w-10 rounded-full flex items-center justify-center transition ${
            isDarkMode
              ? 'bg-gray-800 text-amber-300 hover:bg-gray-700'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
          aria-label="Toggle theme"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          type="button"
          className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full transition ${
            isDarkMode
              ? 'text-gray-300 hover:bg-gray-800'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
          aria-label="Notifications"
        >
          <Bell size={20} />
        </button>

        <div className={`h-9 w-px ${isDarkMode ? 'bg-gray-700' : 'bg-slate-200'}`} />

        <button
          type="button"
          className={`flex items-center gap-3 rounded-xl px-2 py-1.5 transition ${
            isDarkMode
              ? 'hover:bg-gray-800'
              : 'hover:bg-slate-50'
          }`}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white">
            JD
          </span>
          <span className="hidden text-left leading-tight sm:block">
            <span className={`block text-sm font-bold ${
              isDarkMode ? 'text-gray-100' : 'text-slate-800'
            }`}>
              Juan Dela Cruz
            </span>
            <span className={`block text-xs font-semibold ${
              isDarkMode ? 'text-gray-400' : 'text-slate-500'
            }`}>
              Forecaster
            </span>
          </span>
          <ChevronDown size={16} className={isDarkMode ? 'text-gray-500' : 'text-slate-400'} />
        </button>
      </div>
    </header>
  );
}
