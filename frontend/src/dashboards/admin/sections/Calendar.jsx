const CALENDAR_EVENTS = [
  { title: 'Morning Wave Bulletin', date: 'Mon, 08:00 AM', owner: 'Forecast Team', type: 'Publication' },
  { title: 'Pending Requests Review', date: 'Tue, 10:00 AM', owner: 'Admin Team', type: 'Review' },
  { title: 'Model Calibration Check', date: 'Wed, 03:00 PM', owner: 'Data Analyst', type: 'Maintenance' },
  { title: 'Weekly Ops Standup', date: 'Fri, 09:00 AM', owner: 'All Teams', type: 'Meeting' },
];

const getEventBadge = (type, isDarkMode) => {
  if (type === 'Publication') {
    return isDarkMode ? 'bg-cyan-900/50 text-cyan-200' : 'bg-cyan-100 text-cyan-700';
  }

  if (type === 'Review') {
    return isDarkMode ? 'bg-amber-900/50 text-amber-200' : 'bg-amber-100 text-amber-700';
  }

  if (type === 'Maintenance') {
    return isDarkMode ? 'bg-purple-900/50 text-purple-200' : 'bg-purple-100 text-purple-700';
  }

  return isDarkMode ? 'bg-emerald-900/50 text-emerald-200' : 'bg-emerald-100 text-emerald-700';
};

const CalendarSection = ({ isDarkMode }) => (
  <section className={`rounded-2xl border p-6 ${isDarkMode ? 'bg-gray-800/50 border-gray-700/60' : 'bg-white border-gray-200'}`}>
    <h3 className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Calendar & Schedule</h3>
    <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage team deadlines and important admin activities.</p>

    <div className="mt-6 grid gap-4 md:grid-cols-2">
      {CALENDAR_EVENTS.map((event) => (
        <div
          key={`${event.title}-${event.date}`}
          className={`rounded-xl border p-4 ${isDarkMode ? 'border-gray-700 bg-gray-900/40' : 'border-gray-200 bg-gray-50'}`}
        >
          <div className="flex items-center justify-between gap-3">
            <h4 className={`font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{event.title}</h4>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getEventBadge(event.type, isDarkMode)}`}>{event.type}</span>
          </div>
          <p className={`mt-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{event.date}</p>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Owner: {event.owner}</p>
        </div>
      ))}
    </div>
  </section>
);

export default CalendarSection;
