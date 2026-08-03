export const FORECAST_PACKAGE_STATUS = Object.freeze({
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  REVISION_REQUESTED: 'Revision Requested',
  APPROVED: 'Approved',
  PUBLISHED: 'Published',
  REJECTED: 'Rejected',
  ARCHIVED: 'Archived',
});

export const FORECAST_CHART_TYPES = Object.freeze({
  WAVE_ANALYSIS: 'analysis',
  FORECAST_24H: 'forecast_24h',
  FORECAST_36H: 'forecast_36h',
  FORECAST_48H: 'forecast_48h',
});

export const REQUIRED_FORECAST_CHARTS = Object.freeze([
  {
    chartType: FORECAST_CHART_TYPES.WAVE_ANALYSIS,
    label: 'Wave Analysis',
    sortOrder: 1,
  },
  {
    chartType: FORECAST_CHART_TYPES.FORECAST_24H,
    label: '24h Wave Forecast',
    sortOrder: 2,
  },
  {
    chartType: FORECAST_CHART_TYPES.FORECAST_36H,
    label: '36h Wave Forecast',
    sortOrder: 3,
  },
  {
    chartType: FORECAST_CHART_TYPES.FORECAST_48H,
    label: '48h Wave Forecast',
    sortOrder: 4,
  },
]);

export const REQUIRED_FORECAST_CHART_TYPES = Object.freeze(
  REQUIRED_FORECAST_CHARTS.map((chart) => chart.chartType)
);

export const ADMIN_DRAFT_PACKAGE_LABEL = 'In Production';

const FORECAST_TIME_ZONE = 'Asia/Manila';
const PHILIPPINES_UTC_OFFSET_HOURS = 8;
const PROJECT_STATUSES = Object.freeze({
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  REVISION_REQUESTED: 'Revision Requested',
  APPROVED: 'Approved',
  PUBLISHED: 'Published',
  REJECTED: 'Rejected',
  NO_PUBLICATION: 'No Publication',
  ARCHIVED: 'Archived',
});

export function getForecastChartLabel(chartType) {
  return (
    REQUIRED_FORECAST_CHARTS.find((chart) => chart.chartType === chartType)?.label || chartType
  );
}

function getChartProjectStatus(chart) {
  const project = chart?.project;
  if (project && typeof project === 'object') return project.status || PROJECT_STATUSES.DRAFT;
  return chart?.status || PROJECT_STATUSES.DRAFT;
}

function getRequiredChartStatuses(forecastPackage) {
  const charts = Array.isArray(forecastPackage?.charts) ? forecastPackage.charts : [];

  return REQUIRED_FORECAST_CHART_TYPES.map((chartType) => {
    const chart = charts.find((candidate) => candidate.chartType === chartType);
    return chart?.project ? getChartProjectStatus(chart) : PROJECT_STATUSES.DRAFT;
  });
}

export function deriveForecastPackageStatusFromCharts(forecastPackage) {
  if (forecastPackage?.status === FORECAST_PACKAGE_STATUS.ARCHIVED) {
    return FORECAST_PACKAGE_STATUS.ARCHIVED;
  }

  if (forecastPackage?.status === FORECAST_PACKAGE_STATUS.REVISION_REQUESTED) {
    return FORECAST_PACKAGE_STATUS.REVISION_REQUESTED;
  }

  const statuses = getRequiredChartStatuses(forecastPackage);
  if (statuses.length === 0) return FORECAST_PACKAGE_STATUS.DRAFT;

  if (statuses.every((status) => status === PROJECT_STATUSES.PUBLISHED)) {
    return FORECAST_PACKAGE_STATUS.PUBLISHED;
  }

  if (
    statuses.every((status) =>
      [PROJECT_STATUSES.APPROVED, PROJECT_STATUSES.PUBLISHED].includes(status)
    )
  ) {
    return FORECAST_PACKAGE_STATUS.APPROVED;
  }

  if (statuses.some((status) => status === PROJECT_STATUSES.REJECTED)) {
    return FORECAST_PACKAGE_STATUS.REJECTED;
  }

  if (statuses.some((status) => status === PROJECT_STATUSES.REVISION_REQUESTED)) {
    return FORECAST_PACKAGE_STATUS.REVISION_REQUESTED;
  }

  if (statuses.some((status) => status === PROJECT_STATUSES.UNDER_REVIEW)) {
    return FORECAST_PACKAGE_STATUS.UNDER_REVIEW;
  }

  if (statuses.some((status) => status === PROJECT_STATUSES.SUBMITTED)) {
    return FORECAST_PACKAGE_STATUS.SUBMITTED;
  }

  return FORECAST_PACKAGE_STATUS.DRAFT;
}

export function getForecastPackageDisplayStatus(status) {
  return status === FORECAST_PACKAGE_STATUS.DRAFT ? ADMIN_DRAFT_PACKAGE_LABEL : status;
}

function padDatePart(value) {
  return String(value).padStart(2, '0');
}

function getTimeZoneDateParts(value, timeZone = FORECAST_TIME_ZONE) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

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
  if (!year || !month || !day) return null;

  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    key: `${year}-${padDatePart(month)}-${padDatePart(day)}`,
  };
}

function parseDateKey(value) {
  const match = String(value || '')
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const [, year, month, day] = match;
  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    key: `${year}-${month}-${day}`,
  };
}

function makePhilippinesOperationalDate({ year, month, day }) {
  const utcTime = Date.UTC(year, month - 1, day, -PHILIPPINES_UTC_OFFSET_HOURS, 0, 0, 0);
  return new Date(utcTime);
}

export function normalizeForecastDate(value) {
  const parts =
    typeof value === 'string'
      ? parseDateKey(value) || getTimeZoneDateParts(value)
      : getTimeZoneDateParts(value || new Date());

  if (!parts) return null;
  return makePhilippinesOperationalDate(parts);
}

export function formatLocalDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return getTimeZoneDateParts(date)?.key || null;
}

export function getTodayForecastDateKey(now = new Date()) {
  return formatLocalDateKey(now);
}

export function buildForecastPackageName(forecastDate) {
  const dateKey = formatLocalDateKey(forecastDate);
  if (!dateKey) return null;
  return `Marine Forecast ${dateKey}`;
}

export function buildForecastChartProjectName(forecastDate, chartLabel) {
  const packageName = buildForecastPackageName(forecastDate);
  return packageName && chartLabel ? `${packageName} - ${chartLabel}` : packageName;
}

export function getPackageCompletion(chartCompletion = []) {
  const required = REQUIRED_FORECAST_CHART_TYPES.length;
  const completed = REQUIRED_FORECAST_CHART_TYPES.filter((chartType) => {
    const row = chartCompletion.find((item) => item.chartType === chartType);
    return Boolean(row?.isComplete);
  }).length;

  return {
    required,
    completed,
    percentage: required === 0 ? 0 : Math.round((completed / required) * 100),
    isComplete: completed === required,
  };
}

export function getMissingRequiredChartTypes(chartIds = [], chartCompletion = []) {
  const chartIdTypes = chartIds.map((item) => item.chartType);
  const completionTypes = chartCompletion.map((item) => item.chartType);
  const presentTypes = new Set([...chartIdTypes, ...completionTypes]);
  return REQUIRED_FORECAST_CHART_TYPES.filter((chartType) => !presentTypes.has(chartType));
}
