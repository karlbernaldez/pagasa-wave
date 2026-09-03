const MANAGED_TIMESTAMP_MODE = 'managed_timestamp';
const DEFAULT_BOUNDS = Object.freeze([100, -5, 180, 50]);

const invalidProfile = (message) => {
  const error = new Error(message);
  error.status = 400;
  throw error;
};

const requireInteger = (value, { name, min, max }) => {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) {
    invalidProfile(`${name} must be an integer from ${min} to ${max}.`);
  }
  return number;
};

const normalizeBounds = (value) => {
  const bounds = value == null ? [...DEFAULT_BOUNDS] : value;
  if (!Array.isArray(bounds) || bounds.length !== 4) {
    invalidProfile('bounds must contain west, south, east, and north values.');
  }

  const normalized = bounds.map(Number);
  if (normalized.some((entry) => !Number.isFinite(entry))) {
    invalidProfile('bounds values must be finite numbers.');
  }

  const [west, south, east, north] = normalized;
  if (
    west < -180 ||
    east > 180 ||
    south < -90 ||
    north > 90 ||
    west >= east ||
    south >= north
  ) {
    invalidProfile('bounds must be valid geographic west/south/east/north coordinates.');
  }
  return normalized;
};

export const normalizeWaveModelRuntimeProfile = (rawProfile) => {
  if (rawProfile == null) return null;
  if (typeof rawProfile !== 'object' || Array.isArray(rawProfile)) {
    invalidProfile('runtimeProfile must be an object or null.');
  }

  const mode = String(rawProfile.mode || '').trim();
  if (mode !== MANAGED_TIMESTAMP_MODE) {
    invalidProfile(`runtimeProfile.mode must be ${MANAGED_TIMESTAMP_MODE}.`);
  }

  const cycleDayOffset = requireInteger(rawProfile.cycleDayOffset, {
    name: 'cycleDayOffset',
    min: -2,
    max: 1,
  });
  const cycleHourUtc = requireInteger(rawProfile.cycleHourUtc, {
    name: 'cycleHourUtc',
    min: 0,
    max: 23,
  });
  const forecastCadenceHours = requireInteger(rawProfile.forecastCadenceHours, {
    name: 'forecastCadenceHours',
    min: 1,
    max: 24,
  });
  const maxForecastHour = requireInteger(rawProfile.maxForecastHour, {
    name: 'maxForecastHour',
    min: 0,
    max: 240,
  });

  if (maxForecastHour % forecastCadenceHours !== 0) {
    invalidProfile('maxForecastHour must be divisible by forecastCadenceHours.');
  }

  const rasterScheme = String(rawProfile.rasterScheme || 'xyz')
    .trim()
    .toLowerCase();
  if (!['xyz', 'tms'].includes(rasterScheme)) {
    invalidProfile('rasterScheme must be xyz or tms.');
  }
  if (rawProfile.contoursEnabled === true) {
    invalidProfile(
      'Dynamic contour onboarding is not supported yet. Use raster-only managed profiles.'
    );
  }

  return {
    mode,
    cycleDayOffset,
    cycleHourUtc,
    forecastCadenceHours,
    maxForecastHour,
    rasterScheme,
    bounds: normalizeBounds(rawProfile.bounds),
    contoursEnabled: false,
  };
};

export const isWaveModelRuntimeConfigured = (profile) =>
  Boolean(profile && profile.mode === MANAGED_TIMESTAMP_MODE);

export const MANAGED_WAVE_RUNTIME_MODE = MANAGED_TIMESTAMP_MODE;
