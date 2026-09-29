import SiteSettings from '../models/SiteSettings.js';
import {
  FORECAST_CHART_TYPES,
  formatLocalDateKey,
} from './forecastPackage.js';

export const DEFAULT_FORECAST_NAMING = Object.freeze({
  forecastPackageNameTemplate: 'Marine Forecast {date}',
  waveAnalysisNameTemplate: '{package} - Wave Analysis',
  forecast24hNameTemplate: '{package} - 24h Wave Forecast',
  forecast36hNameTemplate: '{package} - 36h Wave Forecast',
  forecast48hNameTemplate: '{package} - 48h Wave Forecast',
});

const TEMPLATE_FIELD_BY_CHART_TYPE = Object.freeze({
  [FORECAST_CHART_TYPES.WAVE_ANALYSIS]: 'waveAnalysisNameTemplate',
  [FORECAST_CHART_TYPES.FORECAST_24H]: 'forecast24hNameTemplate',
  [FORECAST_CHART_TYPES.FORECAST_36H]: 'forecast36hNameTemplate',
  [FORECAST_CHART_TYPES.FORECAST_48H]: 'forecast48hNameTemplate',
});

function renderTemplate(template, values) {
  return String(template || '').replace(/\{([a-zA-Z0-9_]+)\}/g, (match, token) =>
    Object.prototype.hasOwnProperty.call(values, token) ? String(values[token]) : match
  );
}

export async function loadForecastNamingSettings() {
  const doc = await SiteSettings.findOne({ page: 'operations' }).lean();
  return {
    ...DEFAULT_FORECAST_NAMING,
    ...(doc?.data || {}),
  };
}

export function resolveForecastNames({
  forecastDate,
  settings = DEFAULT_FORECAST_NAMING,
  packageNameOverride = '',
} = {}) {
  const date = formatLocalDateKey(forecastDate);
  if (!date) return null;

  const config = { ...DEFAULT_FORECAST_NAMING, ...(settings || {}) };
  const generatedPackageName = renderTemplate(config.forecastPackageNameTemplate, { date }).trim();
  const packageName = String(packageNameOverride || generatedPackageName).trim();
  if (!packageName) return null;

  const chartNames = Object.fromEntries(
    Object.entries(TEMPLATE_FIELD_BY_CHART_TYPE).map(([chartType, field]) => [
      chartType,
      renderTemplate(config[field], { date, package: packageName }).trim(),
    ])
  );

  return { date, packageName, chartNames };
}
