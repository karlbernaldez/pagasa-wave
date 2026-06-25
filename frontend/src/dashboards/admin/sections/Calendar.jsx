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

import { fetchAdminForecastPackages } from '@/api/forecastPackageAPI';
import {
  adaptForecastPackageModel,
  formatPackageDate,
  getDateKey,
  isDailyForecastPackage,
} from '@/features/projects/utils/forecastPackageGrouping';

const cn = (...classes) => classes.filter(Boolean).join(' ');
const CUSTOM_EVENTS_STORAGE_KEY = 'adminCalendarCustomEvents';

const EVENT_TYPES = ['Package', 'Review', 'Publication', 'Maintenance', 'Meeting'];
const REVIEW_STATUSES = new Set(['Submitted', 'Under Review', 'Needs Review']);
const RETURNED_STATUSES = new Set(['Rejected', 'Revision Requested', 'Returned']);
const APPROVED_STATUSES = new Set(['Approved', 'Published']);

const TYPE_META = {
  Package: { icon: Waves, dot: 'bg-cyan-500', light: 'border-cyan-200 bg-cyan-50/80 text-cyan-700', dark: 'border-cyan-300/20 bg-cyan-400/10 text-cyan-200' },
  Review: { icon: Clock3, dot: 'bg-amber-500', light: 'border-amber-200 bg-amber-50/80 text-amber-700', dark: 'border-amber-300/20 bg-amber-400/10 text-amber-200' },
  Publication: { icon: CheckCircle2, dot: 'bg-emerald-500', light: 'border-emerald-200 bg-emerald-50/80 text-emerald-700', dark: 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200' },
  Maintenance: { icon: RefreshCw, dot: 'bg-violet-500', light: 'border-violet-200 bg-violet-50/80 text-violet-700', dark: 'border-violet-300/20 bg-violet-400/10 text-violet-200' },
  Meeting: { icon: CalendarDays, dot: 'bg-blue-500', light: 'border-blue-200 bg-blue-50/80 text-blue-700', dark: 'border-blue-300/20 bg-blue-400/10 text-blue-200' },
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

function formatDate(value, options = {}) {
  if (!value) return 'No date';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return formatPackageDate(value);
  const key = toIsoDate(value);
  return key ? formatPackageDate(key) : 'No date';
}

function formatMonth(date) {
  return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric', timeZone: 'Asia/Manila' }).format(date);
}

function getEventTone(type, isDarkMode) {
  const meta = TYPE_META[type] || TYPE_META.Meeting;
  return isDarkMode ? meta.dark : meta.light;
}

function getPackageEvents(packages) {
  return packages.flatMap((forecastPackage) => {
    const id = forecastPackage.id || forecastPackage._id || forecastPackage.dateKey;
    const date = forecastPackage.dateKey || toIsoDate(forecastPackage.forecastDate || forecastPackage.createdAt);
    const events = [];

    if (date) {
      events.push({
        id: `${id}-package`,
        title: forecastPackage.title || `${formatPackageDate(date)} Forecast Package`,
        date,
        owner: forecastPackage.ownerLabel || 'Forecast team',
        type: 'Package',
        source: 'package',
        status: forecastPackage.status,
        isDaily: isDailyForecastPackage(forecastPackage),
        detail: `${forecastPackage.chartCount || 0} of 4 charts linked`,
      });
    }

    if (REVIEW_STATUSES.has(forecastPackage.status)) {
      events.push({
        id: `${id}-review`,
        title: `Review: ${forecastPackage.title}`,
        date: toIsoDate(forecastPackage.submittedAt || forecastPackage.updatedAt || forecastPackage.createdAt || date),
        owner: 'Admin Review',
        type: 'Review',
        source: 'package',
        status: forecastPackage.status,
        detail: `${forecastPackage.pendingCount || 0} chart${forecastPackage.pendingCount === 1 ? '' : 's'} awaiting decision`,
      });
    }

    if (RETURNED_STATUSES.has(forecastPackage.status)) {
      events.push({
        id: `${id}-returned`,
        title: `Returned: ${forecastPackage.title}`,
        date: toIsoDate(forecastPackage.reviewedAt || forecastPackage.updatedAt || date),
        owner: 'Admin Review',
        type: 'Review',
        source: 'package',
        status: forecastPackage.status,
        detail: `${forecastPackage.returnedCount || 0} chart${forecastPackage.returnedCount === 1 ? '' : 's'} returned`,
      });
    }

    if (APPROVED_STATUSES.has(forecastPackage.status)) {
      events.push({
        id: `${id}-publish`,
        title: forecastPackage.status === 'Published' ? `Published: ${forecastPackage.title}` : `Ready to publish: ${forecastPackage.title}`,
        date: toIsoDate(forecastPackage.publishedAt || forecastPackage.reviewedAt || forecastPackage.updatedAt || date),
        owner: 'Publication',
        type: 'Publication',
        source: 'package',
        status: forecastPackage.status,
        detail: `${forecastPackage.approvedCount || forecastPackage.chartCount || 0} chart${(forecastPackage.approvedCount || forecastPackage.chartCount) === 1 ? '' : 's'} approved`,
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
  const [draft, setDraft] = useState({ title: '', owner: 'Admin Team', type: 'Review', date: todayIso });
  const [state, setState] = useState({ loading: true, refreshing: false, error: '', packages: [], totalPackages: 0, loadedAt: null });

  const text = isDarkMode ? 'text-white' : 'text-slate-950';
  const muted = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const panel = isDarkMode ? 'border-white/10 bg-slate-950/50 shadow-black/20' : 'border-white/70 bg-white/70 shadow-slate-300/40';
  const softPanel = isDarkMode ? 'border-white/10 bg-white/[0.04]' : 'border-white/80 bg-white/65';
  const inputClass = isDarkMode ? 'border-white/10 bg-white/[0.04] text-slate-100 focus:border-cyan-300/30' : 'border-white/80 bg-white/70 text-slate-800 focus:border-cyan-200';

  const loadCalendar = useCallback(async ({ silent = false } = {}) => {
    setState((current) => ({ ...current, loading: !silent && !current.loadedAt, refreshing: silent, error: '' }));

    try {
      const packageResponse = await fetchAdminForecastPackages({ page: 1, limit: 120 });
      const packages = (packageResponse?.packages ?? []).map(adaptForecastPackageModel);
      setState({ loading: false, refreshing: false, error: '', packages, totalPackages: packageResponse?.total ?? packages.length, loadedAt: new Date().toISOString() });
    } catch (error) {
      setState((current) => ({ ...current, loading: false, refreshing: false, error: error?.message || 'Failed to load package calendar.' }));
    }
  }, []);

  useEffect(() => { loadCalendar(); }, [loadCalendar]);
  useEffect(() => { if (typeof window !== 'undefined') window.localStorage.setItem(CUSTOM_EVENTS_STORAGE_KEY, JSON.stringify(customEvents)); }, [customEvents]);

  const packageEvents = useMemo(() => getPackageEvents(state.packages), [state.packages]);
  const allEvents = useMemo(() => sortEvents([...packageEvents, ...customEvents]), [customEvents, packageEvents]);
  const calendarDays = useMemo(() => buildCalendarDays(monthDate, allEvents), [allEvents, monthDate]);
  const selectedEvents = useMemo(() => allEvents.filter((event) => event.date === selectedDate), [allEvents, selectedDate]);
  const upcomingEvents = useMemo(() => allEvents.filter((event) => event.date >= todayIso).slice(0, 6), [allEvents, todayIso]);
  const todayPackage = useMemo(() => state.packages.find(isDailyForecastPackage), [state.packages]);
  const currentMonthEvents = useMemo(() => calendarDays.reduce((sum, day) => sum + (day.isCurrentMonth ? day.events.length : 0), 0), [calendarDays]);

  const changeMonth = (direction) => {
    setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
  };

  const addCustomEvent = (event) => {
    event.preventDefault();
    if (!draft.title.trim() || !draft.date) return;
    setCustomEvents((current) => [
      ...current,
      { ...draft, id: `custom-${Date.now()}`, title: draft.title.trim(), owner: draft.owner.trim() || 'Admin Team', source: 'custom', detail: 'Admin note' },
    ]);
    setDraft((current) => ({ ...current, title: '', date: selectedDate || todayIso }));
  };

  const removeCustomEvent = (id) => {
    setCustomEvents((current) => current.filter((event) => event.id !== id));
  };

  if (state.loading) {
    return (
      <div className="mx-auto max-w-[1500px] p-4 sm:p-6">
        <div className={cn('flex min-h-[440px] items-center justify-center rounded-2xl border shadow-xl backdrop-blur-xl', panel)}>
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className={cn('h-8 w-8 animate-spin', isDarkMode ? 'text-cyan-200' : 'text-cyan-700')} />
            <p className={cn('text-sm font-black', text)}>Loading package calendar</p>
            <p className={cn('text-xs font-semibold', muted)}>Fetching package dates, review milestones, and publication events.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 p-4 sm:p-6">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className={cn('text-sm font-black', text)}>Forecast operations calendar</p>
          <p className={cn('mt-1 max-w-3xl text-xs font-semibold leading-5', muted)}>
            Track package forecast dates, admin review milestones, publications, and local admin notes.
          </p>
        </div>
        <button type="button" onClick={() => loadCalendar({ silent: true })} className={cn('inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-black shadow-sm backdrop-blur-xl transition-colors', isDarkMode ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white' : 'border-white/80 bg-white/70 text-slate-600 hover:bg-white hover:text-slate-950')}>
          <RefreshCw size={15} className={state.refreshing ? 'animate-spin' : ''} /> Refresh
        </button>
      </section>

      {state.error && <section className={cn('rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm backdrop-blur-xl', isDarkMode ? 'border-amber-300/20 bg-amber-400/10 text-amber-200' : 'border-amber-200 bg-amber-50/80 text-amber-800')}>{state.error}</section>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={CalendarDays} label="Month Events" value={currentMonthEvents} helper="Package, review, publication, and note events" tone="cyan" isDarkMode={isDarkMode} />
        <MetricCard icon={Waves} label="Total Packages" value={state.totalPackages} helper="Loaded forecast packages" tone="blue" isDarkMode={isDarkMode} />
        <MetricCard icon={CheckCircle2} label="Today Package" value={todayPackage ? 'Ready' : 'Missing'} helper={todayPackage ? `${todayPackage.chartCount || 0} of 4 charts linked` : 'No package linked to today'} tone={todayPackage ? 'emerald' : 'amber'} isDarkMode={isDarkMode} />
        <MetricCard icon={Clock3} label="Upcoming" value={upcomingEvents.length} helper="Upcoming calendar events" tone="amber" isDarkMode={isDarkMode} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.8fr)]">
        <div className={cn('rounded-2xl border p-4 shadow-xl backdrop-blur-xl', panel)}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <button type="button" onClick={() => changeMonth(-1)} className={cn('grid h-10 w-10 place-items-center rounded-xl border transition-colors', softPanel)}><ChevronLeft size={18} /></button>
            <div className="text-center"><h2 className={cn('text-lg font-black', text)}>{formatMonth(monthDate)}</h2><p className={cn('text-xs font-semibold', muted)}>{currentMonthEvents} event{currentMonthEvents === 1 ? '' : 's'} scheduled</p></div>
            <button type="button" onClick={() => changeMonth(1)} className={cn('grid h-10 w-10 place-items-center rounded-xl border transition-colors', softPanel)}><ChevronRight size={18} /></button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-black uppercase tracking-wide">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div key={day} className={muted}>{day}</div>)}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-2">
            {calendarDays.map((day) => <CalendarDay key={day.iso} day={day} selected={day.iso === selectedDate} isDarkMode={isDarkMode} onSelect={() => setSelectedDate(day.iso)} />)}
          </div>
        </div>

        <aside className="space-y-5">
          <Panel title={formatDate(selectedDate)} description={`${selectedEvents.length} event${selectedEvents.length === 1 ? '' : 's'} on selected date.`} isDarkMode={isDarkMode}>
            <div className="space-y-2">
              {selectedEvents.length === 0 ? <EmptyState title="No events scheduled" description="Package and review events will appear when available. You can add an admin note below." isDarkMode={isDarkMode} /> : selectedEvents.map((event) => <EventRow key={event.id} event={event} isDarkMode={isDarkMode} onRemove={removeCustomEvent} />)}
            </div>
          </Panel>

          <Panel title="Add Admin Note" description="Local note for maintenance, meetings, or review reminders." isDarkMode={isDarkMode}>
            <form onSubmit={addCustomEvent} className="space-y-3">
              <input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Event title" className={cn('w-full rounded-xl border px-3 py-2 text-sm font-semibold outline-none transition-colors', inputClass)} />
              <div className="grid grid-cols-2 gap-2"><input type="date" value={draft.date} onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))} className={cn('rounded-xl border px-3 py-2 text-sm font-semibold outline-none transition-colors', inputClass)} /><select value={draft.type} onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value }))} className={cn('rounded-xl border px-3 py-2 text-sm font-semibold outline-none transition-colors', inputClass)}>{EVENT_TYPES.filter((type) => type !== 'Package').map((type) => <option key={type}>{type}</option>)}</select></div>
              <input value={draft.owner} onChange={(event) => setDraft((current) => ({ ...current, owner: event.target.value }))} placeholder="Owner" className={cn('w-full rounded-xl border px-3 py-2 text-sm font-semibold outline-none transition-colors', inputClass)} />
              <button type="submit" className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-3 py-2 text-sm font-black text-white shadow-lg shadow-cyan-500/25 transition-colors hover:bg-cyan-400"><Plus size={16} /> Add note</button>
            </form>
          </Panel>
        </aside>
      </section>

      <Panel title="Upcoming Package Operations" description="Next package, review, publication, and admin-note events." isDarkMode={isDarkMode}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {upcomingEvents.length === 0 ? <EmptyState title="No upcoming events" description="Upcoming package events will appear after packages are available." isDarkMode={isDarkMode} /> : upcomingEvents.map((event) => <EventRow key={event.id} event={event} isDarkMode={isDarkMode} onRemove={removeCustomEvent} />)}
        </div>
      </Panel>
    </div>
  );
}

function CalendarDay({ day, selected, isDarkMode, onSelect }) {
  return <button type="button" onClick={onSelect} className={cn('min-h-[96px] rounded-xl border p-2 text-left transition-colors', selected ? isDarkMode ? 'border-cyan-300/40 bg-cyan-400/10' : 'border-cyan-200 bg-cyan-50' : isDarkMode ? 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]' : 'border-white/80 bg-white/65 hover:bg-white', !day.isCurrentMonth && 'opacity-45')}><div className="flex items-center justify-between"><span className={cn('text-sm font-black', day.isToday ? 'text-cyan-400' : isDarkMode ? 'text-white' : 'text-slate-900')}>{day.day}</span>{day.events.length > 0 && <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-black', isDarkMode ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-600')}>{day.events.length}</span>}</div><div className="mt-2 flex flex-wrap gap-1">{day.events.slice(0, 4).map((event) => <span key={event.id} className={cn('h-1.5 w-1.5 rounded-full', TYPE_META[event.type]?.dot || TYPE_META.Meeting.dot)} title={event.title} />)}</div></button>;
}

function MetricCard({ icon: Icon, label, value, helper, tone, isDarkMode }) {
  const toneClass = { blue: isDarkMode ? 'bg-blue-400/10 text-blue-200' : 'bg-blue-50/80 text-blue-700', cyan: isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-cyan-50/80 text-cyan-700', emerald: isDarkMode ? 'bg-emerald-400/10 text-emerald-200' : 'bg-emerald-50/80 text-emerald-700', amber: isDarkMode ? 'bg-amber-400/10 text-amber-200' : 'bg-amber-50/80 text-amber-700' }[tone];
  return <div className={cn('rounded-2xl border p-4 shadow-xl backdrop-blur-xl', isDarkMode ? 'border-white/10 bg-slate-950/50 shadow-black/20' : 'border-white/70 bg-white/70 shadow-slate-300/40')}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className={cn('truncate text-xs font-black uppercase tracking-wide', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{label}</p><p className={cn('mt-2 text-3xl font-black tabular-nums', isDarkMode ? 'text-white' : 'text-slate-950')}>{value}</p></div><span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl', toneClass)}><Icon size={21} /></span></div><p className={cn('mt-3 text-sm font-semibold', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{helper}</p></div>;
}

function Panel({ title, description, isDarkMode, children }) {
  return <div className={cn('rounded-2xl border p-4 shadow-xl backdrop-blur-xl', isDarkMode ? 'border-white/10 bg-slate-950/50 shadow-black/20' : 'border-white/70 bg-white/70 shadow-slate-300/40')}><div className="mb-4"><h2 className={cn('text-base font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{title}</h2><p className={cn('mt-1 text-sm font-semibold leading-5', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{description}</p></div>{children}</div>;
}

function EventRow({ event, isDarkMode, onRemove }) {
  const meta = TYPE_META[event.type] || TYPE_META.Meeting;
  const Icon = meta.icon;
  return <div className={cn('flex items-start justify-between gap-3 rounded-xl border p-3', isDarkMode ? 'border-white/10 bg-white/[0.04]' : 'border-white/80 bg-white/65')}><div className="flex min-w-0 gap-3"><span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-lg border', getEventTone(event.type, isDarkMode))}><Icon size={16} /></span><div className="min-w-0"><p className={cn('truncate text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{event.title}</p><p className={cn('mt-1 text-xs font-semibold', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{formatDate(event.date)} - {event.owner}</p>{event.detail && <p className={cn('mt-1 text-xs font-semibold', isDarkMode ? 'text-slate-500' : 'text-slate-400')}>{event.detail}</p>}<span className={cn('mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide', getEventTone(event.type, isDarkMode))}>{event.type}{event.isDaily ? ' Today' : ''}</span></div></div>{event.source === 'custom' && <button type="button" onClick={() => onRemove(event.id)} className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors', isDarkMode ? 'text-slate-500 hover:bg-white/10 hover:text-rose-300' : 'text-slate-400 hover:bg-white hover:text-rose-500')}><Trash2 size={15} /></button>}</div>;
}

function EmptyState({ title, description, isDarkMode }) {
  return <div className={cn('rounded-xl border p-4 text-center', isDarkMode ? 'border-white/10 bg-white/[0.03]' : 'border-white/80 bg-white/60')}><AlertTriangle size={18} className={cn('mx-auto mb-2', isDarkMode ? 'text-slate-500' : 'text-slate-400')} /><p className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>{title}</p><p className={cn('mt-1 text-xs font-semibold leading-5', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{description}</p></div>;
}
