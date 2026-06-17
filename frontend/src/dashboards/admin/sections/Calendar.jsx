import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  Waves,
} from 'lucide-react';

import { fetchAdminProjects } from '@/api/projectAPI';
import { adaptProjects } from '@/features/projects/projectAdapter';
import { PROJECT_STATUS } from '@/features/projects/projectStatuses';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const EVENT_TYPES = [
  'Forecast',
  'Review',
  'Publication',
  'Maintenance',
  'Meeting',
];

const CUSTOM_EVENTS_STORAGE_KEY = 'adminCalendarCustomEvents';

const TYPE_META = {
  Forecast: {
    icon: Waves,
    dot: 'bg-cyan-500',
    light: 'border-cyan-200 bg-cyan-50/80 text-cyan-700',
    dark: 'border-cyan-300/20 bg-cyan-400/10 text-cyan-200',
  },
  Review: {
    icon: Clock3,
    dot: 'bg-amber-500',
    light: 'border-amber-200 bg-amber-50/80 text-amber-700',
    dark: 'border-amber-300/20 bg-amber-400/10 text-amber-200',
  },
  Publication: {
    icon: CheckCircle2,
    dot: 'bg-emerald-500',
    light: 'border-emerald-200 bg-emerald-50/80 text-emerald-700',
    dark: 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200',
  },
  Maintenance: {
    icon: RefreshCw,
    dot: 'bg-violet-500',
    light: 'border-violet-200 bg-violet-50/80 text-violet-700',
    dark: 'border-violet-300/20 bg-violet-400/10 text-violet-200',
  },
  Meeting: {
    icon: CalendarDays,
    dot: 'bg-blue-500',
    light: 'border-blue-200 bg-blue-50/80 text-blue-700',
    dark: 'border-blue-300/20 bg-blue-400/10 text-blue-200',
  },
};

function toIsoDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatDate(value, options = {}) {
  const date = parseDate(value);
  if (!date) return 'No date';

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: options.year ? 'numeric' : undefined,
  }).format(date);
}

function formatMonth(date) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function getEventTone(type, isDarkMode) {
  const meta = TYPE_META[type] || TYPE_META.Meeting;
  return isDarkMode ? meta.dark : meta.light;
}

function getProjectEvents(projects) {
  return projects.flatMap((project) => {
    const events = [];
    const projectId = project.id || project._id || project.title;

    if (project.forecastDate) {
      events.push({
        id: `${projectId}-forecast`,
        title: project.title,
        date: toIsoDate(project.forecastDate),
        owner: project.ownerDisplay || 'Forecast Team',
        type: 'Forecast',
        source: 'project',
        status: project.status,
      });
    }

    if ([PROJECT_STATUS.SUBMITTED, PROJECT_STATUS.UNDER_REVIEW, PROJECT_STATUS.REVISION_REQUESTED].includes(project.status)) {
      events.push({
        id: `${projectId}-review`,
        title: `Review: ${project.title}`,
        date: toIsoDate(project.submittedAt || project.updatedAt || project.createdAt),
        owner: 'Admin Review',
        type: 'Review',
        source: 'project',
        status: project.status,
      });
    }

    if ([PROJECT_STATUS.APPROVED, PROJECT_STATUS.PUBLISHED].includes(project.status)) {
      events.push({
        id: `${projectId}-publish`,
        title: project.status === PROJECT_STATUS.PUBLISHED ? `Published: ${project.title}` : `Ready to publish: ${project.title}`,
        date: toIsoDate(project.publishedAt || project.updatedAt || project.reviewedAt),
        owner: 'Publication',
        type: 'Publication',
        source: 'project',
        status: project.status,
      });
    }

    return events.filter((event) => event.date);
  });
}

function buildCalendarDays(monthDate, events) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const startDate = new Date(year, month, 1 - startDay);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    const iso = toIsoDate(date);

    return {
      iso,
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
      isToday: iso === toIsoDate(),
      events: events.filter((event) => event.date === iso),
    };
  });
}

function sortEvents(events) {
  return [...events].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.title.localeCompare(b.title);
  });
}

