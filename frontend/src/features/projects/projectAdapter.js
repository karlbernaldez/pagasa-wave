import { normalizeProjectStatus } from './projectStatuses';

const IGNORED_SYSTEM_COMMENTS = new Set([
  'Project created',
  'Submitted for review',
  'Project review started',
  'Project approved',
  'Project published',
  'Project archived',
]);

function getUserLabel(user) {
  if (!user) return '';
  if (typeof user === 'string') return user;
  return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.username || user.email || '';
}

export function getLatestReviewRemarks(project) {
  const logs = Array.isArray(project?.auditLogs) ? project.auditLogs : [];
  const latestLog = [...logs]
    .reverse()
    .find((log) => {
      const comment = String(log?.comment || '').trim();
      return comment && !IGNORED_SYSTEM_COMMENTS.has(comment);
    });

  const comment = latestLog?.comment || project?.reviewComment || '';
  if (!comment) return null;

  return {
    comment,
    action: latestLog?.action || 'review_comment',
    actor: getUserLabel(latestLog?.performedBy || project?.reviewStartedBy || project?.rejectedBy || project?.approvedBy),
    date: latestLog?.timestamp || latestLog?.createdAt || project?.reviewedAt || project?.updatedAt,
  };
}

export function adaptProject(project) {
  const id = project?._id || project?.id;
  const normalizedStatus = normalizeProjectStatus(project?.status);
  const latestReviewRemarks = getLatestReviewRemarks(project);

  return {
    ...project,

    // canonical ids
    _id: id,
    id,

    // normalized fields
    name: project?.name || project?.title || 'Untitled Project',
    title: project?.name || project?.title || 'Untitled Project',
    chartType: project?.chartType || project?.type || 'forecast',

    // IMPORTANT: normalized status
    status: normalizedStatus,
    rawStatus: project?.status,

    // normalized review feedback
    latestReviewRemarks,
    latestReviewComment: latestReviewRemarks?.comment || '',

    // normalized owner
    ownerDisplay:
      typeof project?.owner === 'string'
        ? project.owner
        : `${project?.owner?.firstName ?? ''} ${project?.owner?.lastName ?? ''}`.trim() ||
          project?.owner?.email ||
          'Project Owner',
  };
}

export function adaptProjects(projects = []) {
  return projects.map(adaptProject);
}
