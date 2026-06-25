import { Clock3, Minus, Plus } from 'lucide-react';

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

function stepHour(hour, direction) {
  const current = Number(hour) || 12;
  if (direction > 0) return current === 12 ? 1 : current + 1;
  return current === 1 ? 12 : current - 1;
}

function stepMinute(minute, direction) {
  const currentIndex = MINUTE_OPTIONS.indexOf(String(minute).padStart(2, '0'));
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;
  const nextIndex = (safeIndex + direction + MINUTE_OPTIONS.length) % MINUTE_OPTIONS.length;
  return MINUTE_OPTIONS[nextIndex];
}

function StepButton({ icon: Icon, label, onClick, dark }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        'grid h-8 w-8 place-items-center rounded-lg border text-xs transition active:scale-95',
        dark
          ? 'border-slate-700 bg-slate-950/70 text-slate-300 hover:border-cyan-300/35 hover:text-cyan-100'
          : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700',
      )}
    >
      <Icon size={14} />
    </button>
  );
}

function TimeColumn({ label, value, options, onChange, onStep, dark }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className={cn('text-[10px] font-black uppercase tracking-[0.16em]', dark ? 'text-slate-500' : 'text-slate-500')}>{label}</p>
        <div className="flex gap-1.5">
          <StepButton icon={Minus} label={`Decrease ${label}`} onClick={() => onStep(-1)} dark={dark} />
          <StepButton icon={Plus} label={`Increase ${label}`} onClick={() => onStep(1)} dark={dark} />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {options.map((option) => {
          const active = String(value) === String(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={cn(
                'h-9 rounded-lg border text-xs font-black transition active:scale-95',
                active
                  ? dark ? 'border-cyan-300 bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-950/30' : 'border-blue-600 bg-blue-600 text-white shadow-sm'
                  : dark ? 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-cyan-300/30 hover:bg-cyan-400/10 hover:text-cyan-100' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700',
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PeriodToggle({ value, onChange, dark }) {
  return (
    <div className={cn(
      'grid grid-cols-2 rounded-xl border p-1',
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
              'h-10 rounded-lg px-3 text-xs font-black transition active:scale-95',
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
            <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl', dark ? 'bg-cyan-400/10 text-cyan-200' : 'bg-blue-50 text-blue-700')}>
              <Clock3 size={17} />
            </span>
            <div className="min-w-0">
              <p className={cn('truncate text-[10px] font-black uppercase tracking-[0.18em]', dark ? 'text-slate-500' : 'text-slate-500')}>Selected time</p>
              <p className={cn('text-xl font-black leading-tight', dark ? 'text-white' : 'text-slate-950')}>{formatTimeLabel(value)}</p>
            </div>
          </div>
          <div className="w-24 shrink-0">
            <PeriodToggle value={parsed.period} onChange={(period) => update({ period })} dark={dark} />
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-2">
          <TimeColumn
            label="Hour"
            value={parsed.hour}
            options={HOUR_OPTIONS}
            onChange={(hour) => update({ hour })}
            onStep={(direction) => update({ hour: stepHour(parsed.hour, direction) })}
            dark={dark}
          />
          <TimeColumn
            label="Minute"
            value={parsed.minute}
            options={minuteOptions}
            onChange={(minute) => update({ minute })}
            onStep={(direction) => update({ minute: stepMinute(parsed.minute, direction) })}
            dark={dark}
          />
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
