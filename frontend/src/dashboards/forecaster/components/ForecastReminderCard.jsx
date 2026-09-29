import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BellRing, Clock3 } from 'lucide-react';

import { getReminderState } from './forecastReminderState';

function getToneClasses(tone, isDarkMode) {
  if (tone === 'critical') {
    return isDarkMode
      ? 'border-red-300/70 bg-gradient-to-br from-red-400/28 via-orange-500/20 to-red-950/35 text-red-50 shadow-red-950/60 ring-2 ring-red-300/35'
      : 'border-red-300 bg-gradient-to-br from-red-50 via-white to-orange-50 text-red-950 shadow-red-200/70 ring-2 ring-red-200/80';
  }

  if (tone === 'overdue') {
    return isDarkMode
      ? 'border-orange-300/70 bg-gradient-to-br from-orange-400/28 via-amber-500/18 to-red-900/24 text-orange-50 shadow-orange-950/60 ring-2 ring-orange-300/35'
      : 'border-orange-300 bg-gradient-to-br from-orange-50 via-white to-red-50 text-orange-950 shadow-orange-200/70 ring-2 ring-orange-200/80';
  }

  if (tone === 'warning') {
    return isDarkMode
      ? 'border-amber-200/60 bg-gradient-to-br from-amber-300/25 via-amber-500/16 to-orange-600/18 text-amber-50 shadow-amber-950/50 ring-2 ring-amber-300/30'
      : 'border-amber-300 bg-gradient-to-br from-amber-50 via-white to-orange-50 text-amber-950 shadow-amber-200/70 ring-2 ring-amber-200/70';
  }

  if (tone === 'revision') {
    return isDarkMode
      ? 'border-cyan-200/60 bg-gradient-to-br from-cyan-300/22 via-blue-500/14 to-slate-950 text-cyan-50 shadow-cyan-950/50 ring-2 ring-cyan-300/25'
      : 'border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-blue-50 text-cyan-950 shadow-cyan-100/70 ring-2 ring-cyan-100/80';
  }

  return isDarkMode
    ? 'border-amber-200/60 bg-gradient-to-br from-amber-300/25 via-amber-500/16 to-orange-600/18 text-amber-50 shadow-amber-950/50 ring-2 ring-amber-300/30'
    : 'border-amber-300 bg-gradient-to-br from-amber-50 via-white to-orange-50 text-amber-950 shadow-amber-200/70 ring-2 ring-amber-200/70';
}

function getIconClasses(tone, isDarkMode) {
  if (tone === 'critical')
    return isDarkMode
      ? 'bg-red-300 text-slate-950 shadow-red-950/40'
      : 'bg-red-600 text-white shadow-red-200';
  if (tone === 'overdue')
    return isDarkMode
      ? 'bg-orange-300 text-slate-950 shadow-orange-950/40'
      : 'bg-orange-600 text-white shadow-orange-200';
  if (tone === 'revision')
    return isDarkMode
      ? 'bg-cyan-300 text-slate-950 shadow-cyan-950/40'
      : 'bg-cyan-600 text-white shadow-cyan-200';
  return isDarkMode
    ? 'bg-amber-300 text-slate-950 shadow-amber-950/40'
    : 'bg-amber-500 text-white shadow-amber-200';
}

function getBadgeClasses(tone, isDarkMode) {
  if (tone === 'critical') return isDarkMode ? 'bg-red-100 text-red-950' : 'bg-red-700 text-white';
  if (tone === 'overdue')
    return isDarkMode ? 'bg-orange-100 text-orange-950' : 'bg-orange-700 text-white';
  if (tone === 'revision')
    return isDarkMode ? 'bg-cyan-100 text-cyan-950' : 'bg-cyan-700 text-white';
  return isDarkMode ? 'bg-amber-100 text-slate-950' : 'bg-amber-600 text-white';
}

export default function ForecastReminderCard({ packageData, settings, isDarkMode }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const state = useMemo(
    () => getReminderState({ packageData, settings, now }),
    [packageData, settings, now]
  );
  if (!state?.message) return null;

  const Icon = ['critical', 'overdue'].includes(state.tone)
    ? AlertTriangle
    : state.tone === 'warning'
      ? Clock3
      : BellRing;

  return (
    <section
      className={`relative overflow-hidden rounded-2xl border px-4 py-4 shadow-sm ${getToneClasses(state.tone, isDarkMode)}`}
    >
      <div className="relative flex items-start gap-3">
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${getIconClasses(state.tone, isDarkMode)}`}
        >
          <Icon size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={`text-[11px] font-black uppercase tracking-[0.16em] ${isDarkMode ? 'text-white' : 'text-slate-800'}`}
            >
              {state.label}
            </p>
            <span
              className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${getBadgeClasses(state.tone, isDarkMode)}`}
            >
              {state.badge}
            </span>
          </div>
          <p
            className={`mt-1 text-sm font-semibold leading-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
          >
            {state.message}
          </p>
        </div>
      </div>
    </section>
  );
}
