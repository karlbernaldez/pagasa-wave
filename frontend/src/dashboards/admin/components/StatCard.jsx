import { TrendingUp } from 'lucide-react';

const COLOR_CLASSES = {
  blue: {
    panel: 'from-blue-600/20 to-cyan-600/20 text-blue-400',
    lightPanel: 'from-blue-50 to-cyan-50 text-blue-600',
    text: 'text-blue-300',
    lightText: 'text-blue-600',
    accent: 'bg-blue-400',
  },
  green: {
    panel: 'from-emerald-600/20 to-teal-600/20 text-emerald-400',
    lightPanel: 'from-emerald-50 to-teal-50 text-emerald-600',
    text: 'text-green-300',
    lightText: 'text-green-600',
    accent: 'bg-green-400',
  },
  amber: {
    panel: 'from-amber-600/20 to-orange-600/20 text-amber-400',
    lightPanel: 'from-amber-50 to-orange-50 text-amber-600',
    text: 'text-amber-300',
    lightText: 'text-amber-600',
    accent: 'bg-amber-400',
  },
  red: {
    panel: 'from-red-600/20 to-pink-600/20 text-red-400',
    lightPanel: 'from-red-50 to-pink-50 text-red-600',
    text: 'text-red-300',
    lightText: 'text-red-600',
    accent: 'bg-red-400',
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

  if (!COLOR_CLASSES[color]) {
    console.warn(`StatCard: invalid color "${color}" → fallback to "${DEFAULT_COLOR}"`);
  }

  const panelClass = isDarkMode ? palette.panel : palette.lightPanel;
  const textClass = isDarkMode ? palette.text : palette.lightText;
  const trendClass =
    trend === 'up'
      ? textClass
      : isDarkMode
      ? 'text-red-400'
      : 'text-red-600';

  return (
    <div className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
      isDarkMode
        ? 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600'
        : 'bg-white/50 border-white/50 backdrop-blur-sm hover:border-gray-200'
    }`}>

      <div className={`absolute inset-0 bg-gradient-to-br ${panelClass} opacity-40 group-hover:opacity-60 transition-opacity duration-300`} />
      <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${palette.accent}`} />

      <div className="relative p-6 z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className={`text-sm font-medium tracking-wide uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {title}
            </p>

            <p className={`text-4xl font-bold mt-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {value}
            </p>
          </div>

          {Icon && (
            <div className={`p-3 rounded-xl bg-gradient-to-br ${panelClass} transition-transform duration-300 group-hover:scale-110`}>
              <Icon size={28} className={textClass} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200/20">
          <TrendingUp size={16} className={trendClass} />
          <span className={`text-sm font-semibold ${trendClass}`}>
            {change}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
