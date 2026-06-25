import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, FolderKanban, LayoutGrid, List } from 'lucide-react';

import Button from '@/components/ui/Button';
import ForecastPackageCard from './ForecastPackageCard';
import ProjectReviewModal from '@/features/projects/components/ProjectReviewModal';
import AdminDailyPackageFocus from '@/features/projects/components/project-library/AdminDailyPackageFocus';
import ProjectPagination from '@/features/projects/components/project-library/ProjectPagination';
import ProjectStats from '@/features/projects/components/project-library/ProjectStats';
import ProjectToolbar from '@/features/projects/components/project-library/ProjectToolbar';
import { useProjectLibraryController } from '@/features/projects/hooks/useProjectLibraryController';
import { isProjectPublished } from '@/features/projects/projectStatuses';
import { groupForecastPackages } from '@/features/projects/utils/forecastPackageGrouping';
import { useTheme } from '@/app/providers/ThemeProvider';
import useCurrentDashboardUser from '@/shared/hooks/useCurrentDashboardUser';

function getProjectId(project) {
  return project?._id || project?.id;
}

function getReviewModalProject(project) {
  if (!project) return project;

  return {
    ...project,
    reviewComment: undefined,
  };
}

function getWelcomeName(user) {
  const name = String(user?.name || '').trim();

  if (!name || name.toLowerCase().startsWith('loading')) return 'Admin';
  if (name.includes('@')) return name.split('@')[0];

  return name.split(' ')[0] || 'Admin';
}

function ViewToggle({ isDarkMode, setView, view }) {
  const buttonBase = 'inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-black transition sm:flex-none';
  const inactiveClass = isDarkMode ? 'text-slate-300 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-100';

  return (
    <div className={`grid w-full grid-cols-2 rounded-2xl border p-1 shadow-sm sm:inline-grid sm:w-auto ${isDarkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200 bg-white'}`}>
      <button
        type="button"
        aria-label="Show package cards"
        aria-pressed={view === 'grid'}
        className={`${buttonBase} ${view === 'grid' ? 'bg-cyan-500 text-white shadow-sm' : inactiveClass}`}
        onClick={() => setView('grid')}
      >
        <LayoutGrid size={16} />
        <span>Cards</span>
      </button>
      <button
        type="button"
        aria-label="Show compact package list"
        aria-pressed={view === 'list'}
        className={`${buttonBase} ${view === 'list' ? 'bg-cyan-500 text-white shadow-sm' : inactiveClass}`}
        onClick={() => setView('list')}
      >
        <List size={16} />
        <span>List</span>
      </button>
    </div>
  );
}

