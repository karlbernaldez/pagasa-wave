const SYSTEM_REMARKS = new Set([
  'Project created',
  'Submitted for review',
  'Project review started',
]);

export function getProjectName(project) {
  return project?.forecastProjectName || project?.name || project?.title || 'Untitled project';
}

export function getProjectId(project) {
  return project?.primaryChartId || project?._id || project?.id;
}

export function getProjectType(project) {
  return project?.chartSummary || project?.chartType || project?.type || 'Forecast';
}

export function getOwner(project) {
  if (project?.ownerDisplay) return project.ownerDisplay;
  if (!project?.owner) return 'Project Owner';
  if (typeof project.owner === 'string') return project.owner;

  const fullName = `${project.owner.firstName ?? ''} ${project.owner.lastName ?? ''}`.trim();
  return fullName || project.owner.email || 'Project Owner';
}

export function getUserLabel(user) {
  if (!user) return 'System';
  if (typeof user === 'string') return user;

  const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  return fullName || user.username || user.email || 'User';
}

export function formatDate(value) {
  if (!value) return '—';

  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getTimeline(project) {
  const logs = Array.isArray(project?.auditLogs) ? project.auditLogs : [];

  return logs
    .map((log, index) => ({
      id: log._id || `${log.action}-${index}`,
      action: log.action || 'updated',
      actor: getUserLabel(log.performedBy),
      previousStatus: log.previousStatus,
      newStatus: log.newStatus,
      comment: log.comment,
      date: log.createdAt || log.timestamp || project.updatedAt || project.createdAt,
    }))
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
}

export function getPreviousRemarks(project) {
  const remarks = [];

  getTimeline(project)
    .filter((item) => item.comment && !SYSTEM_REMARKS.has(item.comment))
    .forEach((item) => remarks.push(item));

  const seen = new Set();

  return remarks
    .filter((item) => {
      const key = `${item.comment}-${item.date}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
}

export function getReviewer(project) {
  return getUserLabel(project?.approvedBy || project?.rejectedBy || project?.reviewStartedBy);
}

export function getEmbeddedCurrentFeatureSource(project) {
  return project?.features || project?.featureCollection || project?.annotations || [];
}

export function getPreviousFeatureSource(project) {
  const versions = Array.isArray(project?.versions) ? project.versions : [];
  const previousVersion = versions.length > 1 ? versions[versions.length - 2] : versions[0];

  return previousVersion?.features || previousVersion?.featureCollection || previousVersion?.annotations || [];
}

export function mergeProjectState(previousProject, nextProject) {
  if (!previousProject || !nextProject) return nextProject || previousProject;

  return {
    ...previousProject,
    ...nextProject,
    features: nextProject.features ?? previousProject.features,
    featureCollection: nextProject.featureCollection ?? previousProject.featureCollection,
    annotations: nextProject.annotations ?? previousProject.annotations,
    versions: nextProject.versions ?? previousProject.versions,
  };
}
