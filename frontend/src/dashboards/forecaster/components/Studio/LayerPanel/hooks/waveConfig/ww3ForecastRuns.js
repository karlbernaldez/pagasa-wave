const WW3_FORECAST_OFFSETS = {
  analysis: { days: -1, hour: '18' },
  'wave analysis': { days: -1, hour: '18' },
  'forecast_24h': { days: 0, hour: '18' },
  'forecast 24h': { days: 0, hour: '18' },
  '24h': { days: 0, hour: '18' },
  '24h forecast': { days: 0, hour: '18' },
  '24hr forecast': { days: 0, hour: '18' },
  '24 hour forecast': { days: 0, hour: '18' },
  '24-hour forecast': { days: 0, hour: '18' },
  'forecast_36h': { days: 1, hour: '06' },
  'forecast 36h': { days: 1, hour: '06' },
  '36h': { days: 1, hour: '06' },
  '36h forecast': { days: 1, hour: '06' },
  '36hr forecast': { days: 1, hour: '06' },
  '36 hour forecast': { days: 1, hour: '06' },
  '36-hour forecast': { days: 1, hour: '06' },
  'forecast_48h': { days: 1, hour: '18' },
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

const DEFAULT_WW3_OFFSET = WW3_FORECAST_OFFSETS.analysis;
const DEFAULT_ECWAM_OFFSET = ECWAM_FORECAST_OFFSETS.analysis;
const MONTH_TOKENS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const pad2 = (value) => String(value).padStart(2, '0');

const normalizeChartType = (chartType = '') =>
  String(chartType)
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

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

const formatCompactDate = (date) => [
  date.getUTCFullYear(),
  pad2(date.getUTCMonth() + 1),
  pad2(date.getUTCDate()),
].join('');

export const formatWW3PackageDate = (forecastDate) => {
  const date = parseForecastDate(forecastDate);
  return `${date.getUTCFullYear()}${MONTH_TOKENS[date.getUTCMonth()]}${pad2(date.getUTCDate())}`;
};

export const resolveWW3ForecastRun = ({ forecastDate, chartType } = {}) => {
  const offset = resolveOffset(chartType);
  const packageDate = formatWW3PackageDate(forecastDate);
  const date = shiftDate(parseForecastDate(forecastDate), offset.days);
  const yyyymmdd = formatCompactDate(date);
  const runDateTime = `${yyyymmdd}${offset.hour}`;

  return {
    runTag: `${packageDate}/${runDateTime}`,
    runDateTime,
    filenameTimestamp: `${yyyymmdd}T${offset.hour}`,
    packageDate,
  };
};

export const resolveECWAMForecastRun = ({ forecastDate, chartType } = {}) => {
  const offset = resolveECWAMOffset(chartType);
  const packageDate = formatWW3PackageDate(forecastDate);
  const date = shiftDate(parseForecastDate(forecastDate), offset.days);
  const yyyymmdd = formatCompactDate(date);
  const runDateTime = `${yyyymmdd}${offset.hour}`;

  return {
    runTag: `${packageDate}/${runDateTime}`,
    runDateTime,
    packageDate,
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