function GridState({ isDarkMode, onRetry, type }) {
  if (type === 'loading') {
    return (
      <div className="grid gap-5 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className={`overflow-hidden rounded-3xl border shadow-sm ${isDarkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200 bg-white'}`}>
            <div className="space-y-4 p-4">
              <div className={`h-5 w-2/3 animate-pulse rounded ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
              <div className="grid grid-cols-3 gap-3">
                <div className={`h-20 animate-pulse rounded-xl ${isDarkMode ? 'bg-slate-800/70' : 'bg-slate-100'}`} />
                <div className={`h-20 animate-pulse rounded-xl ${isDarkMode ? 'bg-slate-800/70' : 'bg-slate-100'}`} />
                <div className={`h-20 animate-pulse rounded-xl ${isDarkMode ? 'bg-slate-800/70' : 'bg-slate-100'}`} />
              </div>
              <div className={`h-14 animate-pulse rounded-2xl ${isDarkMode ? 'bg-slate-800/70' : 'bg-slate-100'}`} />
              <div className={`h-14 animate-pulse rounded-2xl ${isDarkMode ? 'bg-slate-800/70' : 'bg-slate-100'}`} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'error') {
    return (
      <div className={`flex items-center justify-between rounded-2xl border p-6 text-sm ${isDarkMode ? 'border-red-500/30 bg-red-950/30 text-red-300' : 'border-red-200 bg-red-50 text-red-700'}`}>
        <span className="inline-flex items-center gap-2 font-semibold">
          <AlertCircle size={18} />
          Failed to load forecast packages.
        </span>
        <Button variant="ghost" size="sm" onClick={onRetry}>Retry</Button>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border p-12 text-center shadow-sm ${isDarkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200 bg-white'}`}>
      <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${isDarkMode ? 'bg-cyan-500/10 text-cyan-300' : 'bg-blue-50 text-blue-600'}`}>
        <FolderKanban size={26} />
      </div>
      <h3 className={`mt-4 text-base font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>No forecast packages found</h3>
      <p className={`mt-1 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Try clearing filters or changing your search terms.</p>
    </div>
  );
}

export default function AdminForecastPackageReviewPage() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const controller = useProjectLibraryController({
    role: 'admin',
    title: 'Review Forecast Packages',
    description: 'Prioritize today\'s daily forecast package while keeping approved, rejected, published, and past packages available.',
  });
  const { user } = useCurrentDashboardUser(null, { roleOverride: 'Administrator' });
  const [view, setView] = useState('grid');
  const [reviewProject, setReviewProject] = useState(null);
  const [isStartingReview, setIsStartingReview] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');

  const {
    projects,
    loading,
    error,
    onRetry,
    onStartReview,
    onApprove,
    onReject,
    onPublish,
  } = controller.table;

  const forecastPackages = useMemo(() => groupForecastPackages(projects), [projects]);

  const handleOpenChart = async (project) => {
    setFeedbackError('');

    const projectId = getProjectId(project);
    if (!projectId) return;

    if (isProjectPublished(project?.status)) {
      navigate(`/forecasts/${projectId}`);
      return;
    }

    setIsStartingReview(true);
    try {
      const updatedProject = await onStartReview?.(project);
      setReviewProject(updatedProject || project);
    } catch (err) {
      console.error('Failed to start forecast package review:', err);
      setFeedbackError(err?.message || 'Failed to start forecast package review.');
    } finally {
      setIsStartingReview(false);
    }
  };

  const handleReviewActionComplete = async (updatedProject) => {
    if (updatedProject) {
      setReviewProject(updatedProject);
    }
    await onRetry?.();
  };

  return (
    <div className={`min-h-full transition-colors ${isDarkMode ? 'bg-[#0d1117]' : 'bg-slate-50'}`}>
      <div className="mx-auto max-w-[1400px] space-y-5 p-4 sm:space-y-6 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className={`text-sm font-black ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Review desk ready, {getWelcomeName(user)}.
          </p>
          <ViewToggle view={view} setView={setView} isDarkMode={isDarkMode} />
        </div>

        <AdminDailyPackageFocus
          isDarkMode={isDarkMode}
          projects={projects}
          setStatusFilter={controller.toolbar.setStatusFilter}
          total={forecastPackages.length}
        />

        {feedbackError && (
          <div className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${isDarkMode ? 'border-red-500/30 bg-red-950/30 text-red-300' : 'border-red-200 bg-red-50 text-red-700'}`} role="alert">
            <span className="inline-flex items-start gap-2">
              <AlertCircle className="mt-0.5 shrink-0" size={17} />
              {feedbackError}
            </span>
            <button
              type="button"
              className={`shrink-0 text-xs font-black uppercase tracking-wide ${isDarkMode ? 'text-red-200 hover:text-white' : 'text-red-700 hover:text-red-900'}`}
              onClick={() => setFeedbackError('')}
            >
              Dismiss
            </button>
          </div>
        )}

        <ProjectStats {...controller.stats} isDarkMode={isDarkMode} />
        <ProjectToolbar {...controller.toolbar} isDarkMode={isDarkMode} packageReviewMode />

        {loading && <GridState type="loading" isDarkMode={isDarkMode} />}
        {!loading && error && <GridState type="error" onRetry={onRetry} isDarkMode={isDarkMode} />}
        {!loading && !error && forecastPackages.length === 0 && <GridState type="empty" isDarkMode={isDarkMode} />}
        {!loading && !error && forecastPackages.length > 0 && (
          <div className={view === 'grid' ? 'grid gap-5 xl:grid-cols-2' : 'space-y-4'}>
            {forecastPackages.map((forecastPackage) => (
              <ForecastPackageCard
                key={forecastPackage.id}
                forecastPackage={forecastPackage}
                isDarkMode={isDarkMode}
                onOpenChart={handleOpenChart}
              />
            ))}
          </div>
        )}

        <ProjectPagination {...controller.pagination} isDarkMode={isDarkMode} />
      </div>

      {isStartingReview && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 text-sm font-bold text-white backdrop-blur-sm">
          Starting review…
        </div>
      )}

      <ProjectReviewModal
        project={getReviewModalProject(reviewProject)}
        isDarkMode={isDarkMode}
        onClose={() => setReviewProject(null)}
        onApprove={onApprove}
        onReject={onReject}
        onPublish={onPublish}
        onActionComplete={handleReviewActionComplete}
      />
    </div>
  );
}
