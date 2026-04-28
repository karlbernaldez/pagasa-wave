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
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.88 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: 'backOut' } },
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

export function getProjectStats(projects) {
  return [
    { value: projects.length, label: 'Total' },
    { value: projects.filter((p) => p.status === 'Published').length, label: 'Published' },
    { value: projects.filter((p) => p.status === 'Under Review').length, label: 'In Review' },
    { value: projects.filter((p) => p.status === 'Draft').length, label: 'Drafts' },
  ];
}
