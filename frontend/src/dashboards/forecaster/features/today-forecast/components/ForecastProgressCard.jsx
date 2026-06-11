import { Info } from 'lucide-react';
import { card, heading, textPrimary, textSecondary, trackBg } from '../utils/theme';

export default function ForecastProgressCard({ charts = [], isDarkMode }) {
  const total     = charts.length || 4;
  const completed = charts.filter((c) => c.status === 'Completed').length || 3;
  const percent   = Math.round((completed / total) * 100);

  const radius       = 46;
  const circumference = 2 * Math.PI * radius;
  const offset       = circumference - (percent / 100) * circumference;

  return (
    <div className={`p-6 ${card(isDarkMode)}`}>
      <h2 className={`mb-5 ${heading(isDarkMode)}`}>Forecast Progress</h2>

      <div className="flex items-center gap-6">
        {/* Donut */}
        <div className="relative h-[110px] w-[110px] flex-shrink-0">
          <svg viewBox="0 0 110 110" className="h-[110px] w-[110px] -rotate-90">
            <circle
              cx="55" cy="55" r={radius}
              fill="none"
              stroke={isDarkMode ? '#0d2348' : '#e5e7eb'}
              strokeWidth="10"
            />
            <circle
              cx="55" cy="55" r={radius}
              fill="none"
              stroke="#22c55e"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-[26px] font-extrabold leading-none ${textPrimary(isDarkMode)}`}>
              {percent}
              <sup className="text-[13px] font-semibold">%</sup>
            </span>
            <span className={`mt-1 text-[10px] ${textSecondary(isDarkMode)}`}>Complete</span>
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1">
          <h3 className={`text-lg font-bold ${textPrimary(isDarkMode)}`}>Overall Progress</h3>
          <p className={`mt-0.5 text-xs ${textSecondary(isDarkMode)}`}>
            {completed} of {total} charts completed
          </p>

          {/* Progress bar */}
          <div className={`mt-3.5 h-2 overflow-hidden rounded-full ${trackBg(isDarkMode)}`}>
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>

          {/* Info box */}
          <div
            className={`mt-3.5 flex gap-2.5 rounded-xl border p-3 ${
              isDarkMode
                ? 'border-blue-900/60 bg-blue-500/10'
                : 'border-blue-200 bg-blue-50'
            }`}
          >
            <Info size={16} className="mt-0.5 flex-shrink-0 text-blue-500" />
            <div>
              <p className={`text-[12.5px] font-semibold ${textPrimary(isDarkMode)}`}>
                You have {total - completed} chart{total - completed !== 1 ? 's' : ''} remaining.
              </p>
              <p className={`mt-0.5 text-[11px] ${textSecondary(isDarkMode)}`}>
                Complete all charts and submit for review before the publication deadline.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}