import {
  CheckCircle2,
  Circle,
  Clock3,
  Waves,
  Wind,
  CloudRain,
} from 'lucide-react';

const ICONS = {
  Waves,
  Wind,
  CloudRain,
};

export default function ForecastChecklistItem({
  title,
  description,
  status,
  time,
  icon,
  isLast,
}) {
  const Icon = ICONS[icon] || Waves;

  const completed = status === 'Completed';
  const inProgress = status === 'In Progress';

  return (
    <div className="relative flex gap-4 pb-8">
      {/* Timeline connector line */}
      {!isLast && (
        <div
          className={`absolute left-[11px] top-7 h-full w-[2px] ${
            completed ? 'bg-emerald-500/30' : 'bg-[#12325a]'
          }`}
        />
      )}

      {/* Timeline node */}
      <div className="relative z-10 mt-1 flex-shrink-0">
        {completed ? (
          <div className="flex h-[24px] w-[24px] items-center justify-center rounded-full bg-emerald-500/15">
            <CheckCircle2 size={24} className="text-emerald-500" />
          </div>
        ) : inProgress ? (
          <span className="relative flex h-[24px] w-[24px] items-center justify-center">
            {/* Outer pulse ring */}
            <span className="absolute inset-0 animate-ping rounded-full border-2 border-yellow-400 opacity-50" />
            {/* Inner filled node */}
            <span className="relative flex h-[24px] w-[24px] items-center justify-center rounded-full border-[1.5px] border-yellow-400 bg-yellow-400/10">
              <span className="h-[8px] w-[8px] rounded-full bg-yellow-400" />
            </span>
          </span>
        ) : (
          <Circle size={24} className="text-slate-600" />
        )}
      </div>

      {/* Card content */}
      <div className="flex-1">
        <div
          className={`rounded-xl border p-4 transition-all ${
            inProgress
              ? 'border-yellow-500/30 bg-[#071629] hover:border-yellow-400/50'
              : completed
              ? 'border-emerald-500/20 bg-[#071629] hover:border-emerald-400/30'
              : 'border-[#0d2348] bg-[#071629] hover:border-blue-500/40'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            {/* Left: icon + text */}
            <div className="flex gap-3">
              <div
                className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${
                  inProgress
                    ? 'bg-yellow-400/10'
                    : completed
                    ? 'bg-emerald-500/10'
                    : 'bg-[#0d2348]'
                }`}
              >
                <Icon
                  size={18}
                  className={
                    completed
                      ? 'text-emerald-400'
                      : inProgress
                      ? 'text-yellow-400'
                      : 'text-blue-400'
                  }
                />
              </div>

              <div>
                <h3
                  className={`font-semibold ${
                    completed ? 'text-slate-400' : 'text-white'
                  }`}
                >
                  {title}
                </h3>
                <p className="mt-1 text-sm text-slate-500">{description}</p>
              </div>
            </div>

            {/* Right: badge + time */}
            <div className="flex-shrink-0 text-right">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  completed
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : inProgress
                    ? 'bg-yellow-500/15 text-yellow-400'
                    : 'bg-slate-500/15 text-slate-400'
                }`}
              >
                {status}
              </span>

              <div className="mt-2 flex items-center justify-end gap-1 text-xs text-slate-500">
                <Clock3 size={12} />
                <span>{time || '–'}</span>
              </div>
            </div>
          </div>

          {/* In-progress workspace CTA */}
          {inProgress && (
            <div className="mt-4 flex items-center justify-between rounded-lg border border-yellow-500/20 bg-yellow-400/5 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-yellow-300">Active Forecast</p>
                <p className="text-xs text-slate-500">Continue working on this forecast.</p>
              </div>
              <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 active:scale-[0.98]">
                Open Workspace
              </button>
            </div>
          )}

          {/* Completed checkmark footer */}
          {completed && (
            <div className="mt-3 flex items-center gap-1.5 border-t border-emerald-500/10 pt-3">
              <CheckCircle2 size={13} className="text-emerald-500/60" />
              <span className="text-xs text-emerald-500/60">Completed at {time}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}