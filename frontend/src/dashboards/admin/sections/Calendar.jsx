import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Waves,
} from 'lucide-react';

import { checkAuthSession } from '@/api/auth';
import {
  createCalendarEvent,
  deleteCalendarEvent,
  fetchCalendarEvents,
  updateCalendarEvent,
} from '@/api/calendarAPI';
import { fetchAdminForecastPackages } from '@/api/forecastPackageAPI';
import { getSettings } from '@/api/siteSettings';
import { DEFAULT_OPERATIONS } from '@/dashboards/admin/sections/settings/constants/defaults';
import {
  adaptForecastPackageModel,
  formatPackageDate,
  getDateKey,
  isDailyForecastPackage,
} from '@/features/projects/utils/forecastPackageGrouping';
import {
  buildPackageEvents,
  normalizeManualEvents,
  sortCalendarEvents,
} from './calendar/calendarEvents';

const cn = (...classes) => classes.filter(Boolean).join(' ');
const EVENT_TYPES = ['Meeting', 'Maintenance', 'Training', 'Reminder', 'Deployment', 'Other'];
const FILTERS = [
  'All',
  'Package',
  'Review',
  'Publication',
  'Returned',
  'Meeting',
  'Maintenance',
];
const REVIEW_STATUSES = new Set(['Submitted', 'Under Review', 'Needs Review']);
const RETURNED_STATUSES = new Set(['Rejected', 'Revision Requested', 'Returned']);

const TYPE_META = {
  Package: {
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
  Returned: {
    icon: AlertTriangle,
    dot: 'bg-rose-500',
    light: 'border-rose-200 bg-rose-50/80 text-rose-700',
    dark: 'border-rose-300/20 bg-rose-400/10 text-rose-200',
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
  Training: {
    icon: CalendarDays,
    dot: 'bg-indigo-500',
    light: 'border-indigo-200 bg-indigo-50/80 text-indigo-700',
    dark: 'border-indigo-300/20 bg-indigo-400/10 text-indigo-200',
  },
  Reminder: {
    icon: Clock3,
    dot: 'bg-slate-500',
    light: 'border-slate-200 bg-slate-50 text-slate-700',
    dark: 'border-white/10 bg-white/[0.04] text-slate-300',
  },
  Deployment: {
    icon: RefreshCw,
    dot: 'bg-purple-500',
    light: 'border-purple-200 bg-purple-50 text-purple-700',
    dark: 'border-purple-300/20 bg-purple-400/10 text-purple-200',
  },
  Other: {
    icon: CalendarDays,
    dot: 'bg-slate-400',
    light: 'border-slate-200 bg-slate-50 text-slate-700',
    dark: 'border-white/10 bg-white/[0.04] text-slate-300',
  },
};

const STATUS_LABELS = {
  Submitted: 'Awaiting review',
  'Under Review': 'In review',
  'Needs Review': 'Needs review',
  Returned: 'Returned',
  'Revision Requested': 'Revision requested',
  Rejected: 'Rejected',
  Approved: 'Ready to publish',
  Published: 'Published',
};

function toIsoDate(value = new Date()) {
  const key = getDateKey(value);
  if (key) return key;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00+08:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatDate(value) {
  if (!value) return 'No date';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return formatPackageDate(value);
  const key = toIsoDate(value);
  return key ? formatPackageDate(key) : 'No date';
}

function formatShortDate(value) {
  const date = parseDate(value);
  if (!date) return 'No date';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Manila',
  }).format(date);
}

function formatTime(value, allDay = false) {
  if (allDay || !value) return 'All day';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Manila',
  }).format(date);
}

function formatMonth(date) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Manila',
  }).format(date);
}

function getEventTone(type, isDarkMode) {
  const meta = TYPE_META[type] || TYPE_META.Meeting;
  return isDarkMode ? meta.dark : meta.light;
}

