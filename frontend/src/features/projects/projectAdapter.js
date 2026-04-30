import { normalizeProjectStatus } from './projectStatuses';

export function adaptProject(project) {
  const id = project?._id || project?.id;

  const normalizedStatus = normalizeProjectStatus(project?.status);

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
