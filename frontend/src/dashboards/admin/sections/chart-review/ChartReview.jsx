import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
  'Archived'
];

const ChartReviewSection = ({ isDarkMode }) => {
  const { projects, isLoading, error, refetch } = useAdminProjects();

  const [viewType, setViewType] = useState('cards');
  const [selectedChart, setSelectedChart] = useState(null);
  const [activeStatus, setActiveStatus] = useState('Submitted');

  const filteredProjects = useMemo(() => {
    if (activeStatus === 'All') return projects;
    return projects.filter(p => p.status === activeStatus);
  }, [projects, activeStatus]);

  const hasProjects = !isLoading && !error && filteredProjects.length > 0;

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
              {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <ViewToggle value={viewType} onChange={setViewType} isDarkMode={isDarkMode} />
      </div>

      {/* Bootstrap-style Tabs */}
      <div className="flex gap-2 flex-wrap border-b pb-2">
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

      {isLoading && <LoadingState isDarkMode={isDarkMode} />}
      {!isLoading && error && <ErrorState message={error} isDarkMode={isDarkMode} />}

      {!isLoading && !error && filteredProjects.length === 0 && (
        <EmptyState
          title={`No ${activeStatus} projects`}
          description="Projects will appear here based on their workflow status."
          isDarkMode={isDarkMode}
        />
      )}

      {hasProjects && viewType === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredProjects.map(chart => (
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
        <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white border-gray-200'
          }`}>
          {filteredProjects.map(chart => (
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
            onActionComplete={refetch} // 🔥 auto refresh after approve/reject
          />,
          document.body
        )}
    </div>
  );
};

export default ChartReviewSection;