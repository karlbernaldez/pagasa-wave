import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  Download,
  Eye,
  LayoutGrid,
  List,
  MapPin,
  Calendar,
  User,
} from 'lucide-react';
import { fetchAllProjectsForAdmin } from '@/api/projectAPI';
import MiniMapPreview from '@dashboards/admin/components/MiniMapPreview';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const formatOwner = (owner) => {
  if (!owner) return 'Project Owner';
  if (typeof owner === 'string') return owner;
  const fullName = `${owner.firstName ?? ''} ${owner.lastName ?? ''}`.trim();
  return fullName || owner.email || 'Project Owner';
};

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const normalizeProjects = (projects) =>
  (Array.isArray(projects) ? projects : []).map((project) => ({
    id: project._id,
    title: project.name || 'Untitled Project',
    owner: formatOwner(project.owner),
    chartType: project.chartType || 'N/A',
    forecastDate: project.forecastDate,
    createdAt: project.createdAt,
    status: 'Pending',
  }));

// ─────────────────────────────────────────────
// Bootstrap cache
// ─────────────────────────────────────────────
let adminProjectsBootstrapCache = null;
let adminProjectsBootstrapPromise = null;

const getBootstrappedAdminProjects = async () => {
  if (adminProjectsBootstrapCache) return adminProjectsBootstrapCache;

  if (!adminProjectsBootstrapPromise) {
    adminProjectsBootstrapPromise = fetchAllProjectsForAdmin()
      .then(normalizeProjects)
      .then((data) => {
        adminProjectsBootstrapCache = data;
        return data;
      })
      .finally(() => {
        adminProjectsBootstrapPromise = null;
      });
  }

  return adminProjectsBootstrapPromise;
};

