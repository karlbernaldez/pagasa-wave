const WW3_FORECAST_OFFSETS = {
  analysis: { days: -1, hour: '18' },
  'wave analysis': { days: -1, hour: '18' },
  forecast_24h: { days: 0, hour: '18' },
  'forecast 24h': { days: 0, hour: '18' },
  '24h': { days: 0, hour: '18' },
  '24h forecast': { days: 0, hour: '18' },
  '24hr forecast': { days: 0, hour: '18' },
  '24 hour forecast': { days: 0, hour: '18' },
  '24-hour forecast': { days: 0, hour: '18' },
  forecast_36h: { days: 1, hour: '06' },
  'forecast 36h': { days: 1, hour: '06' },
  '36h': { days: 1, hour: '06' },
  '36h forecast': { days: 1, hour: '06' },
  '36hr forecast': { days: 1, hour: '06' },
  '36 hour forecast': { days: 1, hour: '06' },
  '36-hour forecast': { days: 1, hour: '06' },
  forecast_48h: { days: 1, hour: '18' },
  'forecast 48h': { days: 1, hour: '18' },
  '48h': { days: 1, hour: '18' },
  '48h forecast': { days: 1, hour: '18' },
  '48hr forecast': { days: 1, hour: '18' },
  '48 hour forecast': { days: 1, hour: '18' },
  '48-hour forecast': { days: 1, hour: '18' },
};

const ECWAM_FORECAST_OFFSETS = {
  analysis: { days: 0, hour: '00' },
  'wave analysis': { days: 0, hour: '00' },
  'forecast 24h': { days: 1, hour: '00' },
  '24h': { days: 1, hour: '00' },
  '24h forecast': { days: 1, hour: '00' },
  '24hr forecast': { days: 1, hour: '00' },
  '24 hour forecast': { days: 1, hour: '00' },
  '24-hour forecast': { days: 1, hour: '00' },
  'forecast 36h': { days: 1, hour: '12' },
  '36h': { days: 1, hour: '12' },
  '36h forecast': { days: 1, hour: '12' },
  '36hr forecast': { days: 1, hour: '12' },
  '36 hour forecast': { days: 1, hour: '12' },
  '36-hour forecast': { days: 1, hour: '12' },
  'forecast 48h': { days: 2, hour: '00' },
  '48h': { days: 2, hour: '00' },
  '48h forecast': { days: 2, hour: '00' },
  '48hr forecast': { days: 2, hour: '00' },
  '48 hour forecast': { days: 2, hour: '00' },
  '48-hour forecast': { days: 2, hour: '00' },
};

export const WW3_REQUIRED_FORECAST_HOURS = Object.freeze(
  Array.from({ length: 21 }, (_, index) => index * 3)
);
export const ECWAM_REQUIRED_FORECAST_HOURS = WW3_REQUIRED_FORECAST_HOURS;

const buildChartWindows = (forecastHours) =>
  Object.freeze({
    analysis: [0],
    '24h': forecastHours.filter((hour) => hour <= 35),
    '36h': forecastHours.filter((hour) => hour >= 25 && hour <= 47),
    '48h': forecastHours.filter((hour) => hour >= 37 && hour <= 60),
  });

const WW3_CHART_WINDOWS = buildChartWindows(WW3_REQUIRED_FORECAST_HOURS);
const ECWAM_CHART_WINDOWS = buildChartWindows(ECWAM_REQUIRED_FORECAST_HOURS);

const DEFAULT_WW3_OFFSET = WW3_FORECAST_OFFSETS.analysis;
const DEFAULT_ECWAM_OFFSET = ECWAM_FORECAST_OFFSETS.analysis;
const MONTH_TOKENS = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
];

const pad2 = (value) => String(value).padStart(2, '0');

const normalizeChartType = (chartType = '') =>
  String(chartType).trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');

const chartWindowKey = (chartType) => {
  const normalized = normalizeChartType(chartType);
  if (!normalized || normalized.includes('analysis')) return 'analysis';
  const hourMatch = normalized.match(/(?:forecast\s*)?(24|36|48)\s*(?:h|hr|hour)?/);
  return hourMatch ? `${hourMatch[1]}h` : 'analysis';
};

export const getWW3ForecastHours = (chartType) => WW3_CHART_WINDOWS[chartWindowKey(chartType)];

export const getECWAMForecastHours = (chartType) => ECWAM_CHART_WINDOWS[chartWindowKey(chartType)];

const resolveOffset = (chartType) => {
  const normalized = normalizeChartType(chartType);
  const directOffset = WW3_FORECAST_OFFSETS[normalized];
  if (directOffset) return directOffset;

  const hourMatch = normalized.match(/(?:forecast\s*)?(24|36|48)\s*(?:h|hr|hour)?/);
  if (!hourMatch) return DEFAULT_WW3_OFFSET;

  return WW3_FORECAST_OFFSETS[`forecast ${hourMatch[1]}h`] ?? DEFAULT_WW3_OFFSET;
};

const resolveECWAMOffset = (chartType) => {
  const normalized = normalizeChartType(chartType);
  const directOffset = ECWAM_FORECAST_OFFSETS[normalized];
  if (directOffset) return directOffset;

  const hourMatch = normalized.match(/(?:forecast\s*)?(24|36|48)\s*(?:h|hr|hour)?/);
  if (!hourMatch) return DEFAULT_ECWAM_OFFSET;

  return ECWAM_FORECAST_OFFSETS[`forecast ${hourMatch[1]}h`] ?? DEFAULT_ECWAM_OFFSET;
};

