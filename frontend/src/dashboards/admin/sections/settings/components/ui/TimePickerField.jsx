import { Clock3, Minus, Plus } from 'lucide-react';

import { labelCls } from './FormFields';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const PERIOD_OPTIONS = ['AM', 'PM'];
const MINUTE_STEP = 15;

function parseTimeValue(value) {
  const match = String(value || '').match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return { hour: 6, minute: 0, period: 'AM' };

  const rawHours = Number(match[1]);
  const rawMinutes = Number(match[2]);
  if (rawHours < 0 || rawHours > 23 || rawMinutes < 0 || rawMinutes > 59) {
    return { hour: 6, minute: 0, period: 'AM' };
  }

  return {
    hour: rawHours % 12 || 12,
    minute: rawMinutes,
    period: rawHours >= 12 ? 'PM' : 'AM',
  };
}

function toTimeValue(hour, minute, period) {
  const displayHour = Number(hour);
  const safeHour = displayHour >= 1 && displayHour <= 12 ? displayHour : 12;
  const safeMinute = Math.max(0, Math.min(59, Number(minute) || 0));
  const safePeriod = PERIOD_OPTIONS.includes(period) ? period : 'AM';
  let hours = safeHour % 12;

  if (safePeriod === 'PM') hours += 12;

  return `${String(hours).padStart(2, '0')}:${String(safeMinute).padStart(2, '0')}`;
}

function formatTimeLabel(value) {
  const parsed = parseTimeValue(value);
  return `${parsed.hour}:${String(parsed.minute).padStart(2, '0')} ${parsed.period}`;
}

function stepHour(hour, direction) {
  const current = Number(hour) || 12;
  if (direction > 0) return current === 12 ? 1 : current + 1;
  return current === 1 ? 12 : current - 1;
}

function stepMinute(minute, direction) {
  const current = Number(minute) || 0;
  const next = current + direction * MINUTE_STEP;
  if (next > 59) return 0;
  if (next < 0) return 45;
  return next;
}

function StepButton({ icon: Icon, label, onClick, dark }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        'grid h-9 w-9 place-items-center rounded-xl border transition active:scale-95',
        dark
          ? 'border-slate-700 bg-slate-950/70 text-slate-300 hover:border-cyan-300/35 hover:text-cyan-100'
          : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700',
      )}
    >
      <Icon size={15} />
    </button>
  );
}

function ValueStepper({ label, value, onDecrease, onIncrease, dark }) {
  return (
    <div className="flex items-center gap-2">
      <StepButton icon={Minus} label={`Decrease ${label}`} onClick={onDecrease} dark={dark} />
      <div className={cn(
        'flex h-9 min-w-12 items-center justify-center rounded-xl border px-3 text-sm font-black',
        dark ? 'border-slate-700 bg-slate-950/70 text-white' : 'border-slate-200 bg-white text-slate-950',
      )}>
        {value}
      </div>
      <StepButton icon={Plus} label={`Increase ${label}`} onClick={onIncrease} dark={dark} />
    </div>
  );
}

function PeriodToggle({ value, onChange, dark }) {
  return (
    <div className={cn(
      'grid h-9 grid-cols-2 rounded-xl border p-1',
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
              'rounded-lg px-3 text-xs font-black transition active:scale-95',
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-[10rem] items-center gap-2">
            <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl', dark ? 'bg-cyan-400/10 text-cyan-200' : 'bg-blue-50 text-blue-700')}>
              <Clock3 size={17} />
            </span>
            <div className="min-w-0">
              <p className={cn('truncate text-[10px] font-black uppercase tracking-[0.18em]', dark ? 'text-slate-500' : 'text-slate-500')}>Selected time</p>
              <p className={cn('text-xl font-black leading-tight', dark ? 'text-white' : 'text-slate-950')}>{formatTimeLabel(value)}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ValueStepper
              label={`${label} hour`}
              value={parsed.hour}
              onDecrease={() => update({ hour: stepHour(parsed.hour, -1) })}
              onIncrease={() => update({ hour: stepHour(parsed.hour, 1) })}
              dark={dark}
            />
            <span className={cn('text-lg font-black', dark ? 'text-slate-500' : 'text-slate-400')}>:</span>
            <ValueStepper
              label={`${label} minute`}
              value={String(parsed.minute).padStart(2, '0')}
              onDecrease={() => update({ minute: stepMinute(parsed.minute, -1) })}
              onIncrease={() => update({ minute: stepMinute(parsed.minute, 1) })}
              dark={dark}
            />
            <div className="w-24 shrink-0">
              <PeriodToggle value={parsed.period} onChange={(period) => update({ period })} dark={dark} />
            </div>
          </div>
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
