import { ChevronDown, Clock3 } from 'lucide-react';

import { labelCls } from './FormFields';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);
const MINUTE_OPTIONS = ['00', '15', '30', '45'];
const PERIOD_OPTIONS = ['AM', 'PM'];

function parseTimeValue(value) {
  const match = String(value || '').match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return { hour: 6, minute: '00', period: 'AM' };

  const rawHours = Number(match[1]);
  const rawMinutes = Number(match[2]);
  if (rawHours < 0 || rawHours > 23 || rawMinutes < 0 || rawMinutes > 59) {
    return { hour: 6, minute: '00', period: 'AM' };
  }

  return {
    hour: rawHours % 12 || 12,
    minute: String(rawMinutes).padStart(2, '0'),
    period: rawHours >= 12 ? 'PM' : 'AM',
  };
}

function toTimeValue(hour, minute, period) {
  const displayHour = Number(hour);
  const safeHour = displayHour >= 1 && displayHour <= 12 ? displayHour : 12;
  const safeMinute = Number(minute);
  const safePeriod = PERIOD_OPTIONS.includes(period) ? period : 'AM';
  let hours = safeHour % 12;

  if (safePeriod === 'PM') hours += 12;

  return `${String(hours).padStart(2, '0')}:${String(Number.isFinite(safeMinute) ? safeMinute : 0).padStart(2, '0')}`;
}

function formatTimeLabel(value) {
  const parsed = parseTimeValue(value);
  return `${parsed.hour}:${parsed.minute} ${parsed.period}`;
}

function SelectPill({ label, value, onChange, options, dark, wide = false }) {
  return (
    <div className={cn(
      'relative rounded-xl border transition focus-within:ring-2 focus-within:ring-cyan-400/40',
      dark ? 'border-slate-700 bg-slate-950/70 hover:border-cyan-300/30' : 'border-slate-200 bg-white hover:border-blue-200',
      wide ? 'min-w-[5rem]' : 'min-w-[4.35rem]',
    )}>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          'h-11 w-full appearance-none rounded-xl bg-transparent px-3 pr-8 text-center text-sm font-black outline-none',
          dark ? 'text-white' : 'text-slate-950',
        )}
      >
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      <ChevronDown className={cn('pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2', dark ? 'text-slate-500' : 'text-slate-400')} size={14} />
    </div>
  );
}

function PeriodToggle({ value, onChange, dark }) {
  return (
    <div className={cn(
      'flex h-11 rounded-xl border p-1',
      dark ? 'border-slate-700 bg-slate-950/70' : 'border-slate-200 bg-slate-100',
    )}>
      {PERIOD_OPTIONS.map((period) => {
        const active = value === period;
        return (
          <button
            key={period}
            type="button"
            onClick={() => onChange(period)}
            className={cn(
              'rounded-lg px-3 text-xs font-black transition',
              active
                ? dark ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-950/30' : 'bg-blue-600 text-white shadow-sm'
                : dark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900',
            )}
            aria-pressed={active}
          >
            {period}
          </button>
        );
      })}
    </div>
  );
}

export default function TimePickerField({ label, value, onChange, dark, helper }) {
  const parsed = parseTimeValue(value);
  const minuteOptions = MINUTE_OPTIONS.includes(parsed.minute)
    ? MINUTE_OPTIONS
    : [parsed.minute, ...MINUTE_OPTIONS].sort();

  const update = (patch) => {
    const next = { ...parsed, ...patch };
    onChange(toTimeValue(next.hour, next.minute, next.period));
  };

  return (
    <div>
      <label className={labelCls(dark)}>{label}</label>
      <div className={cn(
        'rounded-2xl border p-3 transition-all duration-200 focus-within:ring-2 focus-within:ring-cyan-400/35',
        dark
          ? 'border-slate-700 bg-slate-900/80 hover:border-cyan-300/25'
          : 'border-slate-200 bg-white shadow-sm hover:border-blue-200',
      )}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-xl', dark ? 'bg-cyan-400/10 text-cyan-200' : 'bg-blue-50 text-blue-700')}>
              <Clock3 size={16} />
            </span>
            <div className="min-w-0">
              <p className={cn('truncate text-[11px] font-black uppercase tracking-[0.16em]', dark ? 'text-slate-500' : 'text-slate-500')}>Selected time</p>
              <p className={cn('text-lg font-black leading-tight', dark ? 'text-white' : 'text-slate-950')}>{formatTimeLabel(value)}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SelectPill label={`${label} hour`} value={parsed.hour} onChange={(hour) => update({ hour })} options={HOUR_OPTIONS} dark={dark} />
          <span className={cn('text-lg font-black', dark ? 'text-slate-500' : 'text-slate-400')}>:</span>
          <SelectPill label={`${label} minute`} value={parsed.minute} onChange={(minute) => update({ minute })} options={minuteOptions} dark={dark} />
          <PeriodToggle value={parsed.period} onChange={(period) => update({ period })} dark={dark} />
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