function getPackageAction(forecastPackage) {
  if (REVIEW_STATUSES.has(forecastPackage.status)) return 'Admin review needed';
  if (RETURNED_STATUSES.has(forecastPackage.status)) return 'Forecaster revision needed';
  if (forecastPackage.status === 'Approved') return 'Ready for publication';
  if (forecastPackage.status === 'Published') return 'Daily package published';
  return 'Track package progress';
}

function isEventVisible(event, filter) {
  if (filter === 'All') return true;
  return event.type === filter;
}

function buildCalendarDays(monthDate, events) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const startDate = new Date(year, month, 1 - startDay);
  const todayIso = toIsoDate();

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    const iso = toIsoDate(date);

    return {
      iso,
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
      isToday: iso === todayIso,
      events: events.filter((event) => event.date === iso),
    };
  });
}

function getMonthStats(days) {
  const monthEvents = days.flatMap((day) => (day.isCurrentMonth ? day.events : []));
  return {
    total: monthEvents.length,
    reviews: monthEvents.filter((event) => event.type === 'Review').length,
    publications: monthEvents.filter((event) => event.type === 'Publication').length,
    returned: monthEvents.filter((event) => event.type === 'Returned').length,
    scheduled: monthEvents.filter((event) => event.timing === 'scheduled').length,
    actual: monthEvents.filter((event) => event.timing === 'actual').length,
  };
}

