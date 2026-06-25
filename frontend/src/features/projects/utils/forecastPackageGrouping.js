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

export function getDateKey(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toISOString().slice(0, 10);
}

export function formatPackageDate(dateKey) {
  if (!dateKey) return 'Unscheduled package';

  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${dateKey}T00:00:00`));
}

function getPackageStatus(charts) {
  if (charts.some((chart) => REVIEW_STATUSES.has(chart.status))) return 'Needs Review';
  if (charts.some((chart) => RETURNED_STATUSES.has(chart.status))) return 'Returned';
  if (charts.length > 0 && charts.every((chart) => APPROVED_STATUSES.has(chart.status))) return 'Approved';
  if (charts.length > 0 && charts.every((chart) => FINAL_STATUSES.has(chart.status))) return 'Closed';
  return 'In Progress';
}

function getOwnerLabel(charts) {
  const owners = [...new Set(charts.map((chart) => chart.ownerDisplay).filter(Boolean))];
  if (owners.length === 0) return 'Forecast team';
  if (owners.length === 1) return owners[0];
  return `${owners.length} forecasters`;
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
      const charts = [...forecastPackage.charts].sort(
        (a, b) => CHART_ORDER.indexOf(a.chartType) - CHART_ORDER.indexOf(b.chartType),
      );
      const pendingCharts = charts.filter((chart) => REVIEW_STATUSES.has(chart.status));
      const approvedCharts = charts.filter((chart) => APPROVED_STATUSES.has(chart.status));
      const returnedCharts = charts.filter((chart) => RETURNED_STATUSES.has(chart.status));

      return {
        ...forecastPackage,
        charts,
        ownerLabel: getOwnerLabel(charts),
        status: getPackageStatus(charts),
        chartCount: charts.length,
        pendingCount: pendingCharts.length,
        approvedCount: approvedCharts.length,
        returnedCount: returnedCharts.length,
        primaryChart: pendingCharts[0] || charts.find((chart) => !FINAL_STATUSES.has(chart.status)) || charts[0],
        updatedAt: charts.reduce((latest, chart) => {
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
