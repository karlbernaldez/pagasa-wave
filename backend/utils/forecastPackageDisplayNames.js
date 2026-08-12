import {
  buildForecastChartProjectName,
  buildForecastPackageName,
  getForecastChartLabel,
} from './forecastPackage.js';

const AUTO_PACKAGE_NAME_PATTERN = /^Marine Forecast \d{4}-\d{2}-\d{2}$/;
const AUTO_CHART_NAME_PATTERN = /^Marine Forecast \d{4}-\d{2}-\d{2} - /;

function shouldUseCanonicalPackageName(name) {
  const currentName = String(name || '');
  return !currentName || AUTO_PACKAGE_NAME_PATTERN.test(currentName);
}

function shouldUseCanonicalChartName(name) {
  const