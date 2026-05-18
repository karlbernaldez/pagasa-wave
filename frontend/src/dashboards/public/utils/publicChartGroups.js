export const PUBLIC_CHART_TYPE_FILTER_ALL = 'all';

export const PUBLIC_CHART_SLOTS = [
  {
    chartType: 'analysis',
    badge: 'Analysis',
    title: 'Analysis Chart',
    fallbackTitle: 'Current Analysis',
  },
  {
    chartType: 'forecast_24h',
    badge: '24h',
    title: '24-Hour Chart',
    fallbackTitle: '24-Hour Wave Chart',
  },
  {
    chartType: 'forecast_36h',
    badge: '36h',
    title: '36-Hour Chart',
    fallbackTitle: '36-Hour Wave Chart',
  },
  {
    chartType: 'forecast_48h',
    badge: '48h',
    title: '48-Hour Chart',
    fallbackTitle: '48-Hour Wave Chart',
  },
];

export const PUBLIC_CHART_TYPE_FILTERS = [
  { id: PUBLIC_CHART_TYPE_FILTER_ALL, label: 'All charts', shortLabel: 'All' },
  ...PUBLIC_CHART_SLOTS.map((slot) => ({
    id: slot.chartType,
    label: slot.title,
    shortLabel: slot.badge,
  })),
];

export function normalizePublicChartTypeFilter(value) {
  return PUBLIC_CHART_TYPE_FILTERS.some((filter) => filter.id === value)
    ? value
    : PUBLIC_CHART_TYPE_FILTER_ALL;
}

export function toPublicChartDateKey(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export function getPublicChartTenDayWindow(projects = []) {
  const latestDate = projects.reduce((latest, project) => {
    const key = toPublicChartDateKey(project?.forecastDate);
    if (!key) return latest;
    return !latest || key > latest ? key : latest;
  }, '');

  if (!latestDate) return { latestDate: '', startDate: '' };

  const start = new Date(`${latestDate}T00:00:00.000Z`);
  start.setUTCDate(start.getUTCDate() - 10);

  return {
    latestDate,
    startDate: start.toISOString().slice(0, 10),
  };
}

export function filterProjectsToPublicChartWindow(projects = [], window = getPublicChartTenDayWindow(projects)) {
  const { latestDate, startDate } = window;
  if (!latestDate || !startDate) return projects;

  return projects.filter((project) => {
    const key = toPublicChartDateKey(project?.forecastDate);
    return key && key >= startDate && key <= latestDate;
  });
}

export function filterProjectsByPublicChartType(projects = [], chartTypeFilter = PUBLIC_CHART_TYPE_FILTER_ALL) {
  const normalizedFilter = normalizePublicChartTypeFilter(chartTypeFilter);
  if (normalizedFilter === PUBLIC_CHART_TYPE_FILTER_ALL) return projects;
  return projects.filter((project) => project?.chartType === normalizedFilter);
}

export function getFilteredPublicChartSlots(chartTypeFilter = PUBLIC_CHART_TYPE_FILTER_ALL) {
  const normalizedFilter = normalizePublicChartTypeFilter(chartTypeFilter);
  if (normalizedFilter === PUBLIC_CHART_TYPE_FILTER_ALL) return PUBLIC_CHART_SLOTS;
  return PUBLIC_CHART_SLOTS.filter((slot) => slot.chartType === normalizedFilter);
}

export function groupPublicChartsByTypeForDate(projects = [], dateKey = '') {
  const byType = new Map();

  projects
    .filter((project) => toPublicChartDateKey(project?.forecastDate) === dateKey)
    .sort((a, b) => new Date(b?.publishedAt || b?.updatedAt || 0) - new Date(a?.publishedAt || a?.updatedAt || 0))
    .forEach((project) => {
      if (!byType.has(project.chartType)) byType.set(project.chartType, project);
    });

  return byType;
}

export function getPublicChartAvailableCount(chartByType, slots = PUBLIC_CHART_SLOTS) {
  return slots.filter((slot) => chartByType.has(slot.chartType)).length;
}

export function getPublicChartCompleteness(chartByType, slots = PUBLIC_CHART_SLOTS) {
  const availableCount = getPublicChartAvailableCount(chartByType, slots);
  const totalCount = slots.length;

  return {
    availableCount,
    totalCount,
    isComplete: totalCount > 0 && availableCount === totalCount,
    isEmpty: availableCount === 0,
  };
}

export function groupPublicChartHistory(projects = [], slots = PUBLIC_CHART_SLOTS) {
  const slotTypes = new Set(slots.map((slot) => slot.chartType));
  const map = new Map();

  projects.forEach((project) => {
    const key = toPublicChartDateKey(project?.forecastDate);
    if (!key || !slotTypes.has(project?.chartType)) return;

    const entry = map.get(key) || {
      dateKey: key,
      count: 0,
      availableTypes: new Set(),
    };

    entry.count += 1;
    entry.availableTypes.add(project.chartType);
    map.set(key, entry);
  });

  return [...map.values()]
    .map((entry) => ({
      dateKey: entry.dateKey,
      count: entry.count,
      availableCount: slots.filter((slot) => entry.availableTypes.has(slot.chartType)).length,
      totalCount: slots.length,
      isComplete: slots.length > 0 && slots.every((slot) => entry.availableTypes.has(slot.chartType)),
      availableChartTypes: [...entry.availableTypes],
    }))
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey));
}

export function getBestPublicChartDateForFilter(projects = [], chartTypeFilter = PUBLIC_CHART_TYPE_FILTER_ALL) {
  const filteredProjects = filterProjectsByPublicChartType(projects, chartTypeFilter);
  return filteredProjects.reduce((latest, project) => {
    const key = toPublicChartDateKey(project?.forecastDate);
    if (!key) return latest;
    return !latest || key > latest ? key : latest;
  }, '');
}

export function isPublicChartDateAvailable(projects = [], dateKey = '', chartTypeFilter = PUBLIC_CHART_TYPE_FILTER_ALL) {
  if (!dateKey) return false;
  return filterProjectsByPublicChartType(projects, chartTypeFilter).some((project) => toPublicChartDateKey(project?.forecastDate) === dateKey);
}

export function isEmptyPublicChartDescription(value) {
  return /^no published .+ chart is available for this date yet\.?$/i.test(String(value || '').trim());
}

export function getPublicChartCardDescription({ chart, slot, hasChart, formatDate, getPersonName }) {
  if (!hasChart) return `No published ${slot.title.toLowerCase()} is available for this date yet.`;

  const description = String(chart?.description || '').trim();
  if (description && !isEmptyPublicChartDescription(description)) return description;

  return `${slot.title} for ${formatDate(chart?.forecastDate)} published by ${getPersonName(chart?.owner)}.`;
}