function loadCustomEvents() {
  if (typeof window === 'undefined') return [];

  try {
    const saved = window.localStorage.getItem(CUSTOM_EVENTS_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function CalendarSection({ isDarkMode }) {
  const today = useMemo(() => new Date(), []);
  const todayIso = useMemo(() => toIsoDate(today), [today]);
  const [monthDate, setMonthDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [customEvents, setCustomEvents] = useState(loadCustomEvents);
  const [draft, setDraft] = useState({
    title: '',
    owner: 'Admin Team',
    type: 'Review',
    date: todayIso,
  });
  const [state, setState] = useState({
    loading: true,
    refreshing: false,
    error: '',
    projects: [],
    totalProjects: 0,
    loadedAt: null,
  });

  const text = isDarkMode ? 'text-white' : 'text-slate-950';
  const muted = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const panel = isDarkMode
    ? 'border-white/10 bg-slate-950/50 shadow-black/20'
    : 'border-white/70 bg-white/70 shadow-slate-300/40';
  const softPanel = isDarkMode
    ? 'border-white/10 bg-white/[0.04]'
    : 'border-white/80 bg-white/65';
  const inputClass = isDarkMode
    ? 'border-white/10 bg-white/[0.04] text-slate-100 focus:border-cyan-300/30'
    : 'border-white/80 bg-white/70 text-slate-800 focus:border-cyan-200';

  const loadCalendar = useCallback(async ({ silent = false } = {}) => {
    setState((current) => ({
      ...current,
      loading: !silent && !current.loadedAt,
      refreshing: silent,
      error: '',
    }));

    try {
      const projectResponse = await fetchAdminProjects({
        page: 1,
        limit: 120,
        sortBy: 'updatedAt',
        sortDir: 'desc',
      });
      const projects = adaptProjects(projectResponse?.projects ?? []);

      setState({
        loading: false,
        refreshing: false,
        error: '',
        projects,
        totalProjects: projectResponse?.total ?? projects.length,
        loadedAt: new Date().toISOString(),
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        refreshing: false,
        error: error?.message || 'Failed to load calendar schedule.',
      }));
    }
  }, []);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CUSTOM_EVENTS_STORAGE_KEY, JSON.stringify(customEvents));
    }
  }, [customEvents]);

  const projectEvents = useMemo(() => getProjectEvents(state.projects), [state.projects]);
  const events = useMemo(() => sortEvents([...projectEvents, ...customEvents]), [customEvents, projectEvents]);
  const days = useMemo(() => buildCalendarDays(monthDate, events), [events, monthDate]);
  const selectedEvents = useMemo(
    () => events.filter((event) => event.date === selectedDate),
    [events, selectedDate],
  );
  const upcomingEvents = useMemo(
    () => events.filter((event) => event.date >= todayIso).slice(0, 8),
    [events, todayIso],
  );

  const monthEvents = useMemo(() => {
    const monthKey = toIsoDate(monthDate).slice(0, 7);
    return events.filter((event) => event.date.startsWith(monthKey));
  }, [events, monthDate]);

  const stats = useMemo(() => ({
    month: monthEvents.length,
    review: monthEvents.filter((event) => event.type === 'Review').length,
    publication: monthEvents.filter((event) => event.type === 'Publication').length,
    custom: customEvents.length,
  }), [customEvents.length, monthEvents]);

  const goToMonth = (offset) => {
    setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  const selectDay = (iso) => {
    setSelectedDate(iso);
    const date = new Date(iso);
    if (!Number.isNaN(date.getTime())) {
      setMonthDate(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  };

  const addEvent = () => {
    const title = draft.title.trim();
    if (!title || !draft.date) return;

    setCustomEvents((current) => [
      ...current,
      {
        id: `custom-${Date.now()}`,
        title,
        owner: draft.owner.trim() || 'Admin Team',
        type: draft.type,
        date: draft.date,
        source: 'custom',
      },
    ]);
    setSelectedDate(draft.date);
    setDraft((current) => ({ ...current, title: '' }));
  };

  const removeEvent = (eventId) => {
    setCustomEvents((current) => current.filter((event) => event.id !== eventId));
  };

  if (state.loading) {
    return (
      <div className="mx-auto max-w-[1500px] p-4 sm:p-6">
        <div className={cn('flex min-h-[440px] items-center justify-center rounded-2xl border shadow-xl backdrop-blur-xl', panel)}>
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className={cn('h-8 w-8 animate-spin', isDarkMode ? 'text-cyan-200' : 'text-cyan-700')} />
            <p className={cn('text-sm font-black', text)}>Loading operations calendar</p>
            <p className={cn('text-xs font-semibold', muted)}>Gathering forecast, review, and publication dates.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 p-4 sm:p-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={cn('text-sm font-black', text)}>Operations calendar</p>
          <p className={cn('mt-1 text-xs font-semibold', muted)}>
            {state.totalProjects} projects tracked. {customEvents.length} admin event{customEvents.length === 1 ? '' : 's'} added locally.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => selectDay(todayIso)}
            className={cn('min-h-10 rounded-xl border px-3 py-2 text-sm font-black shadow-sm backdrop-blur-xl transition-colors', isDarkMode ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white' : 'border-white/80 bg-white/70 text-slate-600 hover:bg-white hover:text-slate-950')}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => loadCalendar({ silent: true })}
            className={cn('inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-black shadow-sm backdrop-blur-xl transition-colors', isDarkMode ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white' : 'border-white/80 bg-white/70 text-slate-600 hover:bg-white hover:text-slate-950')}
          >
            <RefreshCw size={15} className={state.refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </section>

      {state.error && (
        <section className={cn('rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm backdrop-blur-xl', isDarkMode ? 'border-amber-300/20 bg-amber-400/10 text-amber-200' : 'border-amber-200 bg-amber-50/80 text-amber-800')}>
          {state.error}
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CalendarDays} label="Month Events" value={stats.month} helper={formatMonth(monthDate)} tone="cyan" isDarkMode={isDarkMode} />
        <StatCard icon={Clock3} label="Reviews" value={stats.review} helper="Submitted or under review" tone="amber" isDarkMode={isDarkMode} />
        <StatCard icon={CheckCircle2} label="Publications" value={stats.publication} helper="Approved or published dates" tone="emerald" isDarkMode={isDarkMode} />
        <StatCard icon={Plus} label="Admin Events" value={stats.custom} helper="Local calendar entries" tone="blue" isDarkMode={isDarkMode} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className={cn('rounded-2xl border p-4 shadow-xl backdrop-blur-xl', panel)}>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className={cn('text-base font-black', text)}>{formatMonth(monthDate)}</h2>
              <p className={cn('mt-1 text-sm font-semibold', muted)}>Forecast, review, publication, and admin-scheduled events.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goToMonth(-1)}
                className={cn('grid h-10 w-10 place-items-center rounded-xl border transition-colors', softPanel, isDarkMode ? 'text-slate-300 hover:bg-white/[0.08]' : 'text-slate-600 hover:bg-white')}
                aria-label="Previous month"
              >
                <ChevronLeft size={17} />
              </button>
              <button
                type="button"
                onClick={() => goToMonth(1)}
                className={cn('grid h-10 w-10 place-items-center rounded-xl border transition-colors', softPanel, isDarkMode ? 'text-slate-300 hover:bg-white/[0.08]' : 'text-slate-600 hover:bg-white')}
                aria-label="Next month"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 pb-2 text-xs font-black uppercase tracking-wide">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <p key={day} className={muted}>{day}</p>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map((day) => (
              <button
                key={day.iso}
                type="button"
                onClick={() => selectDay(day.iso)}
                className={cn(
                  'min-h-[112px] rounded-xl border p-2 text-left shadow-sm backdrop-blur-xl transition-colors',
                  day.iso === selectedDate
                    ? isDarkMode ? 'border-cyan-300/30 bg-cyan-400/10' : 'border-cyan-200 bg-cyan-50/80'
                    : softPanel,
                  !day.isCurrentMonth && 'opacity-45',
                  isDarkMode ? 'hover:bg-white/[0.07]' : 'hover:bg-white',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={cn('grid h-7 w-7 place-items-center rounded-lg text-xs font-black', day.isToday ? 'bg-cyan-600 text-white' : text)}>
                    {day.day}
                  </span>
                  {day.events.length > 0 && (
                    <span className={cn('text-[10px] font-black', muted)}>{day.events.length}</span>
                  )}
                </div>

                <div className="mt-2 space-y-1">
                  {day.events.slice(0, 2).map((event) => (
                    <div key={event.id} className={cn('truncate rounded-md border px-1.5 py-1 text-[10px] font-black', getEventTone(event.type, isDarkMode))}>
                      {event.title}
                    </div>
                  ))}
                  {day.events.length > 2 && (
                    <p className={cn('text-[10px] font-black', muted)}>+{day.events.length - 2} more</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <aside className="space-y-5">
          <div className={cn('rounded-2xl border p-4 shadow-xl backdrop-blur-xl', panel)}>
            <h3 className={cn('text-base font-black', text)}>Add Event</h3>
            <p className={cn('mt-1 text-xs font-semibold', muted)}>Add local admin schedule items for this browser session.</p>

            <div className="mt-4 space-y-3">
              <input
                value={draft.title}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                placeholder="Event title"
                className={cn('w-full rounded-xl border px-3 py-2 text-sm font-semibold outline-none backdrop-blur-xl', inputClass)}
              />
              <input
                value={draft.owner}
                onChange={(event) => setDraft((current) => ({ ...current, owner: event.target.value }))}
                placeholder="Owner"
                className={cn('w-full rounded-xl border px-3 py-2 text-sm font-semibold outline-none backdrop-blur-xl', inputClass)}
              />
              <input
                type="date"
                value={draft.date}
                onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))}
                className={cn('w-full rounded-xl border px-3 py-2 text-sm font-semibold outline-none backdrop-blur-xl', inputClass)}
              />
              <select
                value={draft.type}
                onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value }))}
                className={cn('w-full rounded-xl border px-3 py-2 text-sm font-semibold outline-none backdrop-blur-xl', inputClass)}
              >
                {EVENT_TYPES.map((type) => <option key={type}>{type}</option>)}
              </select>
              <button
                type="button"
                onClick={addEvent}
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-cyan-600/20 transition-colors hover:bg-cyan-500"
              >
                <Plus size={15} />
                Add to Calendar
              </button>
            </div>
          </div>

          <AgendaCard
            title={formatDate(selectedDate, { year: true })}
            description="Selected day"
            events={selectedEvents}
            isDarkMode={isDarkMode}
            onRemove={removeEvent}
          />
        </aside>
      </section>

      <AgendaCard
        title="Upcoming Schedule"
        description="Next forecast, review, publication, and admin events"
        events={upcomingEvents}
        isDarkMode={isDarkMode}
        onRemove={removeEvent}
      />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, helper, tone, isDarkMode }) {
  const toneClass = {
    blue: isDarkMode ? 'bg-blue-400/10 text-blue-200' : 'bg-blue-50/80 text-blue-700',
    cyan: isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-cyan-50/80 text-cyan-700',
    emerald: isDarkMode ? 'bg-emerald-400/10 text-emerald-200' : 'bg-emerald-50/80 text-emerald-700',
    amber: isDarkMode ? 'bg-amber-400/10 text-amber-200' : 'bg-amber-50/80 text-amber-700',
  }[tone];

  return (
    <div className={cn('rounded-2xl border p-4 shadow-xl backdrop-blur-xl', isDarkMode ? 'border-white/10 bg-slate-950/50 shadow-black/20' : 'border-white/70 bg-white/70 shadow-slate-300/40')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn('truncate text-xs font-black uppercase tracking-wide', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{label}</p>
          <p className={cn('mt-2 text-3xl font-black tabular-nums', isDarkMode ? 'text-white' : 'text-slate-950')}>{value}</p>
        </div>
        <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl', toneClass)}>
          <Icon size={21} />
        </span>
      </div>
      <p className={cn('mt-3 text-sm font-semibold', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{helper}</p>
    </div>
  );
}

function AgendaCard({ title, description, events, isDarkMode, onRemove }) {
  const text = isDarkMode ? 'text-white' : 'text-slate-950';
  const muted = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <section className={cn('rounded-2xl border p-4 shadow-xl backdrop-blur-xl', isDarkMode ? 'border-white/10 bg-slate-950/50 shadow-black/20' : 'border-white/70 bg-white/70 shadow-slate-300/40')}>
      <div className="mb-4">
        <h3 className={cn('text-base font-black', text)}>{title}</h3>
        <p className={cn('mt-1 text-sm font-semibold', muted)}>{description}</p>
      </div>

      {events.length === 0 ? (
        <div className={cn('rounded-xl border px-4 py-6 text-center', isDarkMode ? 'border-white/10 bg-white/[0.04]' : 'border-white/80 bg-white/65')}>
          <AlertTriangle className={cn('mx-auto h-6 w-6', isDarkMode ? 'text-slate-600' : 'text-slate-400')} />
          <p className={cn('mt-3 text-sm font-black', text)}>No scheduled events</p>
          <p className={cn('mt-1 text-xs font-semibold', muted)}>Add a local event or navigate to a project date.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => {
            const meta = TYPE_META[event.type] || TYPE_META.Meeting;
            const Icon = meta.icon;

            return (
              <div key={event.id} className={cn('flex items-start gap-3 rounded-xl border p-3', isDarkMode ? 'border-white/10 bg-white/[0.04]' : 'border-white/80 bg-white/65')}>
                <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl', getEventTone(event.type, isDarkMode))}>
                  <Icon size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn('truncate text-sm font-black', text)}>{event.title}</p>
                  <p className={cn('mt-1 text-xs font-semibold', muted)}>
                    {formatDate(event.date, { year: true })} - {event.owner} - {event.type}
                  </p>
                </div>
                {event.source === 'custom' && (
                  <button
                    type="button"
                    onClick={() => onRemove(event.id)}
                    className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors', isDarkMode ? 'text-slate-500 hover:bg-red-500/10 hover:text-red-300' : 'text-slate-400 hover:bg-red-50 hover:text-red-600')}
                    aria-label={`Remove ${event.title}`}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
