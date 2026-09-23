import { REQUIRED_FORECAST_CHARTS } from './forecastPackage.js';

export const FORECAST_ANALYTICS_STATUSES = Object.freeze([
  'Submitted',
  'Under Review',
  'Revision Requested',
  'Approved',
  'Published',
  'Rejected',
  'Archived',
]);

const chartTypeByHorizon = new Map(
  REQUIRED_FORECAST_CHARTS.map((chart) => [
    chart.chartType === 'analysis'
      ? '0'
      : String(Number(String(chart.chartType).match(/forecast_(\d+)h/)?.[1])),
    chart.chartType,
  ])
);

const allowedChartTypes = new Set(REQUIRED_FORECAST_CHARTS.map((chart) => chart.chartType));
const allowedStatuses = new Set(FORECAST_ANALYTICS_STATUSES);

const badRequest = (message) => {
  const error = new Error(message);
  error.status = 400;
  throw error;
};

const normalizeOptional = (value) => {
  const normalized = String(value ?? '').trim();
  return !normalized || normalized === 'all' ? null : normalized;
};

export function parseForecastAnalyticsFilters(query = {}) {
  const status = normalizeOptional(query.status);
  const requestedChartType = normalizeOptional(query.chartType);
  const horizon = normalizeOptional(query.horizon);

  if (status && !allowedStatuses.has(status)) {
    badRequest('Unsupported forecast analytics status filter.');
  }

  if (requestedChartType && !allowedChartTypes.has(requestedChartType)) {
    badRequest('Unsupported forecast analytics chartType filter.');
  }

  let horizonChartType = null;
  if (horizon) {
    horizonChartType = chartTypeByHorizon.get(horizon);
    if (!horizonChartType) {
      badRequest('horizon must be one of 0, 24, 36, or 48.');
    }
  }

  if (requestedChartType && horizonChartType && requestedChartType !== horizonChartType) {
    badRequest('chartType and horizon filters must refer to the same forecast chart.');
  }

  const chartType = requestedChartType || horizonChartType;
  const chartDefinition = chartType
    ? REQUIRED_FORECAST_CHARTS.find((chart) => chart.chartType === chartType)
    : null;

  return {
    status,
    chartType: chartType || null,
    horizonHours: chartDefinition
      ? chartDefinition.chartType === 'analysis'
        ? 0
        : Number(String(chartDefinition.chartType).match(/forecast_(\d+)h/)?.[1]) || null
      : null,
    unit: chartType ? 'chart' : 'package',
  };
}

export function serializeForecastAnalyticsFilters(filters = {}) {
  return {
    status: filters.status || null,
    chartType: filters.chartType || null,
    horizonHours: filters.horizonHours ?? null,
    unit: filters.unit === 'chart' ? 'chart' : 'package',
  };
}

export const FORECAST_ANALYTICS_FILTER_OPTIONS = Object.freeze({
  statuses: FORECAST_ANALYTICS_STATUSES,
  chartTypes: REQUIRED_FORECAST_CHARTS.map((chart) => ({
    chartType: chart.chartType,
    label: chart.label,
    horizonHours:
      chart.chartType === 'analysis'
        ? 0
        : Number(String(chart.chartType).match(/forecast_(\d+)h/)?.[1]) || null,
  })),
});
