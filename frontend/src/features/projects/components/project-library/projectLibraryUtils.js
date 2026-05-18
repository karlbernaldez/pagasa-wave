export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94], delay },
  }),
};

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.98, y: 8 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.24, ease: "easeOut" } },
};

export const SORT_OPTIONS = [
  { value: "updatedAt", label: "Last Updated" },
  { value: "createdAt", label: "Date Created" },
  { value: "name", label: "Name" },
  { value: "status", label: "Status" },
];

export function sortProjects(projects, sortBy, sortDir) {
  return [...projects].sort((a, b) => {
    let valueA;
    let valueB;

    if (sortBy === "name") {
      valueA = (a.name ?? "").toLowerCase();
      valueB = (b.name ?? "").toLowerCase();
    } else if (sortBy === "status") {
      valueA = (a.status ?? "").toLowerCase();
      valueB = (b.status ?? "").toLowerCase();
    } else {
      valueA = new Date(a[sortBy] ?? 0).getTime();
      valueB = new Date(b[sortBy] ?? 0).getTime();
    }

    if (valueA < valueB) return sortDir === "asc" ? -1 : 1;
    if (valueA > valueB) return sortDir === "asc" ? 1 : -1;
    return 0;
  });
}

function getCount(statusCounts, status, projects) {
  if (statusCounts && Object.prototype.hasOwnProperty.call(statusCounts, status)) {
    return statusCounts[status] || 0;
  }

  return projects.filter((project) => project.status === status).length;
}

export function getProjectStats(projects, total = projects.length, statusCounts = null) {
  return [
    { value: total, label: "Total Projects", helper: "Matching filters", tone: "blue" },
    { value: getCount(statusCounts, "Draft", projects), label: "Drafts", helper: "Matching filters", tone: "blue" },
    { value: getCount(statusCounts, "Under Review", projects), label: "Under Review", helper: "Matching filters", tone: "amber" },
    { value: getCount(statusCounts, "Submitted", projects), label: "Submitted", helper: "Matching filters", tone: "slate" },
    { value: getCount(statusCounts, "Published", projects), label: "Published", helper: "Matching filters", tone: "emerald" },
  ];
}

export function getAdminProjectStats(projects, total = projects.length, statusCounts = null) {
  return [
    { value: total, label: "Total Projects", helper: "Matching filters", tone: "blue" },
    { value: getCount(statusCounts, "Submitted", projects), label: "Submitted", helper: "Matching filters", tone: "slate" },
    { value: getCount(statusCounts, "Under Review", projects), label: "Under Review", helper: "Matching filters", tone: "amber" },
    { value: getCount(statusCounts, "Revision Requested", projects), label: "Needs Revision", helper: "Matching filters", tone: "amber" },
    { value: getCount(statusCounts, "Published", projects), label: "Published", helper: "Matching filters", tone: "emerald" },
  ];
}
