export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (d = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94], delay: d },
  }),
};

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.98, y: 8 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.24, ease: 'easeOut' } },
};

export const SORT_OPTIONS = [
  { value: 'updatedAt', label: 'Last Updated' },
  { value: 'createdAt', label: 'Date Created' },
  { value: 'name', label: 'Name' },
  { value: 'status', label: 'Status' },
];

export function sortProjects(projects, sortBy, sortDir) {
  return [...projects].sort((a, b) => {
    let valA;
    let valB;

    if (sortBy === 'name') {
      valA = (a.name ?? '').toLowerCase();
      valB = (b.name ?? '').toLowerCase();
    } else if (sortBy === 'status') {
      valA = (a.status ?? '').toLowerCase();
      valB = (b.status ?? '').toLowerCase();
    } else {
      valA = new Date(a[sortBy] ?? 0).getTime();
      valB = new Date(b[sortBy] ?? 0).getTime();
    }

    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });
}

export function getProjectStats(projects, total = projects.length) {
  return [
    {
      value: total,
      label: 'Total Projects',
      helper: 'Matching filters',
      tone: 'blue',
    },
    {
      value: projects.filter((p) => p.status === 'Draft').length,
      label: 'Drafts',
      helper: 'Visible page',
      tone: 'blue',
    },
    {
      value: projects.filter((p) => p.status === 'Under Review').length,
      label: 'Under Review',
      helper: 'Visible page',
      tone: 'amber',
    },
    {
      value: projects.filter((p) => p.status === 'Submitted').length,
      label: 'Submitted',
      helper: 'Visible page',
      tone: 'slate',
    },
    {
      value: projects.filter((p) => p.status === 'Published').length,
      label: 'Published',
      helper: 'Visible page',
      tone: 'emerald',
    },
  ];
}

export function getAdminProjectStats(projects, total = projects.length) {
  return [
    {
      value: total,
      label: 'Total Projects',
      helper: 'Matching filters',
      tone: 'blue',
    },
    {
      value: projects.filter((p) => p.status === 'Submitted').length,
      label: 'Submitted',
      helper: 'Visible page',
      tone: 'slate',
    },
    {
      value: projects.filter((p) => p.status === 'Under Review').length,
      label: 'Under Review',
      helper: 'Visible page',
      tone: 'amber',
    },
    {
      value: projects.filter((p) => p.status === 'Revision Requested').length,
      label: 'Needs Revision',
      helper: 'Visible page',
      tone: 'amber',
    },
    {
      value: projects.filter((p) => p.status === 'Published').length,
      label: 'Published',
      helper: 'Visible page',
      tone: 'emerald',
    },
  ];
}
