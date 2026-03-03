import { Check, AlertCircle, Eye } from 'lucide-react';
import StatusPill from './StatusPill';

const ListRow = ({ chart, isDarkMode, onClick }) => {
  const isPending = chart.status === 'Pending';

  const handleActionClick = (e) => {
    e.stopPropagation(); // action buttons don't expand the modal
  };

  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between gap-4 px-5 py-4 border-b last:border-b-0
        transition-colors duration-150 cursor-pointer group
        ${
          isDarkMode
            ? 'border-gray-700/60 hover:bg-gray-700/30'
            : 'border-gray-100 hover:bg-gray-50'
        }`}
    >
      {/* Left: title + meta */}
      <div className="min-w-0 flex-1">
        <p
          className={`font-semibold truncate group-hover:underline underline-offset-2 ${
            isDarkMode ? 'text-gray-100' : 'text-gray-900'
          }`}
        >
          {chart.title}
        </p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {chart.owner}
          </span>
          <span
            className={`text-xs px-1.5 py-0.5 rounded ${
              isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {chart.chartType}
          </span>
        </div>
      </div>

      {/* Right: status + action */}
      <div className="flex items-center gap-3 shrink-0">
        <StatusPill status={chart.status} isDarkMode={isDarkMode} />
        <button
          onClick={handleActionClick}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 active:scale-95 ${
            isPending
              ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-sm shadow-emerald-500/30'
              : 'bg-blue-500 hover:bg-blue-400 text-white shadow-sm shadow-blue-500/30'
          }`}
        >
          {isPending ? 'Approve' : 'View'}
        </button>
      </div>
    </div>
  );
};

export default ListRow;