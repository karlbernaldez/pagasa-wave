const CHART_ORDER = ['analysis', 'forecast_24h', 'forecast_36h', 'forecast_48h'];

export const CHART_LABELS = {
  analysis: 'Wave Analysis',
  forecast_24h: '24h Forecast',
  forecast_36h: '36h Forecast',
  forecast_48h: '48h Forecast',
};

const REVIEW_STATUSES = new Set(['Submitted', 'Under Review']);
const APPROVED_STATUSES = new Set(['Approved', 'Published']);
const RETURNED_STATUSES = new Set(['Rejected', 'Revision Requested']);
const FINAL_STATUSES = new Set(['Approved', 'Published', 'Rejected', 'Archived']);
const FORECAST_TIME_ZONE = 'Asia/Manila';

function displayPackageStatus(status) {
  return status === 'Draft' ? 'In Production' : status;
}

export function getDateKey(value, timeZone = FORECAST_TIME_ZONE) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const getPart = (type) => parts.find((part) => part.type === type)?.value || '';
  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  return year && month && day ? `${year}-${month}-${day}` : '';
}

export function formatPackageDate(dateKey) {
  if (!dateKey) return 'Unscheduled package';
  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: FORECAST_TIME_ZONE,
  }).format(new Date(`${dateKey}T00:00:00+08:00`));
}

function getPackageStatus(charts) {
  if (charts.some((chart) => chart.status === 'Under Review')) return 'Under Review';
  if (charts.some((chart) => chart.status === 'Submitted')) return 'Submitted';
  if (charts.some((chart) => RETURNED_STATUSES.has(chart.status))) return 'Revision Requested';
  if (charts.length > 0 && charts.every((chart) => APPROVED_STATUSES.has(chart.status))) return 'Approved';
  if (charts.length > 0 && charts.every((chart) => FINAL_STATUSES.has(chart.status))) return 'Closed';
  return 'In Production';
}

function getUserLabel(user) {
  if (!user || typeof user === 'string') return '';
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name || user.username || user.email || '';
}

function addUserLabel(labels, user) {
  const label = getUserLabel(user);
  if (label) labels.add(label);
}

function getContributorNames(forecastPackage, charts) {
  const labels = new Set();

  charts.forEach((chart) => {
    (chart.participants || []).forEach((participant) => addUserLabel(labels, participant?.user));
    (chart.activeEditors || []).forEach((editor) => addUserLabel(labels, editor?.user));
    (chart.readyEditors || []).forEach((editor) => addUserLabel(labels, editor?.user));
    addUserLabel(labels, chart.readyBy);
  });

  (forecastPackage?.chartCompletion || []).forEach((row) => addUserLabel(labels, row?.completedBy));

  if (labels.size === 0) {
    charts.forEach((chart) => addUserLabel(labels, chart.project?.owner));
  }

  return [...labels];
}

export function formatContributorSummary(names = [], visibleCount = 2) {
  if (!names.length) return 'No recorded contributors';
  const visible = names.slice(0, visibleCount);
  const remaining = names.length - visible.length;
  return remaining > 0 ? `${visible.join(', ')} +${remaining}` : visible.join(', ');
}

function normalizeChartProject(project, chartType) {
  if (!project || typeof project === 'string') {
    return {
      _id: project,
      id: project,
      chartType,
      name: CHART_LABELS[chartType] || chartType || 'Forecast Chart',
      title: CHART_LABELS[chartType] || chartType || 'Forecast Chart',
      status: 'Draft',
    };
  }
  const id = project._id || project.id;
  return {
    ...project,
    _id: id,
    id,
    chartType: project.chartType || chartType,
    name: project.name || project.title || CHART_LABELS[chartType] || 'Forecast Chart',
    title: project.name || project.title || CHART_LABELS[chartType] || 'Forecast Chart',
  };
}

