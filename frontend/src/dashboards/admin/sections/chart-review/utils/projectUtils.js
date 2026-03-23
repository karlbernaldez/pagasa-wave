// ─────────────────────────────────────────────
// Formatters
// ─────────────────────────────────────────────

export const formatOwner = (owner) => {
  if (!owner) return 'Project Owner';
  if (typeof owner === 'string') return owner;
  const fullName = `${owner.firstName ?? ''} ${owner.lastName ?? ''}`.trim();
  return fullName || owner.email || 'Project Owner';
};

export const formatDate = (dateStr, options = {}) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  });
};

// ─────────────────────────────────────────────
// Normalization
// ─────────────────────────────────────────────


export const normalizeProject = (project) => ({
  _id: project._id,                 // Keep Mongo ID
  id: project._id,                  // Optional legacy support

  name: project.name || 'Untitled Project',
  title: project.name || 'Untitled Project', // keep if older components use title

  owner: formatOwner(project.owner),
  rawOwner: project.owner,

  chartType: project.chartType || 'N/A',
  forecastDate: project.forecastDate,
  createdAt: project.createdAt,

  status: (project.status || 'Draft').trim(), // 🔥 KEEP BACKEND STATUS
});

export const normalizeProjects = (projects) =>
  (Array.isArray(projects) ? projects : []).map(normalizeProject);