export default function CalendarSection({ isDarkMode }) {
  const navigate = useNavigate();
  const today = useMemo(() => new Date(), []);
  const todayIso = useMemo(() => toIsoDate(today), [today]);
  const [monthDate, setMonthDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [activeFilter, setActiveFilter] = useState('All');
  const [timingFilter, setTimingFilter] = useState('All');
  const [permissions, setPermissions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    id: null,
    title: '',
    owner: 'WaveLab Team',
    type: 'Meeting',
    date: todayIso,
    time: '09:00',
    endTime: '10:00',
    allDay: false,
  });
  const [state, setState] = useState({
    loading: true,
    refreshing: false,
    error: '',
    packages: [],
    manualEvents: [],
    operations: DEFAULT_OPERATIONS,
    loadedAt: null,
  });

  const text = isDarkMode ? 'text-white' : 'text-slate-950';
  const muted = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const panel = isDarkMode
    ? 'border-white/10 bg-slate-950/50 shadow-black/20'
    : 'border-white/70 bg-white/70 shadow-slate-300/40';
  const softPanel = isDarkMode ? 'border-white/10 bg-white/[0.04]' : 'border-white/80 bg-white/65';
  const inputClass = isDarkMode
    ? 'border-white/10 bg-white/[0.04] text-slate-100 focus:border-cyan-300/30'
    : 'border-white/80 bg-white/70 text-slate-800 focus:border-cyan-200';

  const permissionSet = useMemo(() => new Set(permissions), [permissions]);
  const canCreate = permissionSet.has('calendar.create');
  const canEdit = permissionSet.has('calendar.edit');
  const canDelete = permissionSet.has('calendar.delete');

  const monthWindow = useMemo(() => {
    const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
    return { start, end };
  }, [monthDate]);

  const loadCalendar = useCallback(
    async ({ silent = false } = {}) => {
      setState((current) => ({
        ...current,
        loading: !silent && !current.loadedAt,
        refreshing: silent,
        error: '',
      }));

      try {
        const [packageResponse, calendarResponse, operations, auth] = await Promise.all([
          fetchAdminForecastPackages({ page: 1, limit: 120 }),
          fetchCalendarEvents({
            start: monthWindow.start.toISOString(),
            end: monthWindow.end.toISOString(),
          }),
          getSettings('operations').catch(() => ({})),
          checkAuthSession(),
        ]);
        const packages = (packageResponse?.packages ?? []).map(adaptForecastPackageModel);
        setPermissions(auth?.user?.permissions || []);
        setState({
          loading: false,
          refreshing: false,
          error: '',
          packages,
          manualEvents: calendarResponse?.events || [],
          operations: { ...DEFAULT_OPERATIONS, ...(operations || {}) },
          loadedAt: new Date().toISOString(),
        });
      } catch (error) {
        setState((current) => ({
          ...current,
          loading: false,
          refreshing: false,
          error: error?.message || 'Failed to load operational calendar.',
        }));
      }
    },
    [monthWindow.end, monthWindow.start]
  );

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  const packageEvents = useMemo(() => buildPackageEvents(state.packages), [state.packages]);
  const manualEvents = useMemo(
    () => normalizeManualEvents(state.manualEvents),
    [state.manualEvents]
  );
  const allEvents = useMemo(
    () => sortCalendarEvents([...packageEvents, ...manualEvents]),
    [manualEvents, packageEvents]
  );
  const visibleEvents = useMemo(
    () =>
      allEvents.filter((event) => {
        const visibleByType = isEventVisible(event, activeFilter);
        const visibleByTiming =
          timingFilter === 'All' || event.timing === timingFilter.toLowerCase();
        return visibleByType && visibleByTiming;
      }),
    [activeFilter, allEvents, timingFilter]
  );
  const calendarDays = useMemo(
    () => buildCalendarDays(monthDate, visibleEvents),
    [visibleEvents, monthDate]
  );
  const selectedEvents = useMemo(
    () => visibleEvents.filter((event) => event.date === selectedDate),
    [selectedDate, visibleEvents]
  );
  const upcomingEvents = useMemo(
    () => visibleEvents.filter((event) => event.date >= todayIso).slice(0, 10),
    [todayIso, visibleEvents]
  );
  const todayPackage = useMemo(() => state.packages.find(isDailyForecastPackage), [state.packages]);
  const monthStats = useMemo(() => getMonthStats(calendarDays), [calendarDays]);
  const selectedDateLabel = useMemo(() => formatDate(selectedDate), [selectedDate]);

  const changeMonth = (direction) =>
    setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));

  const goToToday = () => {
    setSelectedDate(todayIso);
    setMonthDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const saveSharedEvent = async (event) => {
    event.preventDefault();
    if (!draft.title.trim() || !draft.date || !draft.time) return;
    setSaving(true);
    try {
      const payload = {
        title: draft.title.trim(),
        type: draft.type.toLowerCase(),
        startsAt: draft.allDay
          ? `${draft.date}T00:00:00+08:00`
          : `${draft.date}T${draft.time}:00+08:00`,
        endsAt: draft.allDay
          ? `${draft.date}T23:59:59+08:00`
          : `${draft.date}T${draft.endTime}:00+08:00`,
        allDay: draft.allDay,
        ownerLabel: draft.owner.trim(),
      };
      if (draft.id) await updateCalendarEvent(draft.id, payload);
      else await createCalendarEvent(payload);
      setDraft({
        id: null,
        title: '',
        owner: 'WaveLab Team',
        type: 'Meeting',
        date: selectedDate || todayIso,
        time: '09:00',
        endTime: '10:00',
        allDay: false,
      });
      await loadCalendar({ silent: true });
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error?.message || 'Failed to save shared calendar event.',
      }));
    } finally {
      setSaving(false);
    }
  };

  const editSharedEvent = (event) => {
    const formatEventTime = (value, fallback) =>
      value
        ? new Intl.DateTimeFormat('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'Asia/Manila',
          }).format(new Date(value))
        : fallback;
    setDraft({
      id: event.id,
      title: event.title || '',
      owner: event.ownerLabel || event.owner || 'WaveLab Team',
      type: event.type || 'Meeting',
      date: event.date || selectedDate,
      time: formatEventTime(event.startsAt, '09:00'),
      endTime: formatEventTime(event.endsAt, '10:00'),
      allDay: Boolean(event.allDay),
    });
  };

  const removeSharedEvent = async (id) => {
    if (!canDelete) return;
    setSaving(true);
    try {
      await deleteCalendarEvent(id);
      if (draft.id === id) {
        setDraft({
          id: null,
          title: '',
          owner: 'WaveLab Team',
          type: 'Meeting',
          date: selectedDate || todayIso,
          time: '09:00',
        });
      }
      await loadCalendar({ silent: true });
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error?.message || 'Failed to delete shared calendar event.',
      }));
    } finally {
      setSaving(false);
    }
  };

  const openEvent = (event) => {
    if (event.href) navigate(event.href);
  };
  if (state.loading) {
    return (
      <div className="mx-auto max-w-[1500px] p-4 sm:p-6">
        <div
          className={cn(
            'flex min-h-[440px] items-center justify-center rounded-2xl border shadow-xl backdrop-blur-xl',
            panel
          )}
        >
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2
              className={cn('h-8 w-8 animate-spin', isDarkMode ? 'text-cyan-200' : 'text-cyan-700')}
            />
            <p className={cn('text-sm font-black', text)}>Loading operations calendar</p>
            <p className={cn('text-xs font-semibold', muted)}>
              Loading Forecast Package history, shared operational events, and Operations settings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 p-4 sm:p-6">
      <section
        className={cn('overflow-hidden rounded-3xl border p-5 shadow-xl backdrop-blur-xl', panel)}
      >
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <p
              className={cn(
                'text-xs font-black uppercase tracking-[0.2em]',
                isDarkMode ? 'text-cyan-200' : 'text-cyan-700'
              )}
            >
              Forecast operations calendar
            </p>
            <h1 className={cn('mt-2 text-2xl font-black tracking-tight sm:text-3xl', text)}>
              Daily package schedule, decisions, and publication readiness
            </h1>
            <p className={cn('mt-2 max-w-3xl text-sm font-semibold leading-6', muted)}>
              Calendar entries focus on actual Forecast Package workflow history and shared
              date-specific operational events. The recurring daily operating schedule stays visible
              as a compact reference instead of repeating on every calendar day.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={goToToday}
              className={cn(
                'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-black shadow-sm transition-colors',
                softPanel
              )}
            >
              <CalendarDays size={15} /> Today
            </button>
            <button
              type="button"
              onClick={() => loadCalendar({ silent: true })}
              className={cn(
                'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-black shadow-sm transition-colors',
                softPanel
              )}
            >
              <RefreshCw size={15} className={state.refreshing ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        <div className={cn('mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border px-4 py-3', softPanel)}>
          <span className={cn('text-xs font-black uppercase tracking-wide', muted)}>
            Daily Operations
          </span>
          <span className={cn('text-xs font-semibold', text)}>
            Open {state.operations.packageOpenTime || DEFAULT_OPERATIONS.packageOpenTime}
          </span>
          <span className={cn('text-xs font-semibold', text)}>
            Submit {state.operations.packageSubmissionDeadline || DEFAULT_OPERATIONS.packageSubmissionDeadline}
          </span>
          <span className={cn('text-xs font-semibold', text)}>
            Publish {state.operations.packagePublishTarget || DEFAULT_OPERATIONS.packagePublishTarget}
          </span>
          <span className={cn('text-xs font-semibold', text)}>
            Cutoff {state.operations.noPublicationCutoff || DEFAULT_OPERATIONS.noPublicationCutoff}
          </span>
          <span className={cn('text-[11px] font-semibold', muted)}>Asia/Manila</span>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.65fr)]">
          <div className={cn('rounded-2xl border p-4', softPanel)}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={cn('text-xs font-black uppercase tracking-wide', muted)}>
                  Today package
                </p>
                <p className={cn('mt-1 text-xl font-black', text)}>
                  {todayPackage?.status || 'No submitted package today'}
                </p>
              </div>
              <span
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-black',
                  getEventTone(
                    todayPackage?.status === 'Published' || todayPackage?.status === 'Approved'
                      ? 'Publication'
                      : todayPackage
                        ? 'Review'
                        : 'Returned',
                    isDarkMode
                  )
                )}
              >
                {todayPackage
                  ? STATUS_LABELS[todayPackage.status] || todayPackage.status
                  : 'Missing'}
              </span>
            </div>
            <p className={cn('mt-3 text-sm font-semibold leading-6', muted)}>
              {todayPackage
                ? `${todayPackage.chartCount || 0} of 4 charts linked. ${getPackageAction(todayPackage)}.`
                : 'No reviewable daily package is linked to today yet.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="Shared events" value={monthStats.scheduled} isDarkMode={isDarkMode} />
            <MiniStat label="Workflow events" value={monthStats.actual} isDarkMode={isDarkMode} />
            <MiniStat label="Reviews" value={monthStats.reviews} isDarkMode={isDarkMode} />
            <MiniStat
              label="Publications"
              value={monthStats.publications}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
      </section>

      {state.error && (
        <section
          className={cn(
            'rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm backdrop-blur-xl',
            isDarkMode
              ? 'border-amber-300/20 bg-amber-400/10 text-amber-200'
              : 'border-amber-200 bg-amber-50/80 text-amber-800'
          )}
        >
          {state.error}
        </section>
      )}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(23rem,0.75fr)]">
        <div className={cn('rounded-2xl border p-4 shadow-xl backdrop-blur-xl', panel)}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center justify-between gap-3 lg:justify-start">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                aria-label="Previous month"
                className={cn(
                  'grid h-10 w-10 place-items-center rounded-xl border transition-colors',
                  softPanel
                )}
              >
                <ChevronLeft size={18} />
              </button>
              <div className="min-w-44 text-center lg:text-left">
                <h2 className={cn('text-lg font-black', text)}>{formatMonth(monthDate)}</h2>
                <p className={cn('text-xs font-semibold', muted)}>
                  {monthStats.total} visible event{monthStats.total === 1 ? '' : 's'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => changeMonth(1)}
                aria-label="Next month"
                className={cn(
                  'grid h-10 w-10 place-items-center rounded-xl border transition-colors',
                  softPanel
                )}
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {FILTERS.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-black transition-colors',
                    activeFilter === filter
                      ? isDarkMode
                        ? 'border-cyan-300/40 bg-cyan-400/15 text-cyan-100'
                        : 'border-cyan-200 bg-cyan-50 text-cyan-700'
                      : isDarkMode
                        ? 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-white'
                        : 'border-white/80 bg-white/60 text-slate-500 hover:text-slate-900'
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={cn('text-xs font-black uppercase tracking-wide', muted)}>Timing</span>
            {['All', 'Scheduled', 'Actual'].map((timing) => (
              <button
                key={timing}
                type="button"
                onClick={() => setTimingFilter(timing)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-black transition-colors',
                  timingFilter === timing
                    ? isDarkMode
                      ? 'border-cyan-300/40 bg-cyan-400/15 text-cyan-100'
                      : 'border-cyan-200 bg-cyan-50 text-cyan-700'
                    : isDarkMode
                      ? 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-white'
                      : 'border-white/80 bg-white/60 text-slate-500 hover:text-slate-900'
                )}
              >
                {timing}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs font-black uppercase tracking-wide">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className={muted}>
                {day}
              </div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-2">
            {calendarDays.map((day) => (
              <CalendarDay
                key={day.iso}
                day={day}
                selected={day.iso === selectedDate}
                isDarkMode={isDarkMode}
                onSelect={() => setSelectedDate(day.iso)}
              />
            ))}
          </div>
        </div>

        <aside className="space-y-5">
          <Panel
            title={selectedDateLabel}
            description={`${selectedEvents.length} visible event${selectedEvents.length === 1 ? '' : 's'} on selected date.`}
            isDarkMode={isDarkMode}
          >
            <div className="space-y-2">
              {selectedEvents.length === 0 ? (
                <EmptyState
                  title="No visible events"
                  description="Switch filters or add a shared operational event for this date."
                  isDarkMode={isDarkMode}
                />
              ) : (
                selectedEvents.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    isDarkMode={isDarkMode}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onOpen={() => openEvent(event)}
                    onEdit={() => editSharedEvent(event)}
                    onRemove={() => removeSharedEvent(event.id)}
                  />
                ))
              )}
            </div>
          </Panel>

          <Panel
            title="Upcoming Operations"
            description="Next shared operational events and actual Forecast Package milestones."
            isDarkMode={isDarkMode}
          >
            <div className="space-y-2">
              {upcomingEvents.length === 0 ? (
                <EmptyState
                  title="No upcoming visible events"
                  description="Upcoming operational activity will appear here."
                  isDarkMode={isDarkMode}
                />
              ) : (
                upcomingEvents.map((event) => (
                  <TimelineRow
                    key={event.id}
                    event={event}
                    isDarkMode={isDarkMode}
                    onOpen={() => openEvent(event)}
                  />
                ))
              )}
            </div>
          </Panel>

          {(canCreate || (draft.id && canEdit)) && (
            <Panel
              title={draft.id ? 'Edit Shared Event' : 'Add Shared Event'}
              description="Persist meetings, maintenance, training, reminders, and deployments for authorized WaveLab users."
              isDarkMode={isDarkMode}
            >
              <form onSubmit={saveSharedEvent} className="space-y-3">
                <input
                  value={draft.title}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder="Example: CWA coordination meeting"
                  className={cn(
                    'w-full rounded-xl border px-3 py-2 text-sm font-semibold outline-none transition-colors',
                    inputClass
                  )}
                />
                <input
                  type="date"
                  value={draft.date}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, date: event.target.value }))
                  }
                  className={cn(
                    'w-full rounded-xl border px-3 py-2 text-sm font-semibold outline-none transition-colors',
                    inputClass
                  )}
                />
                <label className={cn('flex items-center gap-2 text-xs font-black', muted)}>
                  <input
                    type="checkbox"
                    checked={draft.allDay}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, allDay: event.target.checked }))
                    }
                  />
                  All-day event
                </label>
                {!draft.allDay && (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="time"
                      value={draft.time}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, time: event.target.value }))
                      }
                      className={cn(
                        'rounded-xl border px-3 py-2 text-sm font-semibold outline-none transition-colors',
                        inputClass
                      )}
                    />
                    <input
                      type="time"
                      value={draft.endTime}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, endTime: event.target.value }))
                      }
                      className={cn(
                        'rounded-xl border px-3 py-2 text-sm font-semibold outline-none transition-colors',
                        inputClass
                      )}
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={draft.type}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, type: event.target.value }))
                    }
                    className={cn(
                      'rounded-xl border px-3 py-2 text-sm font-semibold outline-none transition-colors',
                      inputClass
                    )}
                  >
                    {EVENT_TYPES.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                  <input
                    value={draft.owner}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, owner: event.target.value }))
                    }
                    placeholder="Owner / organizer"
                    className={cn(
                      'rounded-xl border px-3 py-2 text-sm font-semibold outline-none transition-colors',
                      inputClass
                    )}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving || !draft.title.trim()}
                    className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-3 py-2 text-sm font-black text-white shadow-lg shadow-cyan-500/25 transition-colors hover:bg-cyan-400 disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}{' '}
                    {draft.id ? 'Save changes' : 'Add event'}
                  </button>
                  {draft.id && (
                    <button
                      type="button"
                      onClick={() =>
                        setDraft({
                          id: null,
                          title: '',
                          owner: 'WaveLab Team',
                          type: 'Meeting',
                          date: selectedDate || todayIso,
                          time: '09:00',
                          endTime: '10:00',
                          allDay: false,
                        })
                      }
                      className={cn('rounded-xl border px-3 text-sm font-black', softPanel)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </Panel>
          )}
        </aside>
      </section>
    </div>
  );
}

