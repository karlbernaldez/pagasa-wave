// studio/constants.js

export const PAGE_LIMIT = 6;

/** Must mirror Project.js status enum exactly */
export const STATUS_FILTERS = [
  "All",
  "Draft",
  "Submitted",
  "Under Review",
  "Approved",
  "Published",
  "Rejected",
  "Archived",
];

/** Card badge colours per status */
export const STATUS_META = {
  Draft: {
    dot:   "bg-slate-400",
    light: "bg-slate-100 text-slate-600 border-slate-200",
    dark:  "bg-slate-800/60 text-slate-400 border-slate-700/60",
  },
  Submitted: {
    dot:   "bg-amber-400",
    light: "bg-amber-50 text-amber-700 border-amber-200",
    dark:  "bg-amber-900/30 text-amber-400 border-amber-700/50",
  },
  "Under Review": {
    dot:   "bg-orange-400",
    light: "bg-orange-50 text-orange-700 border-orange-200",
    dark:  "bg-orange-900/30 text-orange-400 border-orange-700/50",
  },
  Approved: {
    dot:   "bg-emerald-400",
    light: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dark:  "bg-emerald-900/30 text-emerald-400 border-emerald-700/50",
  },
  Published: {
    dot:   "bg-green-400",
    light: "bg-green-50 text-green-700 border-green-200",
    dark:  "bg-green-900/30 text-green-400 border-green-700/50",
  },
  Rejected: {
    dot:   "bg-red-400",
    light: "bg-red-50 text-red-700 border-red-200",
    dark:  "bg-red-900/30 text-red-400 border-red-700/50",
  },
  Archived: {
    dot:   "bg-slate-500",
    light: "bg-slate-100 text-slate-500 border-slate-200",
    dark:  "bg-slate-800/40 text-slate-500 border-slate-700/40",
  },
};

export const FALLBACK_STATUS = {
  dot:   "bg-slate-400",
  light: "bg-slate-100 text-slate-600 border-slate-200",
  dark:  "bg-slate-800/60 text-slate-400 border-slate-700/60",
};