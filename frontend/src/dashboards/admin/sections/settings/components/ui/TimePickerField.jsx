import { Clock3 } from 'lucide-react';

import { labelCls } from './FormFields';

const cn = (...classes) => classes.filter(Boolean).join(' ');

function formatTimeLabel(value) {
  const match = String(value || '').match(/^(\d{2}):(\d{2})$/);
  if (!match) return 'Set time';

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return 'Set time';
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return 'Set time';

  const suffix = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

export default function TimePickerField({ label, value, onChange, dark, helper }) {
  return (
    <div>
      <label className={labelCls(dark)}>{label}</label>
      <div className={cn(
        'group relative overflow-hidden rounded-xl border transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500/40',
        dark
          ? 'border-slate-700 bg-slate-800 hover:border-slate-600'
          : 'border-slate-200 bg-white hover:border-slate-300',
      )}>
        <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
          <Clock3 size={16} className={dark ? 'text-cyan-300' : 'text-blue-600'} />
        </div>
        <input
          type="time"
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            'min-h-11 w-full appearance-none bg-transparent py-2.5 pl-11 pr-28 text-sm font-black outline-none',
            dark ? 'text-white [color-scheme:dark]' : 'text-slate-950 [color-scheme:light]',
          )}
        />
        <div className={cn(
          'pointer-events-none absolute inset-y-1 right-1 flex min-w-24 items-center justify-center rounded-lg px-3 text-xs font-black uppercase tracking-wide',
          dark ? 'bg-slate-950/70 text-slate-300' : 'bg-slate-100 text-slate-600',
        )}>
          {formatTimeLabel(value)}
        </div>
      </div>
      {helper && (
        <p className={cn('mt-1.5 text-xs font-semibold', dark ? 'text-slate-500' : 'text-slate-500')}>
          {helper}
        </p>
      )}
    </div>
  );
}
