export function getProjectId(project) {
  return project?.primaryChartId || project?._id || project?.id;
}

export function getProjectFromResponse(data, fallbackProject) {
  return data?.project || data?.data?.project || data?.data || data || fallbackProject;
}
