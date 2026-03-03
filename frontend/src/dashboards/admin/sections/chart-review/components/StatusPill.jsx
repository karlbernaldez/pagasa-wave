const STATUS_STYLES = {
  Draft: {
    light: 'bg-gray-100 text-gray-700 border-gray-200',
    dark: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    dot: 'bg-gray-400',
  },
  Submitted: {
    light: 'bg-amber-100 text-amber-700 border-amber-200',
    dark: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    dot: 'bg-amber-400',
  },
  'Under Review': {
    light: 'bg-blue-100 text-blue-700 border-blue-200',
    dark: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    dot: 'bg-blue-400',
  },
  Approved: {
    light: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dark: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  Published: {
    light: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    dark: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    dot: 'bg-indigo-400',
  },
  Rejected: {
    light: 'bg-red-100 text-red-700 border-red-200',
    dark: 'bg-red-500/20 text-red-300 border-red-500/30',
    dot: 'bg-red-400',
  },
  Archived: {
    light: 'bg-slate-100 text-slate-700 border-slate-200',
    dark: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    dot: 'bg-slate-400',
  },
};

const StatusPill = ({ status = 'Draft', isDarkMode }) => {
  const normalizedStatus = status?.trim() || 'Draft';
  const styles = STATUS_STYLES[normalizedStatus] || STATUS_STYLES.Draft;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full tracking-wide uppercase border ${
        isDarkMode ? styles.dark : styles.light
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${styles.dot}`} />
      {normalizedStatus}
    </span>
  );
};

export default StatusPill;