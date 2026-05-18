import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ExternalLink, FileText, Search, Waves } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import Button from '@/components/ui/Button';
import { fetchPublicPublishedForecasts } from '@/api/publishedForecastAPI';
import { useTheme } from '@/app/providers/ThemeProvider';

function formatDate(value, options = {}) {
  if (!value) return '—';

  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      ...options,
    }).format(new Date(value));
  } catch {
    return '—';
  }
}

function getPersonName(person, fallback = 'DOST PAGASA') {
  if (!person) return fallback;
  if (typeof person === 'string') return person;
  const fullName = [person.firstName, person.lastName].filter(Boolean).join(' ').trim();
  return fullName || person.username || fallback;
}

function getChartTypeLabel(value) {
  const labels = {
    analysis: 'Analysis',
    forecast_24h: '24-Hour Chart',
    forecast_36h: '36-Hour Chart',
    forecast_48h: '48-Hour Chart',
  };

  return labels[value] || value || 'Wave Chart';
}

function ChartCard({ chart, isDarkMode, onOpen }) {
  return (
    <article className={`group rounded-3xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${isDarkMode ? 'border-white/10 bg-slate-900/80 hover:border-cyan-400/30' : 'border-slate-200 bg-white hover:border-blue-200'}`}>
      <div className="flex items-start justify-between gap-3">
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black ${isDarkMode ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          Published
        </span>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-blue-50 text-blue-700'}`}>
          {getChartTypeLabel(chart.chartType)}
        </span>
      </div>

      <h2 className={`mt-4 line-clamp-2 text-xl font-black leading-tight ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
        {chart.name}
      </h2>
      <p className={`mt-2 line-clamp-2 text-sm font-semibold leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
        {chart.description || 'Published marine wave chart from WaveLab.'}
      </p>

      <dl className="mt-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div className={`rounded-2xl p-3 ${isDarkMode ? 'bg-slate-950/70' : 'bg-slate-50'}`}>
          <dt className={`flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            <CalendarDays size={13} /> Valid Date
          </dt>
          <dd className={`mt-1 font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{formatDate(chart.forecastDate)}</dd>
        </div>
        <div className={`rounded-2xl p-3 ${isDarkMode ? 'bg-slate-950/70' : 'bg-slate-50'}`}>
          <dt className={`flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            <FileText size={13} /> Published
          </dt>
          <dd className={`mt-1 font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{formatDate(chart.publishedAt)}</dd>
        </div>
      </dl>

      <div className={`mt-5 flex items-center justify-between border-t pt-4 ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
        <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
          By {getPersonName(chart.owner)}
        </p>
        <Button size="sm" icon={ExternalLink} onClick={() => onOpen(chart)}>
          View Chart
        </Button>
      </div>
    </article>
  );
}

export default function PublicForecastsPage() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [state, setState] = useState({ loading: true, error: '', data: null });

  useEffect(() => {
    const controller = new AbortController();

    async function loadCharts() {
      setState((current) => ({ ...current, loading: true, error: '' }));
      try {
        const data = await fetchPublicPublishedForecasts({ search: submittedQuery, limit: 24, signal: controller.signal });
        setState({ loading: false, error: '', data });
      } catch (error) {
        if (error.name === 'AbortError') return;
        setState({ loading: false, error: error?.message || 'Failed to load wave charts.', data: null });
      }
    }

    loadCharts();
    return () => controller.abort();
  }, [submittedQuery]);

  const charts = useMemo(() => state.data?.projects || [], [state.data]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmittedQuery(query.trim());
  };

  const pageClass = isDarkMode
    ? 'min-h-screen bg-slate-950 pt-28 text-slate-100'
    : 'min-h-screen bg-slate-50 pt-28 text-slate-950';

  return (
    <main className={pageClass}>
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className={`mx-auto mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black ${isDarkMode ? 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
            <Waves size={16} /> Published Wave Charts
          </div>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Wave Charts</h1>
          <p className={`mt-4 text-base font-semibold leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            View finalized WaveLab marine charts published by DOST-PAGASA forecasters.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row">
          <div className={`flex min-w-0 flex-1 items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm ${isDarkMode ? 'border-white/10 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <Search size={18} className={isDarkMode ? 'text-slate-500' : 'text-slate-400'} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search wave charts, chart type, or description"
              className={`min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}
            />
          </div>
          <Button type="submit" className="sm:w-32">Search</Button>
        </form>

        {state.loading && (
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className={`h-64 animate-pulse rounded-3xl border ${isDarkMode ? 'border-white/10 bg-slate-900' : 'border-slate-200 bg-white'}`} />
            ))}
          </div>
        )}

        {!state.loading && state.error && (
          <div className={`mx-auto mt-10 max-w-2xl rounded-3xl border p-6 text-center text-sm font-bold ${isDarkMode ? 'border-red-400/20 bg-red-400/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700'}`}>
            {state.error}
          </div>
        )}

        {!state.loading && !state.error && charts.length === 0 && (
          <div className={`mx-auto mt-10 max-w-2xl rounded-3xl border p-10 text-center ${isDarkMode ? 'border-white/10 bg-slate-900 text-slate-400' : 'border-slate-200 bg-white text-slate-600'}`}>
            <p className="text-lg font-black">No wave charts found</p>
            <p className="mt-2 text-sm font-semibold">Published wave charts will appear here after Admin publishes approved outputs.</p>
          </div>
        )}

        {!state.loading && !state.error && charts.length > 0 && (
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {charts.map((chart) => (
              <ChartCard
                key={chart._id}
                chart={chart}
                isDarkMode={isDarkMode}
                onOpen={(item) => navigate(`/wave-charts/${item._id}`)}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
