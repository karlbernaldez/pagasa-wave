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

export function getForecastChartLabel(chartType) {
  return REQUIRED_FORECAST_CHARTS.find((chart) => chart.chartType === chartType)?.label || chartType;
}

export function normalizeForecastDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

export function buildForecastPackageName(forecastDate) {
  const date = normalizeForecastDate(forecastDate);
  if (!date) return null;
  return `Marine Forecast ${date.toISOString().slice(0, 10)}`;
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
