import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, FolderKanban } from 'lucide-react';

import { approveProject, publishProject, rejectProject, startReviewProject } from '@/api/projectAPI';
import { approveForecastPackage, fetchAdminForecastPackages, publishForecastPackage, startForecastPackageReview } from '@/api/forecastPackageAPI';
import Button from '@/components/ui/Button';
import { useTheme } from '@/app/providers/ThemeProvider';
import ForecastPackageCard from './ForecastPackageCard';
import ProjectReviewModal from '@/features/projects/components/ProjectReviewModal';
import AdminDailyPackageFocus from '@/features/projects/components/project-library/AdminDailyPackageFocus';
import ProjectPagination from '@/features/projects/components/project-library/ProjectPagination';
import ProjectToolbar from '@/features/projects/components/project-library/ProjectToolbar';
import ProjectStats from '@/features/projects/components/project-library/ProjectStats';
import { isProjectPublished } from '@/features/projects/projectStatuses';
import { adaptForecastPackageModel } from '@/features/projects/utils/forecastPackageGrouping';
import useCurrentDashboardUser from '@/shared/hooks/useCurrentDashboardUser';

const PAGE_SIZE = 12;
const PROJECT_APPROVED_STATUSES = ['Approved', 'Published'];
const PACKAGE_AUTO_APPROVE_STATUSES = ['Under Review', 'Revision Requested'];
const getId = (item) => item?._id || item?.id;

function getWelcomeName(user) {
  const name = String(user?.name || '').trim();
  if (!name || name.toLowerCase().startsWith('loading')) return 'Admin';
  return name.includes('@') ? name.split('@')[0] : name.split(' ')[0] || 'Admin';
}

function packageStats(packages, total) {
  const counts = packages.reduce((memo, item) => ({ ...memo, [item.status]: (memo[item.status] || 0) + 1 }), {});
  return [
    { value: total, label: 'Total Packages', helper: 'Matching package filters', tone: 'blue' },
    { value: counts.Submitted || 0, label: 'Submitted', helper: 'Awaiting admin review', tone: 'slate' },
    { value: counts['Under Review'] || 0, label: 'Under Review', helper: 'In the review desk', tone: 'amber' },
    { value: (counts.Rejected || 0) + (counts['Revision Requested'] || 0), label: 'Returned', helper: 'Rejected or revision requested', tone: 'amber' },
    { value: counts.Published || 0, label: 'Published', helper: 'Released forecast packages', tone: 'emerald' },
  ];
}

function filterPackages(packages, search, typeFilter) {
  const query = search.trim().toLowerCase();
  return packages.filter((forecastPackage) => {
    if (typeFilter !== 'All' && !forecastPackage.charts.some((chart) => chart.chartType === typeFilter)) return false;
    if (!query) return true;
    const haystack = [
      forecastPackage.title,
      forecastPackage.name,
      forecastPackage.ownerLabel,
      forecastPackage.dateKey,
      ...forecastPackage.charts.map((chart) => chart.project?.name || chart.project?.title || ''),
    ].join(' ').toLowerCase();
    return haystack.includes(query);
  });
}

function getPackageContainingProject(packages, projectId) {
  return packages.find((forecastPackage) => (
    forecastPackage.charts || []
  ).some((chart) => getId(chart.project) === projectId));
}

function mergeApprovedProjectIntoPackage(forecastPackage, updatedProject) {
  const updatedProjectId = getId(updatedProject);
  return {
    ...forecastPackage,
    charts: (forecastPackage?.charts || []).map((chart) => (
      getId(chart.project) === updatedProjectId
        ? { ...chart, project: { ...chart.project, ...updatedProject } }
        : chart
    )),
  };
}

function isPackageReadyForApproval(forecastPackage) {
  const charts = forecastPackage?.charts || [];
  return charts.length > 0 && charts.every((chart) => PROJECT_APPROVED_STATUSES.includes(chart.project?.status));
}

function StateCard({ children, isDarkMode }) {
  return (
    <div className={`rounded-2xl border p-12 text-center shadow-sm ${isDarkMode ? 'border-white/10 bg-slate-900/80 text-slate-200' : 'border-slate-200 bg-white text-slate-800'}`}>
      {children}
    </div>
  );
}

