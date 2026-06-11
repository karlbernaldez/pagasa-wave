import {
  CheckCircle2,
  Circle,
  PlayCircle,
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
  const Icon =
    ICONS[icon] || Waves;

  const completed =
    status === 'Completed';

  const inProgress =
    status === 'In Progress';

  return (
    <div className="relative flex gap-4 pb-8">
      {!isLast && (
        <div className="absolute left-[11px] top-7 h-full w-[2px] bg-[#12325a]" />
      )}

      {/* Timeline Node */}
      <div className="relative z-10 mt-1">
        {completed ? (
          <CheckCircle2
            size={24}
            className="text-emerald-500"
          />
        ) : inProgress ? (
          <PlayCircle
            size={24}
            className="text-yellow-500"
          />
        ) : (
          <Circle
            size={24}
            className="text-slate-500"
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="rounded-xl border border-[#0d2348] bg-[#071629] p-4 transition-all hover:border-blue-500">
          <div className="flex items-start justify-between">
            <div className="flex gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0d2348]">
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
                <h3 className="font-semibold text-white">
                  {title}
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  {description}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  completed
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-yellow-500/15 text-yellow-400'
                }`}
              >
                {status}
              </span>

              <div className="mt-2 flex items-center justify-end gap-1 text-xs text-slate-500">
                <Clock3 size={12} />

                <span>
                  {time || '--'}
                </span>
              </div>
            </div>
          </div>

          {inProgress && (
            <div className="mt-4 flex items-center justify-between rounded-lg bg-blue-600/10 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-blue-300">
                  Active Forecast
                </p>

                <p className="text-xs text-slate-400">
                  Continue working on this forecast.
                </p>
              </div>

              <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
                Open Workspace
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}