const normalizeForecastHour = (forecastHour) => {
  if (forecastHour === undefined || forecastHour === null || forecastHour === '') {
    return null;
  }
  const hour = Number(forecastHour);
  return Number.isInteger(hour) && hour >= 0 && hour <= 60 && hour % 3 === 0 ? hour : null;
};

const dateFromParts = (year, month, day) =>
  new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

const parseForecastDate = (forecastDate) => {
  if (forecastDate?.isValid?.() && forecastDate.isValid()) {
    return dateFromParts(forecastDate.year(), forecastDate.month() + 1, forecastDate.date());
  }

  if (forecastDate instanceof Date && !Number.isNaN(forecastDate.getTime())) {
    return dateFromParts(
      forecastDate.getFullYear(),
      forecastDate.getMonth() + 1,
      forecastDate.getDate()
    );
  }

  if (typeof forecastDate === 'string') {
    const match = forecastDate.match(/^(\d{4})-?(\d{2})-?(\d{2})/);
    if (match) {
      return dateFromParts(match[1], match[2], match[3]);
    }
  }

  const today = new Date();
  return dateFromParts(today.getFullYear(), today.getMonth() + 1, today.getDate());
};

const shiftDate = (date, days) => {
  const shifted = new Date(date.getTime());
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted;
};

const formatCompactDate = (date) =>
  [date.getUTCFullYear(), pad2(date.getUTCMonth() + 1), pad2(date.getUTCDate())].join('');

export const formatWW3PackageDate = (forecastDate) => {
  const date = parseForecastDate(forecastDate);
  return `${date.getUTCFullYear()}${MONTH_TOKENS[date.getUTCMonth()]}${pad2(date.getUTCDate())}`;
};

export const resolveWW3ForecastRun = ({ forecastDate, chartType, forecastHour } = {}) => {
  const packageBaseDate = parseForecastDate(forecastDate);
  const packageDate = formatWW3PackageDate(forecastDate);
  const analysisTime = shiftDate(packageBaseDate, -1);
  analysisTime.setUTCHours(18, 0, 0, 0);
  const explicitHour = normalizeForecastHour(forecastHour);

  let validTime;
  let resolvedForecastHour;

  if (explicitHour !== null) {
    validTime = new Date(analysisTime.getTime() + explicitHour * 60 * 60 * 1000);
    resolvedForecastHour = explicitHour;
  } else {
    const offset = resolveOffset(chartType);
    validTime = shiftDate(packageBaseDate, offset.days);
    validTime.setUTCHours(Number(offset.hour), 0, 0, 0);
    resolvedForecastHour = Math.round(
      (validTime.getTime() - analysisTime.getTime()) / 3_600_000
    );
  }

  const yyyymmdd = formatCompactDate(validTime);
  const hour = pad2(validTime.getUTCHours());
  const runDateTime = `${yyyymmdd}${hour}`;

  return {
    runTag: `${packageDate}/${runDateTime}`,
    runDateTime,
    filenameTimestamp: `${yyyymmdd}T${hour}`,
    packageDate,
    forecastHour: resolvedForecastHour,
  };
};

export const resolveECWAMForecastRun = ({ forecastDate, chartType, forecastHour } = {}) => {
  const packageBaseDate = parseForecastDate(forecastDate);
  const packageDate = formatWW3PackageDate(forecastDate);
  const explicitHour = normalizeForecastHour(forecastHour);

  let validTime;
  let resolvedForecastHour;

  if (explicitHour !== null) {
    validTime = new Date(packageBaseDate.getTime() + explicitHour * 60 * 60 * 1000);
    resolvedForecastHour = explicitHour;
  } else {
    const offset = resolveECWAMOffset(chartType);
    validTime = shiftDate(packageBaseDate, offset.days);
    validTime.setUTCHours(Number(offset.hour), 0, 0, 0);
    resolvedForecastHour = Math.round(
      (validTime.getTime() - packageBaseDate.getTime()) / 3_600_000
    );
  }

  const yyyymmdd = formatCompactDate(validTime);
  const runDateTime = `${yyyymmdd}${pad2(validTime.getUTCHours())}`;

  return {
    runTag: `${packageDate}/${runDateTime}`,
    runDateTime,
    packageDate,
    forecastHour: resolvedForecastHour,
  };
};

export const resolveBMKGForecastRun = ({ forecastDate, chartType } = {}) => {
  const packageDate = parseForecastDate(forecastDate);
  const modelRunDate = shiftDate(packageDate, -1);
  const { runDateTime } = resolveWW3ForecastRun({ forecastDate, chartType });

  return {
    modelRunDateTime: `${formatCompactDate(modelRunDate)}0000`,
    validDateTime: `${runDateTime}00`,
  };
};

export const getCachedForecastPackageContext = () => {
  if (typeof localStorage === 'undefined') {
    return {};
  }

  try {
    const cachedProject = JSON.parse(localStorage.getItem('cachedProject'));
    if (cachedProject?.forecastDate || cachedProject?.chartType) {
      return {
        forecastDate: cachedProject.forecastDate,
        chartType: cachedProject.chartType,
      };
    }
  } catch {
    // Ignore malformed local cache and fall back to legacy keys/defaults.
  }

  return {
    forecastDate: localStorage.getItem('forecastDate'),
    chartType: localStorage.getItem('chartType'),
  };
};
