const WW3_FORECAST_OFFSETS = {
  analysis: { days: -1, hour: '18' },
  'wave analysis': { days: -1, hour: '18' },
  '24h forecast': { days: 0, hour: '18' },
  '24hr forecast': { days: 0, hour: '18' },
  '24-hour forecast': { days: 0, hour: '18' },
  '36h forecast': { days: 1, hour: '06' },
  '36hr forecast': { days: 1, hour: '06' },
  '36-hour forecast': { days: 1, hour: '06' },
  '48h forecast': { days: 1, hour: '18' },
  '48hr forecast': { days: 1, hour: '18' },
  '48-hour forecast': { days: 1, hour: '18' },
};

const DEFAULT_WW3_OFFSET = WW3_FORECAST_OFFSETS['wave analysis'];

const pad2 = (value) => String(value).padStart(2, '0');

const normalizeChartType = (chartType = '') =>
  String(chartType).trim().toLowerCase().replace(/\s+/g, ' ');

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
      forecastDate.getDate(),
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

export const resolveWW3ForecastRun = ({ forecastDate, chartType } = {}) => {
  const offset = WW3_FORECAST_OFFSETS[normalizeChartType(chartType)] ?? DEFAULT_WW3_OFFSET;
  const date = shiftDate(parseForecastDate(forecastDate), offset.days);
  const yyyymmdd = [
    date.getUTCFullYear(),
    pad2(date.getUTCMonth() + 1),
    pad2(date.getUTCDate()),
  ].join('');

  return {
    runTag: `${yyyymmdd}${offset.hour}`,
    filenameTimestamp: `${yyyymmdd}T${offset.hour}`,
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
