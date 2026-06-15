import { Info } from 'lucide-react';
import { card, textPrimary, textSecondary, textMuted, trackBg } from '../utils/theme';

export default function ForecastProgressCard({ charts = [], isDarkMode }) {
  const total     = charts.length || 4;
  const completed = charts.filter((c) => c.status === 'Completed').length || 3;
  const percent   = Math.round((completed / total) * 100);

  const radius        = 60;
  const circumference = 2 * Math.PI * radius;
  const offset        = circumference - (percent / 100) * circumference;

  return (
    <div className={`p-6 ${card(isDarkMode)}`}>
      {/* Section label — small uppercase like the target */}
      <p className={`mb-5 text-[11px] font-bold uppercase tracking-widest ${textMuted(isDarkMode)}`}>
        Forecast Progress
      </p>

      <div className="flex items-center gap-8">
        {/* Donut — larger to match target */}
        <div className="relative h-[148px] w-[148px] flex-shrink-0">
          <svg viewBox="0 0 148 148" className="h-[148px] w-[148px] -rotate-90">
            <circle
              cx="74" cy="74" r={radius}
              fill="none"
              stroke={isDarkMode ? '#0d2348' : '#e5e7eb'}
              strokeWidth="12"
            />
            <circle
              cx="74" cy="74" r={radius}
              fill="none"
              stroke="#22c55e"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-[34px] font-extrabold leading-none ${textPrimary(isDarkMode)}`}>
              {percent}
              <sup className="text-[16px] font-bold">%</sup>
            </span>
            <span className={`mt-1 text-[11px] font-medium ${textSecondary(isDarkMode)}`}>
              Complete
            </span>
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1">
          <h3 className={`text-xl font-bold ${textPrimary(isDarkMode)}`}>Overall Progress</h3>
          <p className={`mt-0.5 text-sm ${textSecondary(isDarkMode)}`}>
            {completed} of {total} charts completed
          </p>

          {/* Progress bar */}
          <div className={`mt-4 h-2.5 overflow-hidden rounded-full ${trackBg(isDarkMode)}`}>
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>

          {/* Info box */}
          <div
            className={`mt-4 flex gap-3 rounded-xl border p-4 ${
              isDarkMode
                ? 'border-[#0d2348] bg-[#061529]'
                : 'border-blue-200 bg-blue-50'
            }`}
          >
            <Info size={18} className="mt-0.5 flex-shrink-0 text-blue-500" />
            <div>
              <p className={`text-sm font-semibold ${textPrimary(isDarkMode)}`}>
                You have {total - completed} chart{total - completed !== 1 ? 's' : ''} remaining.
              </p>
              <p className={`mt-1 text-xs ${textSecondary(isDarkMode)}`}>
                Complete all charts and submit for review before the publication deadline.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}