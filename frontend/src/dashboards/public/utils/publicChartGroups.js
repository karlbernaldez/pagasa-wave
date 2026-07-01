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

const PUBLIC_CHART_TIME_ZONE = 'Asia/Manila';

function padDatePart(value) {
  return String(value).padStart(2, '0');
}

function getDatePartsInPhilippines(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: PUBLIC_CHART_TIME_ZONE,
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
    key: `${year}-${month}-${day}`,
  };
}

function shiftDateKey(dateKey, days) {
  const parts = String(dateKey || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!parts) return '';
  const [, year, month, day] = parts;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0));
  date.setUTCDate(date.getUTCDate() + days);
  return `${date.getUTCFullYear()}-${padDatePart(date.getUTCMonth() + 1)}-${padDatePart(date.getUTCDate())}`;
}

export function toPublicChartDateKey(value) {
  return getDatePartsInPhilippines(value)?.key || '';
}

export function getPublicChartTenDayWindow(projects = []) {
  const latestDate = projects.reduce((latest, project) => {
    const key = toPublicChartDateKey(project?.forecastDate);
    if (!key) return latest;
    return !latest || key > latest ? key : latest;
  }, '');

  if (!latestDate) return { latestDate: '', startDate: '' };

  return {
    latestDate,
    startDate: shiftDateKey(latestDate, -10),
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

export function filterProjectsToPublicChartArchive(projects = [], window = getPublicChartTenDayWindow(projects)) {
  const { startDate } = window;
  if (!startDate) return [];

  return projects.filter((project) => {
    const key = toPublicChartDateKey(project?.forecastDate);
    return key && key < startDate;
  });
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

export function getPublicChartArchiveHistory(projects = [], window = getPublicChartTenDayWindow(projects), slots = PUBLIC_CHART_SLOTS) {
  return groupPublicChartHistory(filterProjectsToPublicChartArchive(projects, window), slots);
}

export function getPublicChartForSlot(projects = [], dateKey = '', chartType = '') {
  return groupPublicChartsByTypeForDate(projects, dateKey).get(chartType) || null;
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