export default function AdminForecastPackageReviewPageV2() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { user } = useCurrentDashboardUser(null, { roleOverride: 'Administrator' });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [dateRangeFilter, setDateRangeFilter] = useState('All');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortDir, setSortDir] = useState('desc');
  const [reviewProject, setReviewProject] = useState(null);
  const [busyReview, setBusyReview] = useState(false);
  const [publishingPackageId, setPublishingPackageId] = useState(null);
  const [feedbackError, setFeedbackError] = useState('');

  const query = useQuery({
    queryKey: ['admin-forecast-packages', page, statusFilter],
    queryFn: ({ signal }) => fetchAdminForecastPackages({ page, limit: PAGE_SIZE, status: statusFilter, signal }),
    staleTime: 30000,
    keepPreviousData: true,
  });

  const packages = useMemo(() => (query.data?.packages || []).map(adaptForecastPackageModel), [query.data]);
  const visiblePackages = useMemo(() => filterPackages(packages, search, typeFilter), [packages, search, typeFilter]);
  const total = query.data?.total ?? visiblePackages.length;
  const totalPages = Math.max(1, query.data?.totalPages ?? 1);
  const activeFilterCount = [statusFilter !== 'All', typeFilter !== 'All', dateRangeFilter !== 'All'].filter(Boolean).length;

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setTypeFilter('All');
    setDateRangeFilter('All');
    setSortBy('updatedAt');
    setSortDir('desc');
    setPage(1);
  };

  const openChartForReview = async (project, forecastPackage) => {
    setFeedbackError('');
    const projectId = getId(project);
    if (!projectId) return;

    if (isProjectPublished(project?.status)) {
      navigate(`/forecasts/${projectId}`);
      return;
    }

    setBusyReview(true);
    try {
      if (forecastPackage?.status === 'Submitted') {
        await startForecastPackageReview(getId(forecastPackage));
      }

      const updatedProject = project?.status === 'Submitted'
        ? await startReviewProject(projectId)
        : project;

      setReviewProject({
        ...project,
        ...updatedProject,
        status: updatedProject?.status || (project.status === 'Submitted' ? 'Under Review' : project.status),
      });
      await query.refetch();
    } catch (error) {
      console.error('Failed to start forecast package review:', error);
      setFeedbackError(error?.message || 'Failed to start forecast package review.');
    } finally {
      setBusyReview(false);
    }
  };

  const publishPackage = async (forecastPackage) => {
    setFeedbackError('');
    const packageId = getId(forecastPackage);
    if (!packageId || forecastPackage?.status !== 'Approved') return;

    setPublishingPackageId(packageId);
    try {
      const publishableCharts = (forecastPackage.charts || [])
        .map((chart) => chart.project)
        .filter((project) => getId(project) && project?.status === 'Approved');

      await Promise.all(publishableCharts.map((project) => publishProject(getId(project))));
      await publishForecastPackage(packageId);
      await query.refetch();
    } catch (error) {
      console.error('Failed to publish forecast package:', error);
      setFeedbackError(error?.message || 'Failed to publish forecast package.');
    } finally {
      setPublishingPackageId(null);
    }
  };

  const approvePackageIfAllChartsApproved = async (updatedProject) => {
    const projectId = getId(updatedProject);
    if (!projectId || updatedProject?.status !== 'Approved') return;

    const matchingPackage = getPackageContainingProject(packages, projectId);
    if (!matchingPackage || !PACKAGE_AUTO_APPROVE_STATUSES.includes(matchingPackage.status)) return;

    const nextPackage = mergeApprovedProjectIntoPackage(matchingPackage, updatedProject);
    if (!isPackageReadyForApproval(nextPackage)) return;

    await approveForecastPackage(getId(matchingPackage));
  };

  const onActionComplete = async (updatedProject) => {
    if (updatedProject) {
      setReviewProject(updatedProject);
      await approvePackageIfAllChartsApproved(updatedProject);
    }
    await query.refetch();
  };

  return (
    <div className={`min-h-full transition-colors ${isDarkMode ? 'bg-[#0d1117]' : 'bg-slate-50'}`}>
      <div className="mx-auto max-w-[1400px] space-y-5 p-4 sm:space-y-6 sm:p-6">
        <p className={`text-sm font-black ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Review desk ready, {getWelcomeName(user)}.</p>
        <AdminDailyPackageFocus isDarkMode={isDarkMode} packages={packages} onOpenChart={openChartForReview} total={total} />
        {feedbackError && <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${isDarkMode ? 'border-red-500/30 bg-red-950/30 text-red-300' : 'border-red-200 bg-red-50 text-red-700'}`}><AlertCircle className="mr-2 inline" size={17} />{feedbackError}</div>}
        <ProjectStats stats={packageStats(packages, total)} isDarkMode={isDarkMode} />
        <ProjectToolbar role="admin" packageReviewMode isDarkMode={isDarkMode} search={search} setSearch={setSearch} statusFilter={statusFilter} setStatusFilter={(status) => { setStatusFilter(status); setPage(1); }} typeFilter={typeFilter} setTypeFilter={setTypeFilter} dateRangeFilter={dateRangeFilter} setDateRangeFilter={setDateRangeFilter} sortBy={sortBy} setSortBy={setSortBy} sortDir={sortDir} setSortDir={setSortDir} activeFilterCount={activeFilterCount} onClear={resetFilters} isFetching={query.isFetching} />
        {query.isLoading && <StateCard isDarkMode={isDarkMode}>Loading forecast packages...</StateCard>}
        {!query.isLoading && query.error && <StateCard isDarkMode={isDarkMode}><Button onClick={() => query.refetch()}>Retry loading packages</Button></StateCard>}
        {!query.isLoading && !query.error && visiblePackages.length === 0 && <StateCard isDarkMode={isDarkMode}><FolderKanban className="mx-auto mb-3" size={26} />No forecast packages found.</StateCard>}
        {!query.isLoading && !query.error && visiblePackages.length > 0 && <div className="grid gap-5 xl:grid-cols-2">{visiblePackages.map((forecastPackage) => <ForecastPackageCard key={forecastPackage.id} forecastPackage={forecastPackage} isDarkMode={isDarkMode} onOpenChart={openChartForReview} onPublishPackage={publishPackage} publishingPackageId={publishingPackageId} />)}</div>}
        <ProjectPagination page={page} total={total} totalPages={totalPages} pageSize={PAGE_SIZE} onPageChange={setPage} isDarkMode={isDarkMode} />
      </div>
      {busyReview && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 text-sm font-bold text-white backdrop-blur-sm">Starting review…</div>}
      <ProjectReviewModal project={reviewProject ? { ...reviewProject, reviewComment: undefined } : null} isDarkMode={isDarkMode} onClose={() => setReviewProject(null)} onApprove={(project) => approveProject(getId(project))} onReject={(project, remarks) => rejectProject(getId(project), remarks)} onPublish={(project) => publishProject(getId(project))} onActionComplete={onActionComplete} />
    </div>
  );
}
