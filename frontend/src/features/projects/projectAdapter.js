import { normalizeProjectStatus } from './projectStatuses';

const IGNORED_SYSTEM_COMMENTS = new Set([
  'Project created',
  'Submitted for review',
  'Project review started',
  'Project approved',
  'Project published',
  'Project archived',
]);

export const FORECAST_CHART_LABELS = {
  analysis: 'Wave Analysis',
  forecast_24h: '24h Wave Forecast',
  forecast_36h: '36h Wave Forecast',
  forecast_48h: '48h Wave Forecast',
};

const FORECAST_CHART_ORDER = ['analysis', 'forecast_24h', 'forecast_36h', 'forecast_48h'];

function getUserLabel(user) {
  if (!user) return '';
  if (typeof user === 'string') return user;
  return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.username || user.email || '';
}

function getForecastProjectId(project) {
  return project?.forecastProjectId || project?._id || project?.id;
}

function sortForecastCharts(charts = []) {
  return [...charts].sort((a, b) => {
    const aIndex = FORECAST_CHART_ORDER.indexOf(a?.chartType);
    const bIndex = FORECAST_CHART_ORDER.indexOf(b?.chartType);
    return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
  });
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
  const forecastCharts = sortForecastCharts(project?.forecastCharts || []);
  const forecastProjectId = getForecastProjectId(project);
  const forecastProjectName = project?.forecastProjectName || project?.name || project?.title || 'Untitled Forecast Project';

  return {
    ...project,

    // canonical ids
    _id: id,
    id,

    // normalized fields
    forecastProjectId,
    forecastProjectName,
    forecastCharts,
    name: project?.displayName || forecastProjectName,
    title: project?.displayName || forecastProjectName,
    chartType: project?.chartSummary || project?.chartType || project?.type || 'forecast',
    chartLabel: FORECAST_CHART_LABELS[project?.chartType] || project?.chartType || 'Forecast Chart',
    primaryChartId: project?.primaryChartId || id,
    isForecastPackage: Boolean(project?.forecastProjectId || forecastCharts.length > 1),

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
  const grouped = new Map();

  projects.forEach((project) => {
    const groupId = String(getForecastProjectId(project));
    const existing = grouped.get(groupId);
    if (!existing) {
      grouped.set(groupId, {
        ...project,
        displayName: project?.forecastProjectName || project?.name || project?.title,
        forecastCharts: [project],
      });
      return;
    }

    existing.forecastCharts.push(project);

    const existingTime = new Date(existing.updatedAt || existing.submittedAt || existing.createdAt || 0).getTime();
    const projectTime = new Date(project?.updatedAt || project?.submittedAt || project?.createdAt || 0).getTime();
    if (projectTime > existingTime) {
      Object.assign(existing, {
        ...project,
        displayName: project?.forecastProjectName || existing.displayName || project?.name || project?.title,
        forecastCharts: existing.forecastCharts,
      });
    }
  });

  return [...grouped.values()].map((group) => {
    const sortedCharts = sortForecastCharts(group.forecastCharts);
    const primaryChart = sortedCharts[0] || group;
    return adaptProject({
      ...group,
      _id: primaryChart?._id || group._id,
      id: primaryChart?.id || primaryChart?._id || group.id,
      primaryChartId: primaryChart?._id || primaryChart?.id || group._id || group.id,
      forecastProjectId: group.forecastProjectId || primaryChart?.forecastProjectId || group._id || group.id,
      forecastProjectName: group.forecastProjectName || group.displayName,
      chartSummary: sortedCharts.length > 1 ? `${sortedCharts.length} charts` : FORECAST_CHART_LABELS[primaryChart?.chartType] || primaryChart?.chartType,
      forecastCharts: sortedCharts,
    });
  });
}
