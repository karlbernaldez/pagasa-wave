import { Activity, Check, Clock, MapPin, XCircle } from 'lucide-react';
import StatCard from '@dashboards/admin/components/StatCard';

const DashboardOverview = ({ isDarkMode }) => (
  <div className="space-y-8">
    <div className="flex items-end justify-between">
      <div>
        <p className={`text-sm font-semibold uppercase tracking-widest ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Welcome back</p>
        <h1 className={`text-3xl md:text-4xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Wave Forecast Dashboard</h1>
      </div>
      <span className={`text-sm font-medium px-4 py-2 rounded-full ${isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'}`}>System Healthy</span>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Total Charts" value="284" change="+12% this week" color="blue" icon={MapPin} isDarkMode={isDarkMode} trend="up" />
      <StatCard title="Pending Review" value="23" change="+5 new" color="amber" icon={Clock} isDarkMode={isDarkMode} trend="up" />
      <StatCard title="Approved" value="247" change="+18% approval" color="green" icon={Check} isDarkMode={isDarkMode} trend="up" />
      <StatCard title="Rejected" value="14" change="+2 flagged" color="red" icon={XCircle} isDarkMode={isDarkMode} trend="down" />
    </div>

    <div className={`rounded-2xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/60 border-gray-200/70'} p-6`}>
      <div className="flex items-center gap-3 mb-4">
        <Activity size={20} className={isDarkMode ? 'text-cyan-400' : 'text-cyan-600'} />
        <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Recent Submissions</h3>
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((index) => (
          <div key={index} className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/60'} flex justify-between items-center`}>
            <p className={isDarkMode ? 'text-gray-200' : 'text-gray-800'}>Wave Chart #{index} • Forecaster {index}</p>
            <span className={`text-xs font-semibold px-3 py-1 rounded-lg ${index === 1 ? (isDarkMode ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-100 text-amber-700') : (isDarkMode ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-100 text-emerald-700')}`}>
              {index === 1 ? 'Pending' : 'Approved'}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default DashboardOverview;