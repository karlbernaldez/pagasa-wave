import { useState } from 'react';
import { AlertCircle, Check, Download, Eye, LayoutGrid, List } from 'lucide-react';

const CHARTS = Array.from({ length: 8 }, (_, index) => {
  const chartId = index + 1;
  return {
    id: chartId,
    title: `Chart #${chartId}`,
    owner: `Forecaster ${chartId}`,
    status: chartId % 3 === 0 ? 'Pending' : 'Approved',
  };
});

const ChartReviewSection = ({ isDarkMode }) => {
  const [viewType, setViewType] = useState('cards');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Chart Review</h3>
        <div className={`inline-flex rounded-xl border p-1 ${isDarkMode ? 'border-gray-700 bg-gray-800/60' : 'border-gray-200 bg-white'}`}>
          <button onClick={() => setViewType('cards')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold inline-flex items-center gap-2 ${viewType === 'cards' ? 'bg-blue-500 text-white' : isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}><LayoutGrid size={14} />Cards</button>
          <button onClick={() => setViewType('list')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold inline-flex items-center gap-2 ${viewType === 'list' ? 'bg-blue-500 text-white' : isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}><List size={14} />List</button>
        </div>
      </div>

      {viewType === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CHARTS.map((chart) => {
            const isPending = chart.status === 'Pending';
            return (
              <article key={chart.id} className={`rounded-2xl overflow-hidden border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/80 border-gray-200'}`}>
                <div className="h-36 bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400" />
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{chart.title}</h3>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${isPending ? (isDarkMode ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-100 text-amber-700') : (isDarkMode ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-100 text-emerald-700')}`}>{chart.status}</span>
                  </div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{chart.owner}</p>
                  <div className="flex gap-2">
                    {isPending ? (
                      <>
                        <button className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg py-2 text-sm font-semibold"><Check size={16} />Approve</button>
                        <button className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold border ${isDarkMode ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-700'}`}><AlertCircle size={16} />Revise</button>
                      </>
                    ) : (
                      <>
                        <button className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold"><Eye size={16} />View</button>
                        <button className={`px-3 rounded-lg border ${isDarkMode ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-700'}`}><Download size={16} /></button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/90 border-gray-200'}`}>
          {CHARTS.map((chart) => {
            const isPending = chart.status === 'Pending';
            return (
              <div key={chart.id} className={`p-4 border-b last:border-b-0 ${isDarkMode ? 'border-gray-700/70' : 'border-gray-200'} flex items-center justify-between gap-4`}>
                <div>
                  <p className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{chart.title}</p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{chart.owner}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${isPending ? (isDarkMode ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-100 text-amber-700') : (isDarkMode ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-100 text-emerald-700')}`}>{chart.status}</span>
                  <button className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${isPending ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'}`}>{isPending ? 'Approve' : 'View'}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChartReviewSection;
