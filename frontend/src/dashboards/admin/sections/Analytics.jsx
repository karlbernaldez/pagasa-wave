import { useState } from 'react';
import { BarChart3, LayoutGrid, List, TrendingUp } from 'lucide-react';

const METRICS = [
  { title: 'Submission Trend', value: '+14%', description: 'Compared to previous week', icon: TrendingUp },
  { title: 'Approval Rate', value: '92%', description: '7-day rolling average', icon: BarChart3 },
  { title: 'Average Review Time', value: '2.4h', description: 'From submission to decision', icon: TrendingUp },
  { title: 'Rejected Charts', value: '14', description: 'Flagged for revision this month', icon: BarChart3 },
];

const AnalyticsSection = ({ isDarkMode }) => {
  const [viewType, setViewType] = useState('cards');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Chart Analytics</h3>
        <div className={`inline-flex rounded-xl border p-1 ${isDarkMode ? 'border-gray-700 bg-gray-800/60' : 'border-gray-200 bg-white'}`}>
          <button onClick={() => setViewType('cards')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold inline-flex items-center gap-2 ${viewType === 'cards' ? 'bg-blue-500 text-white' : isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}><LayoutGrid size={14} />Cards</button>
          <button onClick={() => setViewType('list')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold inline-flex items-center gap-2 ${viewType === 'list' ? 'bg-blue-500 text-white' : isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}><List size={14} />List</button>
        </div>
      </div>

      {viewType === 'cards' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {METRICS.map(({ title, value, description, icon: Icon }) => (
            <section key={title} className={`rounded-2xl border p-6 ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/80 border-gray-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Icon size={20} className={isDarkMode ? 'text-cyan-400' : 'text-cyan-600'} />
                  <h4 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h4>
                </div>
                <span className={`text-xl font-black ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>{value}</span>
              </div>
              <div className={`h-36 rounded-xl ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/60'} flex items-center justify-center`}>
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{description}</p>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/90 border-gray-200'}`}>
          {METRICS.map(({ title, value, description, icon: Icon }) => (
            <div key={title} className={`p-5 flex items-center justify-between gap-4 border-b last:border-b-0 ${isDarkMode ? 'border-gray-700/70' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <Icon size={18} className={isDarkMode ? 'text-cyan-400' : 'text-cyan-600'} />
                <div>
                  <p className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{title}</p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{description}</p>
                </div>
              </div>
              <span className={`text-lg font-black ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnalyticsSection;
