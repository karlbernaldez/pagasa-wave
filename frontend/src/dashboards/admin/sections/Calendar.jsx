import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const EVENT_TYPES = ['Publication', 'Review', 'Maintenance', 'Meeting'];

const INITIAL_EVENTS = [
  { id: 1, title: 'Morning Wave Bulletin', date: '2026-02-03', owner: 'Forecast Team', type: 'Publication' },
  { id: 2, title: 'Pending Requests Review', date: '2026-02-10', owner: 'Admin Team', type: 'Review' },
  { id: 3, title: 'Model Calibration Check', date: '2026-02-18', owner: 'Data Analyst', type: 'Maintenance' },
  { id: 4, title: 'Weekly Ops Standup', date: '2026-02-20', owner: 'All Teams', type: 'Meeting' },
];

const getEventBadge = (type, isDarkMode) => {
  if (type === 'Publication') return isDarkMode ? 'bg-cyan-900/50 text-cyan-200' : 'bg-cyan-100 text-cyan-700';
  if (type === 'Review') return isDarkMode ? 'bg-amber-900/50 text-amber-200' : 'bg-amber-100 text-amber-700';
  if (type === 'Maintenance') return isDarkMode ? 'bg-purple-900/50 text-purple-200' : 'bg-purple-100 text-purple-700';
  return isDarkMode ? 'bg-emerald-900/50 text-emerald-200' : 'bg-emerald-100 text-emerald-700';
};

const toIsoDate = (value) => value.toISOString().slice(0, 10);

const CalendarSection = ({ isDarkMode }) => {
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [monthDate, setMonthDate] = useState(new Date(2026, 1, 1));
  const [draft, setDraft] = useState({ title: '', owner: 'Admin Team', type: 'Review', date: '2026-02-15' });

  const monthName = monthDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const days = useMemo(() => {
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
        events: events.filter((event) => event.date === iso),
      };
    });
  }, [events, monthDate]);

  const addEvent = () => {
    if (!draft.title.trim()) return;
    setEvents((prev) => [...prev, { id: Date.now(), ...draft, title: draft.title.trim() }]);
    setDraft((prev) => ({ ...prev, title: '' }));
  };

  return (
    <section className={`rounded-2xl border p-6 ${isDarkMode ? 'bg-gray-800/50 border-gray-700/60' : 'bg-white border-gray-200'}`}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h3 className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Calendar & Schedule</h3>
          <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Monthly calendar with event management and scheduling.</p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))} className={`p-2 rounded-lg border ${isDarkMode ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-700'}`}><ChevronLeft size={16} /></button>
          <p className={`font-semibold min-w-[170px] text-center ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{monthName}</p>
          <button onClick={() => setMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))} className={`p-2 rounded-lg border ${isDarkMode ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-700'}`}><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6">
        <div>
          <div className="grid grid-cols-7 gap-2 mb-2 text-xs font-semibold uppercase tracking-wide">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <p key={day} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>{day}</p>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {days.map((date) => (
              <div
                key={date.iso}
                className={`min-h-[110px] rounded-xl border p-2 ${date.isCurrentMonth ? '' : 'opacity-40'} ${isDarkMode ? 'border-gray-700 bg-gray-900/30' : 'border-gray-200 bg-gray-50'}`}
              >
                <p className={`text-xs font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{date.day}</p>
                <div className="mt-2 space-y-1">
                  {date.events.slice(0, 2).map((event) => (
                    <p key={event.id} className={`text-[10px] px-1.5 py-1 rounded ${getEventBadge(event.type, isDarkMode)}`}>{event.title}</p>
                  ))}
                  {date.events.length > 2 && <p className={`text-[10px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>+{date.events.length - 2} more</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`rounded-xl border p-4 space-y-3 h-fit ${isDarkMode ? 'border-gray-700 bg-gray-900/40' : 'border-gray-200 bg-gray-50'}`}>
          <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Add Event</h4>
          <input value={draft.title} onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))} placeholder="Event title" className={`w-full px-3 py-2 rounded-lg border text-sm ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-700'}`} />
          <input value={draft.owner} onChange={(e) => setDraft((prev) => ({ ...prev, owner: e.target.value }))} placeholder="Owner" className={`w-full px-3 py-2 rounded-lg border text-sm ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-700'}`} />
          <input type="date" value={draft.date} onChange={(e) => setDraft((prev) => ({ ...prev, date: e.target.value }))} className={`w-full px-3 py-2 rounded-lg border text-sm ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-700'}`} />
          <select value={draft.type} onChange={(e) => setDraft((prev) => ({ ...prev, type: e.target.value }))} className={`w-full px-3 py-2 rounded-lg border text-sm ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-700'}`}>
            {EVENT_TYPES.map((type) => <option key={type}>{type}</option>)}
          </select>
          <button onClick={addEvent} className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold text-sm"><Plus size={14} /> Add to Calendar</button>
        </div>
      </div>
    </section>
  );
};

export default CalendarSection;
