const runtimeCatalog = new Map();

const normalizeCode = (value = '') => String(value).trim().toUpperCase();
const pad2 = (value) => String(value).padStart(2, '0');
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

const parseForecastDate = (forecastDate) => {
  if (forecastDate?.isValid?.() && forecastDate.isValid()) {
    return new Date(Date.UTC(forecastDate.year(), forecastDate.month(), forecastDate.date()));
  }
  if (forecastDate instanceof Date && !Number.isNaN(forecastDate.getTime())) {
    return new Date(
      Date.UTC(forecastDate.getFullYear(), forecastDate.getMonth(), forecastDate.getDate())
    );
  }
  if (typeof forecastDate === 'string') {
    const match = forecastDate.match(/^(\d{4})-?(\d{2})-?(\d{2})/);
    if (match) return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  }
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
};

const chartDefaultHour = (chartType = '') => {
  const normalized = String(chartType).toLowerCase();
  if (normalized.includes('48')) return 48;
  if (normalized.includes('36')) return 36;
  if (normalized.includes('24')) return 24;
  return 0;
};

const formatPackageDate = (date) =>
  `${date.getUTCFullYear()}${MONTH_TOKENS[date.getUTCMonth()]}${pad2(date.getUTCDate())}`;

const formatRunTime = (date) =>
  `${date.getUTCFullYear()}${pad2(date.getUTCMonth() + 1)}${pad2(date.getUTCDate())}${pad2(
    date.getUTCHours()
  )}`;

export const setWaveModelRuntimeCatalog = (models = []) => {
  runtimeCatalog.clear();
  models.forEach((model) => {
    const code = normalizeCode(model?.code);
    if (code && model?.runtimeConfigured && model?.runtimeProfile) {
      runtimeCatalog.set(code, model.runtimeProfile);
    }
  });
};

export const getWaveModelRuntimeProfile = (model) => runtimeCatalog.get(normalizeCode(model)) || null;

export const resolveManagedWaveRun = ({ model, forecastDate, chartType, forecastHour } = {}) => {
  const profile = getWaveModelRuntimeProfile(model);
  if (!profile || profile.mode !== 'managed_timestamp') return null;

  const packageDateValue = parseForecastDate(forecastDate);
  const cycleDate = new Date(packageDateValue.getTime());
  cycleDate.setUTCDate(cycleDate.getUTCDate() + Number(profile.cycleDayOffset || 0));
  cycleDate.setUTCHours(Number(profile.cycleHourUtc || 0), 0, 0, 0);

  const requestedHour = forecastHour == null ? chartDefaultHour(chartType) : Number(forecastHour);
  const cadence = Number(profile.forecastCadenceHours || 1);
  const maxHour = Number(profile.maxForecastHour || 0);
  const boundedHour = Math.max(0, Math.min(maxHour, requestedHour));
  const resolvedHour = Math.round(boundedHour / cadence) * cadence;
  const validTime = new Date(cycleDate.getTime() + resolvedHour * 3_600_000);
  const packageDate = formatPackageDate(packageDateValue);
  const runDateTime = formatRunTime(validTime);

  return {
    profile,
    packageDate,
    runDateTime,
    runTag: `${packageDate}/${runDateTime}`,
    forecastHour: resolvedHour,
  };
};
