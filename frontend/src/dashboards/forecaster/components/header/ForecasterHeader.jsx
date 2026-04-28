import { Bell, ChevronDown, Menu, Waves } from 'lucide-react';

export default function ForecasterHeader({ onMobileMenuToggle }) {
  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-3">
          <Waves className="text-blue-600" size={28} strokeWidth={2.2} />
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-black tracking-tight text-blue-800">WaveLab</span>
            <span className="text-sm font-semibold text-blue-500">Studio</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <button
          type="button"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-50 hover:text-blue-700"
          aria-label="Notifications"
        >
          <Bell size={20} />
        </button>

        <div className="h-9 w-px bg-slate-200" />

        <button
          type="button"
          className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-slate-50"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white">
            JD
          </span>
          <span className="hidden text-left leading-tight sm:block">
            <span className="block text-sm font-bold text-slate-800">Juan Dela Cruz</span>
            <span className="block text-xs font-semibold text-slate-500">Forecaster</span>
          </span>
          <ChevronDown size={16} className="text-slate-400" />
        </button>
      </div>
    </header>
  );
}
