import SiteSettings from '../models/SiteSettings.js';
import {
  FORECAST_CHART_TYPES,
  formatLocalDateKey,
} from '../utils/forecastPackage.js';

export const DEFAULT_FORECAST_NAMING = Object.freeze({
  packageNameTemplate: 'Marine Forecast {date}',
  analysisChartNameTemplate: '{package} - Wave Analysis',
  forecast24ChartNameTemplate: '{package} - 24h Wave Forecast',
  forecast36ChartNameTemplate: '{package} - 36h Wave Forecast',
  forecast48ChartNameTemplate: '{package} - 48h Wave Forecast',
});

const CHART_TEMPLATE_FIELD_BY_TYPE = Object.freeze({
  [FORECAST_CHART_TYPES.WAVE_ANALYSIS]: 'analysisChartNameTemplate',
  [FORECAST_CHART_TYPES.FORECAST_24H]: 'forecast24ChartNameTemplate',
  [FORECAST_CHART_TYPES.FORECAST_36H]: 'forecast36ChartNameTemplate',
  [FORECAST_CHART_TYPES.FORECAST_48H]: 'forecast48ChartNameTemplate',
});

function renderTemplate(template, values) {
  return String(template || '').replace(/\{([a-zA-Z0-9_]+)\}/g, (match, token) =>
    Object.prototype.hasOwnProperty.call(values, token) ? String(values[token] ?? '') : match
  );
}

export async function loadForecastNamingSettings({ settingsModel = SiteSettings } = {}) {
  const document = await settingsModel.findOne({ page: 'operations' }).lean();
  return {
    ...DEFAULT_FORECAST_NAMING,
    ...(document?.data || {}),
  };
}

export function resolveForecastNames({
  forecastDate,
  settings = DEFAULT_FORECAST_NAMING,
  packageNameOverride = '',
} = {}) {
  const date = formatLocalDateKey(forecastDate);
  if (!date) return null;

  const resolvedSettings = {
    ...DEFAULT_FORECAST_NAMING,
    ...(settings || {}),
  };

  const generatedPackageName = renderTemplate(resolvedSettings.packageNameTemplate, { date }).trim();
  const packageName = String(packageNameOverride || generatedPackageName).trim();
  if (!packageName) return null;

  const chartNames = Object.fromEntries(
    Object.entries(CHART_TEMPLATE_FIELD_BY_TYPE).map(([chartType, field]) => [
      chartType,
      renderTemplate(resolvedSettings[field], {
        date,
        package: packageName,
      }).trim(),
    ])
  );

  return {
    date,
    packageName,
    chartNames,
  };
}