export function adaptForecastPackageModel(forecastPackage) {
  const id = forecastPackage?._id || forecastPackage?.id;
  const dateKey = getDateKey(forecastPackage?.forecastDate || forecastPackage?.createdAt);
  const charts = (forecastPackage?.charts || [])
    .map((chart) => ({ ...chart, project: normalizeChartProject(chart.project, chart.chartType) }))
    .sort(
      (a, b) =>
        (a.sortOrder ?? CHART_ORDER.indexOf(a.chartType)) -
        (b.sortOrder ?? CHART_ORDER.indexOf(b.chartType))
    );
  const chartProjects = charts.map((chart) => chart.project);
  const pendingCharts = chartProjects.filter((chart) => REVIEW_STATUSES.has(chart.status));
  const approvedCharts = chartProjects.filter((chart) => APPROVED_STATUSES.has(chart.status));
  const returnedCharts = chartProjects.filter((chart) => RETURNED_STATUSES.has(chart.status));
  const primaryChartRow = charts.find((chart) => REVIEW_STATUSES.has(chart.project?.status)) || charts[0];
  const derivedStatus =
    forecastPackage?.displayStatus || displayPackageStatus(forecastPackage?.status) || getPackageStatus(chartProjects);
  const contributorNames = getContributorNames(forecastPackage, charts);

  return {
    ...forecastPackage,
    id,
    _id: id,
    dateKey,
    title:
      forecastPackage?.name ||
      (dateKey ? `${formatPackageDate(dateKey)} Forecast Package` : 'Forecast Package'),
    status: derivedStatus,
    rawStatus: forecastPackage?.status,
    charts,
    chartProjects,
    contributorNames,
    contributorLabel: formatContributorSummary(contributorNames),
    contributorCount: contributorNames.length,
    chartCount: charts.length,
    pendingCount: pendingCharts.length,
    approvedCount: approvedCharts.length,
    returnedCount: returnedCharts.length,
    primaryChart: primaryChartRow?.project,
    updatedAt: new Date(
      forecastPackage?.updatedAt || forecastPackage?.submittedAt || forecastPackage?.createdAt || 0
    ).getTime(),
  };
}

export function groupForecastPackages(projects = []) {
  const groups = new Map();
  projects.forEach((project) => {
    const dateKey = getDateKey(project?.forecastDate || project?.createdAt);
    const key = dateKey || 'unscheduled';
    if (!groups.has(key)) {
      groups.set(key, {
        id: key,
        dateKey,
        title: dateKey ? `${formatPackageDate(dateKey)} Forecast Package` : 'Unscheduled Forecast Package',
        charts: [],
      });
    }
    groups.get(key).charts.push(project);
  });

  return [...groups.values()]
    .map((forecastPackage) => {
      const chartProjects = [...forecastPackage.charts].sort(
        (a, b) => CHART_ORDER.indexOf(a.chartType) - CHART_ORDER.indexOf(b.chartType)
      );
      const pendingCharts = chartProjects.filter((chart) => REVIEW_STATUSES.has(chart.status));
      const approvedCharts = chartProjects.filter((chart) => APPROVED_STATUSES.has(chart.status));
      const returnedCharts = chartProjects.filter((chart) => RETURNED_STATUSES.has(chart.status));
      const contributorNames = [
        ...new Set(chartProjects.map((chart) => getUserLabel(chart.owner)).filter(Boolean)),
      ];

      return {
        ...forecastPackage,
        charts: chartProjects.map((project) => ({ chartType: project.chartType, project })),
        chartProjects,
        contributorNames,
        contributorLabel: formatContributorSummary(contributorNames),
        contributorCount: contributorNames.length,
        status: getPackageStatus(chartProjects),
        chartCount: chartProjects.length,
        pendingCount: pendingCharts.length,
        approvedCount: approvedCharts.length,
        returnedCount: returnedCharts.length,
        primaryChart:
          pendingCharts[0] ||
          chartProjects.find((chart) => !FINAL_STATUSES.has(chart.status)) ||
          chartProjects[0],
        updatedAt: chartProjects.reduce((latest, chart) => {
          const timestamp = new Date(chart.updatedAt || chart.submittedAt || chart.createdAt || 0).getTime();
          return Math.max(latest, Number.isNaN(timestamp) ? 0 : timestamp);
        }, 0),
      };
    })
    .sort((a, b) => {
      const dailyDelta = Number(isDailyForecastPackage(b)) - Number(isDailyForecastPackage(a));
      if (dailyDelta !== 0) return dailyDelta;
      if (a.dateKey !== b.dateKey) return b.dateKey.localeCompare(a.dateKey);
      return b.updatedAt - a.updatedAt;
    });
}

export function isDailyForecastPackage(target) {
  const todayKey = getDateKey(new Date());
  const targetDateKey = target?.dateKey || getDateKey(target?.forecastDate || target?.createdAt);
  return Boolean(targetDateKey && targetDateKey === todayKey);
}
