// ─── Static Data & Configuration ────────────────────────────────────────────
export const STATUS_LABELS = {
  pending: 'Pending Approval',
  active: 'Active',
  locked: 'Locked',
  suspended: 'Suspended',
  inactive: 'Inactive'
};

export const ROLE_OPTIONS = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
  { value: 'forecaster', label: 'Forecaster' },
  { value: 'data_analyst', label: 'Data Analyst' },
];

export const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'locked', label: 'Locked' },
  { value: 'inactive', label: 'Inactive' },
];

export const ROLE_DEFINITIONS = [
  {
    role: 'Admin',
    description: 'Full access to dashboard management, user approvals, and system configuration.',
    members: 4,
    icon: '⬡',
    color: 'violet',
  },
  {
    role: 'Forecaster',
    description: 'Can prepare, review, and submit official forecast charts and bulletins.',
    members: 18,
    icon: '◈',
    color: 'cyan',
  },
  {
    role: 'Data Analyst',
    description: 'Can review data quality pipelines, run analytics, and export reports.',
    members: 10,
    icon: '◇',
    color: 'emerald',
  },
];

export const STATUS_CONFIG = {

  active: {
    badge: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30',
    badgeLight: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    dot: 'bg-emerald-500'
  },

  pending: {
    badge: 'bg-amber-500/10 text-amber-300 border border-amber-500/30',
    badgeLight: 'bg-amber-50 text-amber-700 border border-amber-200',
    dot: 'bg-amber-500'
  },

  locked: {
    badge: 'bg-red-500/10 text-red-300 border border-red-500/30',
    badgeLight: 'bg-red-50 text-red-700 border border-red-200',
    dot: 'bg-red-500'
  },

  suspended: {
    badge: 'bg-orange-500/10 text-orange-300 border border-orange-500/30',
    badgeLight: 'bg-orange-50 text-orange-700 border border-orange-200',
    dot: 'bg-orange-500'
  },

  inactive: {
    badge: 'bg-slate-500/10 text-slate-300 border border-slate-500/30',
    badgeLight: 'bg-slate-100 text-slate-600 border border-slate-200',
    dot: 'bg-slate-400'
  }
};

export const ROLE_COLOR_CONFIG = {
  violet: {
    icon: 'text-violet-400',
    bg: 'bg-violet-400/10 border-violet-400/30',
    badge: 'text-violet-300 bg-violet-400/10 border border-violet-400/20',
    badgeLight: 'text-violet-700 bg-violet-50 border border-violet-200',
    glow: 'shadow-violet-500/10',
    lightIcon: 'text-violet-600',
    lightBg: 'bg-violet-50 border-violet-200',
  },
  cyan: {
    icon: 'text-cyan-400',
    bg: 'bg-cyan-400/10 border-cyan-400/30',
    badge: 'text-cyan-300 bg-cyan-400/10 border border-cyan-400/20',
    badgeLight: 'text-cyan-700 bg-cyan-50 border border-cyan-200',
    glow: 'shadow-cyan-500/10',
    lightIcon: 'text-cyan-600',
    lightBg: 'bg-cyan-50 border-cyan-200',
  },
  emerald: {
    icon: 'text-emerald-400',
    bg: 'bg-emerald-400/10 border-emerald-400/30',
    badge: 'text-emerald-300 bg-emerald-400/10 border border-emerald-400/20',
    badgeLight: 'text-emerald-700 bg-emerald-50 border border-emerald-200',
    glow: 'shadow-emerald-500/10',
    lightIcon: 'text-emerald-600',
    lightBg: 'bg-emerald-50 border-emerald-200',
  },
};