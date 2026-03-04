// studio/constants.js

export const STATUS_META = {
  Draft:          { dark: "bg-zinc-800 text-zinc-300 border-zinc-700",         light: "bg-zinc-100 text-zinc-600 border-zinc-300",         dot: "bg-zinc-400"    },
  Submitted:      { dark: "bg-amber-950 text-amber-300 border-amber-800",       light: "bg-amber-50 text-amber-700 border-amber-200",       dot: "bg-amber-400"   },
  "Under Review": { dark: "bg-orange-950 text-orange-300 border-orange-800",    light: "bg-orange-50 text-orange-700 border-orange-200",    dot: "bg-orange-400"  },
  Approved:       { dark: "bg-green-950 text-green-300 border-green-800",       light: "bg-green-50 text-green-700 border-green-200",       dot: "bg-green-500"   },
  Published:      { dark: "bg-emerald-950 text-emerald-300 border-emerald-800", light: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  Rejected:       { dark: "bg-red-950 text-red-400 border-red-900",             light: "bg-red-50 text-red-600 border-red-200",             dot: "bg-red-500"     },
  Archived:       { dark: "bg-slate-900 text-slate-400 border-slate-700",       light: "bg-slate-100 text-slate-500 border-slate-300",      dot: "bg-slate-500"   },
};

export const FALLBACK_STATUS = {
  dark:  "bg-zinc-800 text-zinc-300 border-zinc-700",
  light: "bg-zinc-100 text-zinc-600 border-zinc-300",
  dot:   "bg-zinc-400",
};

export const STATUS_FILTERS = [
  "All", "Draft", "Submitted", "Under Review",
  "Approved", "Published", "Rejected", "Archived",
];

export const PAGE_LIMIT = 9;