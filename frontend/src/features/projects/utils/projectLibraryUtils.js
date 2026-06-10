export function getCreatedProjectId(response) {
  if (response?.project?._id) return response.project._id;
  if (response?.project?.id) return response.project.id;

  if (response?._id) return response._id;
  if (response?.id) return response.id;

  return null;
}

export function getProjectId(project) {
  return project?._id || project?.id;
}

export function getReviewModalProject(project) {
  if (!project) return project;

  const { reviewComment: _rc, ...rest } = project;

  return rest;
}