function CalendarDay({ day, selected, isDarkMode, onSelect }) {
  const primaryEvents = day.events.slice(0, 2);
  const hiddenCount = Math.max(0, day.events.length - primaryEvents.length);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'min-h-[112px] rounded-xl border p-2 text-left transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400/60',
        selected
          ? isDarkMode
            ? 'border-cyan-300/50 bg-cyan-400/10 shadow-lg shadow-cyan-950/20'
            : 'border-cyan-200 bg-cyan-50 shadow-lg shadow-cyan-100/60'
          : isDarkMode
            ? 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
            : 'border-white/80 bg-white/65 hover:bg-white',
        !day.isCurrentMonth && 'opacity-45'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            'grid h-7 w-7 place-items-center rounded-full text-sm font-black',
            day.isToday ? 'bg-cyan-500 text-white' : isDarkMode ? 'text-white' : 'text-slate-900'
          )}
        >
          {day.day}
        </span>
        {day.events.length > 0 && (
          <span
            className={cn(
              'rounded-full px-1.5 py-0.5 text-[10px] font-black',
              isDarkMode ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-600'
            )}
          >
            {day.events.length}
          </span>
        )}
      </div>
      <div className="mt-2 space-y-1">
        {primaryEvents.map((event) => (
          <EventChip key={event.id} event={event} isDarkMode={isDarkMode} />
        ))}
        {hiddenCount > 0 && (
          <p
            className={cn(
              'text-[10px] font-black',
              isDarkMode ? 'text-slate-500' : 'text-slate-400'
            )}
          >
            +{hiddenCount} more
          </p>
        )}
      </div>
    </button>
  );
}

