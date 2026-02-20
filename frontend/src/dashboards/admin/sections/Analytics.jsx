import { BarChart3, TrendingUp } from 'lucide-react';

const AnalyticsSection = ({ isDarkMode }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {[{ title: 'Submission Trend', icon: TrendingUp }, { title: 'Approval Rate', icon: BarChart3 }].map(({ title, icon: Icon }) => (
      <section key={title} className={`rounded-2xl border p-6 ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/80 border-gray-200'}`}>
        <div className="flex items-center gap-3 mb-4">
          <Icon size={20} className={isDarkMode ? 'text-cyan-400' : 'text-cyan-600'} />
          <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
        </div>
        <div className={`h-48 rounded-xl ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/60'} flex items-center justify-center`}>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Analytics visualization placeholder</p>
        </div>
      </section>
    ))}
  </div>
);

export default AnalyticsSection;
