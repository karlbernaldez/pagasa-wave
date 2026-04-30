import { TrendingUp } from 'lucide-react';

const COLOR_CLASSES = {
  blue: {
    panel: 'bg-blue-50 text-blue-700',
    darkPanel: 'bg-blue-500/15 text-blue-300',
    trend: 'text-blue-700',
    darkTrend: 'text-blue-300',
  },
  green: {
    panel: 'bg-emerald-50 text-emerald-700',
    darkPanel: 'bg-emerald-500/15 text-emerald-300',
    trend: 'text-emerald-700',
    darkTrend: 'text-emerald-300',
  },
  amber: {
    panel: 'bg-amber-50 text-amber-700',
    darkPanel: 'bg-amber-500/15 text-amber-300',
    trend: 'text-amber-700',
    darkTrend: 'text-amber-300',
  },
  red: {
    panel: 'bg-red-50 text-red-700',
    darkPanel: 'bg-red-500/15 text-red-300',
    trend: 'text-red-700',
    darkTrend: 'text-red-300',
  },
  cyan: {
    panel: 'bg-cyan-50 text-cyan-700',
    darkPanel: 'bg-cyan-500/15 text-cyan-300',
    trend: 'text-cyan-700',
    darkTrend: 'text-cyan-300',
  },
};

const DEFAULT_COLOR = 'blue';

const StatCard = ({
  title,
  value,
  change,
  color = DEFAULT_COLOR,
  icon: Icon,
  isDarkMode = false,
  trend = 'up',
}) => {
  const palette = COLOR_CLASSES[color] || COLOR_CLASSES[DEFAULT_COLOR];
  const iconClass = isDarkMode ? palette.darkPanel : palette.panel;
  const trendClass =
    trend === 'up'
      ? isDarkMode ? palette.darkTrend : palette.trend
      : isDarkMode ? 'text-red-300' : 'text-red-700';

  return (
    <div
      className={`rounded-xl border p-5 transition-colors ${
        isDarkMode
          ? 'border-gray-700 bg-gray-800'
          : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>
            {title}
          </p>
          <p className={`mt-2 text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            {value}
          </p>
        </div>

        {Icon && (
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
            <Icon size={22} />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <TrendingUp size={15} className={trendClass} />
        <span className={`text-sm font-semibold ${trendClass}`}>{change}</span>
      </div>
    </div>
  );
};

export default StatCard;
