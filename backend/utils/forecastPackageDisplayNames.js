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
  const currentName = String(name || '');
  return !currentName || AUTO_CHART_NAME_PATTERN.test(currentName);
}

export function applyForecastPackageDisplayNames(forecastPackage) {
  if (!forecastPackage?.forecastDate) return forecastPackage;

  const canonicalPackageName = buildForecastPackageName(forecastPackage.forecastDate);
  const normalizedPackage = {
    ...forecastPackage,
    name:
      canonicalPackageName && shouldUseCanonicalPackageName(forecastPackage.name)
        ? canonicalPackageName
        : forecastPackage.name,
  };

  normalizedPackage.charts = (forecastPackage.charts || []).map((chart) => {
    const project = chart?.project;
    if (!project || typeof project !== 'object') return chart;

    const canonicalProjectName = buildForecastChartProjectName(
      forecastPackage.forecastDate,
      getForecastChartLabel(chart.chartType)
    );

    if (!canonicalProjectName || !shouldUseCanonicalChartName(project.name)) return chart;

    return {
      ...chart,
      project: {
        ...project,
        name: canonicalProjectName,
      },
    };
  });

  return normalizedPackage;
}
