import { AlertCircle, Check, Download, Eye } from 'lucide-react';

const ChartReviewSection = ({ isDarkMode }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((chartId) => {
        const isPending = chartId % 3 === 0;
        return (
          <article key={chartId} className={`rounded-2xl overflow-hidden border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/80 border-gray-200'}`}>
            <div className="h-36 bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400" />
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Chart #{chartId}</h3>
                <span className={`text-xs font-bold px-2 py-1 rounded-md ${isPending ? (isDarkMode ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-100 text-amber-700') : (isDarkMode ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-100 text-emerald-700')}`}>{isPending ? 'Pending' : 'Approved'}</span>
              </div>
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
  </div>
);

export default ChartReviewSection;