// ─────────────────────────────────────────────
// Status pill
// ─────────────────────────────────────────────
const StatusPill = ({ status, isDarkMode }) => {
  const isPending = status === 'Pending';
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full tracking-wide uppercase ${
        isPending
          ? isDarkMode
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            : 'bg-amber-100 text-amber-700 border border-amber-200'
          : isDarkMode
          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full animate-pulse ${
          isPending ? 'bg-amber-400' : 'bg-emerald-400'
        }`}
      />
      {status}
    </span>
  );
};

// ─────────────────────────────────────────────
// Project Card
// ─────────────────────────────────────────────
const ProjectCard = ({ chart, isDarkMode }) => {
  const isPending = chart.status === 'Pending';

  return (
    <article
      className={`group rounded-2xl overflow-hidden border transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 ${
        isDarkMode
          ? 'bg-gray-800/60 border-gray-700/60 hover:border-gray-600/80 shadow-black/30'
          : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
      }`}
    >
      {/* ── Map area with overlaid status badge ── */}
      <div className="relative">
        <MiniMapPreview projectId={chart.id} isDarkMode={isDarkMode} />

        {/* Status badge — overlaid top-right on the map */}
        <div className="absolute top-3 right-3 z-10">
          <StatusPill status={chart.status} isDarkMode={isDarkMode} />
        </div>

        {/* Chart type chip — overlaid bottom-left on the map */}
        <div className="absolute bottom-3 left-3 z-10">
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md backdrop-blur-sm ${
              isDarkMode
                ? 'bg-gray-900/70 text-gray-300 border border-gray-700/60'
                : 'bg-white/80 text-gray-600 border border-gray-200/80'
            }`}
          >
            <MapPin size={10} />
            {chart.chartType}
          </span>
        </div>
      </div>

      {/* ── Card body ── */}
      <div className="p-5 space-y-4">
        {/* Title */}
        <h3
          className={`text-base font-bold leading-snug truncate ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}
        >
          {chart.title}
        </h3>

        {/* Meta rows */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <User
              size={12}
              className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}
            />
            <span
              className={`text-sm truncate ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              {chart.owner}
            </span>
          </div>

          {chart.forecastDate && (
            <div className="flex items-center gap-2">
              <Calendar
                size={12}
                className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}
              />
              <span
                className={`text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                Forecast: {formatDate(chart.forecastDate)}
              </span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div
          className={`h-px ${isDarkMode ? 'bg-gray-700/60' : 'bg-gray-100'}`}
        />

        {/* Action buttons */}
        {isPending ? (
          <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white rounded-xl py-2.5 text-sm font-semibold transition-all duration-150 shadow-sm shadow-emerald-500/30">
              <Check size={15} />
              Approve
            </button>
            <button
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold border transition-all duration-150 active:scale-95 ${
                isDarkMode
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <AlertCircle size={15} />
              Revise
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 active:scale-95 text-white rounded-xl py-2.5 text-sm font-semibold transition-all duration-150 shadow-sm shadow-blue-500/30">
              <Eye size={15} />
              View
            </button>
            <button
              className={`px-3.5 rounded-xl border transition-all duration-150 active:scale-95 ${
                isDarkMode
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Download size={15} />
            </button>
          </div>
        )}
      </div>
    </article>
  );
};

// ─────────────────────────────────────────────
// List Row
// ─────────────────────────────────────────────
const ListRow = ({ chart, isDarkMode }) => {
  const isPending = chart.status === 'Pending';
  return (
    <div
      className={`flex items-center justify-between gap-4 px-5 py-4 border-b last:border-b-0 transition-colors duration-150 ${
        isDarkMode
          ? 'border-gray-700/60 hover:bg-gray-700/30'
          : 'border-gray-100 hover:bg-gray-50'
      }`}
    >
      <div className="min-w-0">
        <p
          className={`font-semibold truncate ${
            isDarkMode ? 'text-gray-100' : 'text-gray-900'
          }`}
        >
          {chart.title}
        </p>
        <div className="flex items-center gap-3 mt-0.5">
          <span
            className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            {chart.owner}
          </span>
          <span
            className={`text-xs px-1.5 py-0.5 rounded ${
              isDarkMode
                ? 'bg-gray-700 text-gray-400'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {chart.chartType}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <StatusPill status={chart.status} isDarkMode={isDarkMode} />
        <button
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

// ─────────────────────────────────────────────
// Main Section
// ─────────────────────────────────────────────
const ChartReviewSection = ({ isDarkMode }) => {
  const [viewType, setViewType] = useState('cards');
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadProjects = async () => {
      setIsLoading(true);
      setError('');

      try {
        const data = await getBootstrappedAdminProjects();
        if (!isMounted) return;
        setProjects(data);
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || 'Unable to load projects.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadProjects();
    return () => { isMounted = false; };
  }, []);

  const charts = useMemo(() => projects, [projects]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3
            className={`text-2xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            Chart Review
          </h3>
          {!isLoading && !error && (
            <p
              className={`text-sm mt-0.5 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              {charts.length} project{charts.length !== 1 ? 's' : ''} pending review
            </p>
          )}
        </div>

        {/* View toggle */}
        <div
          className={`inline-flex rounded-xl border p-1 ${
            isDarkMode
              ? 'border-gray-700 bg-gray-800/60'
              : 'border-gray-200 bg-white'
          }`}
        >
          {[
            { id: 'cards', icon: LayoutGrid, label: 'Cards' },
            { id: 'list', icon: List, label: 'List' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setViewType(id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold inline-flex items-center gap-2 transition-all duration-150 ${
                viewType === id
                  ? 'bg-blue-500 text-white shadow-sm'
                  : isDarkMode
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div
          className={`rounded-2xl border p-8 text-sm text-center ${
            isDarkMode
              ? 'bg-gray-800/50 border-gray-700/50 text-gray-400'
              : 'bg-white border-gray-200 text-gray-500'
          }`}
        >
          <div className="inline-block w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p>Loading projects…</p>
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div
          className={`rounded-2xl border p-6 text-sm flex items-center gap-3 ${
            isDarkMode
              ? 'bg-red-900/20 border-red-800/40 text-red-300'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && charts.length === 0 && (
        <div
          className={`rounded-2xl border p-8 text-sm text-center ${
            isDarkMode
              ? 'bg-gray-800/50 border-gray-700/50 text-gray-400'
              : 'bg-white border-gray-200 text-gray-500'
          }`}
        >
          No projects found.
        </div>
      )}

      {/* Cards grid */}
      {!isLoading && !error && charts.length > 0 && viewType === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {charts.map((chart) => (
            <ProjectCard key={chart.id} chart={chart} isDarkMode={isDarkMode} />
          ))}
        </div>
      )}

      {/* List view */}
      {!isLoading && !error && charts.length > 0 && viewType === 'list' && (
        <div
          className={`rounded-2xl border overflow-hidden ${
            isDarkMode
              ? 'bg-gray-800/50 border-gray-700/50'
              : 'bg-white border-gray-200'
          }`}
        >
          {charts.map((chart) => (
            <ListRow key={chart.id} chart={chart} isDarkMode={isDarkMode} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ChartReviewSection;