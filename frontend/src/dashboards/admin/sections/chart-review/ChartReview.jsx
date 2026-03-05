import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUp, ArrowDown, ArrowUpDown, ChevronDown } from 'lucide-react';
import { useAdminProjects } from './hooks/useAdminProject';
import ProjectCard from './components/ProjectCard';
import ListRow from './components/ListRow';
import ViewToggle from './components/ViewToggle';
import ChartDetailModal from './components/ChartDetailModal';
import { LoadingState, ErrorState, EmptyState } from './components/StateViews';

const STATUS_TABS = [
  'All',
  'Submitted',
  'Under Review',
  'Approved',
  'Published',
  'Rejected',
  'Archived',
];

const SORT_OPTIONS = [
  { value: 'submittedAt', label: 'Submitted'    },
  { value: 'updatedAt',   label: 'Last Updated' },
  { value: 'createdAt',   label: 'Date Created' },
  { value: 'name',        label: 'Name'         },
  { value: 'status',      label: 'Status'       },
];

function sortProjects(projects, sortBy, sortDir) {
  return [...projects].sort((a, b) => {
    let valA, valB;
    if (sortBy === 'name' || sortBy === 'status') {
      valA = (a[sortBy] ?? '').toLowerCase();
      valB = (b[sortBy] ?? '').toLowerCase();
    } else {
      valA = new Date(a[sortBy] ?? 0).getTime();
      valB = new Date(b[sortBy] ?? 0).getTime();
    }
    if (valA < valB) return sortDir === 'asc' ? -1 :  1;
    if (valA > valB) return sortDir === 'asc' ?  1 : -1;
    return 0;
  });
}

const ChartReviewSection = ({ isDarkMode }) => {
  const { projects, isLoading, error, refetch } = useAdminProjects();

  const [viewType,      setViewType]      = useState('cards');
  const [selectedChart, setSelectedChart] = useState(null);
  const [activeStatus,  setActiveStatus]  = useState('Submitted');
  const [sortBy,        setSortBy]        = useState('submittedAt');
  const [sortDir,       setSortDir]       = useState('desc');

  const toggleDir = () => setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));

  const filteredAndSorted = useMemo(() => {
    const filtered = activeStatus === 'All'
      ? projects
      : projects.filter(p => p.status === activeStatus);
    return sortProjects(filtered, sortBy, sortDir);
  }, [projects, activeStatus, sortBy, sortDir]);

  const hasProjects = !isLoading && !error && filteredAndSorted.length > 0;

  // Shared control style helpers
  const controlBorder = isDarkMode
    ? 'border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-700/70 hover:border-gray-600'
    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300';

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Chart Review
          </h3>
          {!isLoading && !error && (
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {filteredAndSorted.length} project{filteredAndSorted.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <ViewToggle value={viewType} onChange={setViewType} isDarkMode={isDarkMode} />
      </div>

      {/* Tabs + Sort controls */}
      <div className={`flex items-end justify-between gap-4 border-b pb-2 flex-wrap ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>

        {/* Status tabs */}
        <div className="flex gap-2 flex-wrap">
          {STATUS_TABS.map(status => (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition
                ${activeStatus === status
                  ? isDarkMode
                    ? 'bg-gray-700 text-white'
                    : 'bg-white border border-b-0 border-gray-300 text-gray-900'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Sort controls */}
        <div className="flex items-center gap-2 pb-1 flex-shrink-0">
          <ArrowUpDown
            size={12}
            className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}
          />

          {/* Sort-by select */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className={`
                appearance-none pl-3 pr-7 py-1.5 rounded-lg border text-xs font-semibold
                transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30
                ${controlBorder}
              `}
            >
              {SORT_OPTIONS.map(opt => (
                <option
                  key={opt.value}
                  value={opt.value}
                  className={isDarkMode ? 'bg-gray-900 text-gray-200' : 'bg-white text-gray-800'}
                >
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={11}
              className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}
            />
          </div>

          {/* Asc / Desc toggle */}
          <button
            onClick={toggleDir}
            title={sortDir === 'asc' ? 'Ascending — click for descending' : 'Descending — click for ascending'}
            className={`
              inline-flex items-center gap-1.5 pl-2.5 pr-3 py-1.5
              rounded-lg border text-xs font-semibold transition-all
              focus:outline-none focus:ring-2 focus:ring-blue-500/30
              ${controlBorder}
            `}
          >
            {sortDir === 'asc'
              ? <ArrowUp   size={12} strokeWidth={2.5} />
              : <ArrowDown size={12} strokeWidth={2.5} />
            }
            {sortDir === 'asc' ? 'Asc' : 'Desc'}
          </button>
        </div>
      </div>

      {isLoading && <LoadingState isDarkMode={isDarkMode} />}
      {!isLoading && error && <ErrorState message={error} isDarkMode={isDarkMode} />}

      {!isLoading && !error && filteredAndSorted.length === 0 && (
        <EmptyState
          title={`No ${activeStatus} projects`}
          description="Projects will appear here based on their workflow status."
          isDarkMode={isDarkMode}
        />
      )}

      {hasProjects && viewType === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredAndSorted.map(chart => (
            <ProjectCard
              key={chart._id}
              chart={chart}
              isDarkMode={isDarkMode}
              onClick={() => setSelectedChart(chart)}
            />
          ))}
        </div>
      )}

      {hasProjects && viewType === 'list' && (
        <div className={`rounded-2xl border overflow-hidden ${
          isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white border-gray-200'
        }`}>
          {filteredAndSorted.map(chart => (
            <ListRow
              key={chart._id}
              chart={chart}
              isDarkMode={isDarkMode}
              onClick={() => setSelectedChart(chart)}
            />
          ))}
        </div>
      )}

      {selectedChart &&
        createPortal(
          <ChartDetailModal
            chart={selectedChart}
            isDarkMode={isDarkMode}
            onClose={() => setSelectedChart(null)}
            onActionComplete={refetch}
          />,
          document.body
        )}
    </div>
  );
};

export default ChartReviewSection;