function EventChip({ event, isDarkMode }) {
  return (
    <span
      className={cn(
        'flex max-w-full items-center gap-1 rounded-lg border px-1.5 py-1 text-[10px] font-black',
        getEventTone(event.type, isDarkMode)
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 shrink-0 rounded-full',
          TYPE_META[event.type]?.dot || TYPE_META.Meeting.dot
        )}
      />
      <span className="truncate">
        {formatTime(event.startsAt, event.allDay)} ·{' '}
        {event.type === 'Package'
          ? STATUS_LABELS[event.status] || event.status || 'Package'
          : event.type}
      </span>
    </span>
  );
}

function MiniStat({ label, value, isDarkMode }) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-3',
        isDarkMode ? 'border-white/10 bg-white/[0.04]' : 'border-white/80 bg-white/65'
      )}
    >
      <p
        className={cn(
          'text-xs font-black uppercase tracking-wide',
          isDarkMode ? 'text-slate-400' : 'text-slate-500'
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          'mt-1 text-2xl font-black tabular-nums',
          isDarkMode ? 'text-white' : 'text-slate-950'
        )}
      >
        {value}
      </p>
    </div>
  );
}

function Panel({ title, description, isDarkMode, children }) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-4 shadow-xl backdrop-blur-xl',
        isDarkMode
          ? 'border-white/10 bg-slate-950/50 shadow-black/20'
          : 'border-white/70 bg-white/70 shadow-slate-300/40'
      )}
    >
      <div className="mb-4">
        <h2 className={cn('text-base font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
          {title}
        </h2>
        <p
          className={cn(
            'mt-1 text-sm font-semibold leading-5',
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          )}
        >
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}

function EventRow({ event, isDarkMode, canEdit, canDelete, onOpen, onEdit, onRemove }) {
  const meta = TYPE_META[event.type] || TYPE_META.Meeting;
  const Icon = meta.icon;
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3 rounded-xl border p-3',
        isDarkMode ? 'border-white/10 bg-white/[0.04]' : 'border-white/80 bg-white/65'
      )}
    >
      <div className="flex min-w-0 gap-3">
        <span
          className={cn(
            'grid h-10 w-10 shrink-0 place-items-center rounded-xl border',
            getEventTone(event.type, isDarkMode)
          )}
        >
          <Icon size={17} />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={cn(
                'truncate text-sm font-black',
                isDarkMode ? 'text-white' : 'text-slate-950'
              )}
            >
              {event.title}
            </p>
            <span
              className={cn(
                'rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide',
                getEventTone(event.type, isDarkMode)
              )}
            >
              {event.type}
            </span>
            {event.timing && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-black uppercase',
                  isDarkMode ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-600'
                )}
              >
                {event.timing}
              </span>
            )}
          </div>
          <p
            className={cn(
              'mt-1 text-xs font-semibold',
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            )}
          >
            {formatDate(event.date)} · {formatTime(event.startsAt, event.allDay)} · {event.owner}
          </p>
          {event.detail && (
            <p
              className={cn(
                'mt-1 text-xs font-semibold',
                isDarkMode ? 'text-slate-500' : 'text-slate-400'
              )}
            >
              {event.detail}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-3">
            {event.href && (
              <button
                type="button"
                onClick={onOpen}
                className={cn('text-xs font-black', isDarkMode ? 'text-cyan-200' : 'text-cyan-700')}
              >
                {event.action || 'Open'}
              </button>
            )}
            {event.source === 'manual' && canEdit && (
              <button
                type="button"
                onClick={onEdit}
                className={cn(
                  'inline-flex items-center gap-1 text-xs font-black',
                  isDarkMode ? 'text-slate-300' : 'text-slate-600'
                )}
              >
                <Pencil size={12} /> Edit
              </button>
            )}
            {event.source === 'manual' && canDelete && (
              <button
                type="button"
                onClick={onRemove}
                className="inline-flex items-center gap-1 text-xs font-black text-rose-500"
              >
                <Trash2 size={12} /> Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineRow({ event, isDarkMode, onOpen }) {
  return (
    <button
      type="button"
      onClick={event.href ? onOpen : undefined}
      disabled={!event.href}
      className="flex w-full gap-3 text-left disabled:cursor-default"
    >
      <div className="flex flex-col items-center">
        <span
          className={cn(
            'mt-1 h-2.5 w-2.5 rounded-full',
            TYPE_META[event.type]?.dot || TYPE_META.Meeting.dot
          )}
        />
        <span className={cn('mt-1 h-full w-px', isDarkMode ? 'bg-white/10' : 'bg-slate-200')} />
      </div>
      <div className="min-w-0 pb-3">
        <p
          className={cn(
            'text-xs font-black uppercase tracking-wide',
            isDarkMode ? 'text-slate-500' : 'text-slate-400'
          )}
        >
          {formatShortDate(event.date)} · {formatTime(event.startsAt, event.allDay)} ·{' '}
          {event.timing || 'actual'}
        </p>
        <p
          className={cn(
            'mt-1 truncate text-sm font-black',
            isDarkMode ? 'text-white' : 'text-slate-950'
          )}
        >
          {event.title}
        </p>
        <p
          className={cn(
            'mt-1 text-xs font-semibold leading-5',
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          )}
        >
          {event.action || event.detail || event.owner}
        </p>
      </div>
    </button>
  );
}

function EmptyState({ title, description, isDarkMode }) {
  return (
    <div
      className={cn(
        'rounded-xl border p-4 text-center',
        isDarkMode ? 'border-white/10 bg-white/[0.03]' : 'border-white/80 bg-white/60'
      )}
    >
      <AlertTriangle
        size={18}
        className={cn('mx-auto mb-2', isDarkMode ? 'text-slate-500' : 'text-slate-400')}
      />
      <p className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
        {title}
      </p>
      <p
        className={cn(
          'mt-1 text-xs font-semibold leading-5',
          isDarkMode ? 'text-slate-400' : 'text-slate-500'
        )}
      >
        {description}
      </p>
    </div>
  );
}
