export const PAGE_LIMIT = 12;

/** Must mirror Project.js status enum exactly. */
export const STATUS_FILTERS = [
  "All",
  "Draft",
  "Submitted",
  "Under Review",
  "Revision Requested",
  "Approved",
  "Published",
  "Rejected",
  "Archived",
];

/** Admin review library excludes Draft because drafts are not reviewable by Admin. */
export const ADMIN_STATUS_FILTERS = STATUS_FILTERS.filter((status) => status !== "Draft");

/** Must mirror Project.js chartType enum exactly. */
export const PROJECT_TYPE_FILTERS = [
  { value: "All", label: "All Types" },
  { value: "analysis", label: "Analysis" },
  { value: "forecast_24h", label: "24h Forecast" },
  { value: "forecast_36h", label: "36h Forecast" },
  { value: "forecast_48h", label: "48h Forecast" },
];

/** Badge colours per project status. */
export const STATUS_META = {
  Draft: {
    dot: "bg-blue-500",
    light: "bg-blue-50 text-blue-700 border-blue-100",
    dark: "bg-blue-900/30 text-blue-300 border-blue-700/50",
  },
  Submitted: {
    dot: "bg-slate-500",
    light: "bg-slate-100 text-slate-700 border-slate-200",
    dark: "bg-slate-800/60 text-slate-300 border-slate-700/60",
  },
  "Under Review": {
    dot: "bg-amber-500",
    light: "bg-amber-50 text-amber-700 border-amber-100",
    dark: "bg-amber-900/30 text-amber-300 border-amber-700/50",
  },
  "Revision Requested": {
    dot: "bg-yellow-500",
    light: "bg-yellow-50 text-yellow-700 border-yellow-100",
    dark: "bg-yellow-900/30 text-yellow-300 border-yellow-700/50",
  },
  Approved: {
    dot: "bg-emerald-500",
    light: "bg-emerald-50 text-emerald-700 border-emerald-100",
    dark: "bg-emerald-900/30 text-emerald-300 border-emerald-700/50",
  },
  Published: {
    dot: "bg-emerald-500",
    light: "bg-emerald-50 text-emerald-700 border-emerald-100",
    dark: "bg-emerald-900/30 text-emerald-300 border-emerald-700/50",
  },
  Rejected: {
    dot: "bg-rose-500",
    light: "bg-rose-50 text-rose-700 border-rose-100",
    dark: "bg-rose-900/30 text-rose-300 border-rose-700/50",
  },
  Archived: {
    dot: "bg-slate-500",
    light: "bg-slate-100 text-slate-500 border-slate-200",
    dark: "bg-slate-800/40 text-slate-400 border-slate-700/40",
  },
};

export const FALLBACK_STATUS = {
  dot: "bg-slate-400",
  light: "bg-slate-100 text-slate-600 border-slate-200",
  dark: "bg-slate-800/60 text-slate-400 border-slate-700/60",
};
