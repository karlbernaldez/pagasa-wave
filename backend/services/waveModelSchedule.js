const MIN_INTERVAL_MINUTES = 15;
const MAX_INTERVAL_MINUTES = 24 * 60;
const MAX_DAILY_TIMES = 8;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const TIMEZONE_RE = /^[A-Za-z0-9_+\-/]+$/;

const invalidSchedule = (message) => {
  const error = new Error(message);
  error.status = 400;
  throw error;
};

const validateTimezone = (value) => {
  const timezone = String(value || '').trim();
  if (!timezone || !TIMEZONE_RE.test(timezone)) {
    invalidSchedule('timezone must be a valid IANA timezone name.');
  }
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(new Date());
  } catch {
    invalidSchedule('timezone must be a valid IANA timezone name.');
  }
  return timezone;
};

const normalizeDailyTimes = (value) => {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_DAILY_TIMES) {
    invalidSchedule(`times must contain between 1 and ${MAX_DAILY_TIMES} HH:MM values.`);
  }
  const times = [...new Set(value.map((entry) => String(entry || '').trim()))].sort();
  if (times.some((time) => !TIME_RE.test(time))) {
    invalidSchedule('times must use 24-hour HH:MM format.');
  }
  return times;
};

export const normalizeWaveModelSchedule = (rawSchedule) => {
  if (!rawSchedule || typeof rawSchedule !== 'object' || Array.isArray(rawSchedule)) {
    invalidSchedule('schedule must be an object.');
  }

  const mode = String(rawSchedule.mode || '').trim().toLowerCase();
  if (mode === 'interval') {
    const everyMinutes = Number(rawSchedule.everyMinutes);
    if (
      !Number.isInteger(everyMinutes) ||
      everyMinutes < MIN_INTERVAL_MINUTES ||
      everyMinutes > MAX_INTERVAL_MINUTES
    ) {
      invalidSchedule(
        `everyMinutes must be an integer from ${MIN_INTERVAL_MINUTES} to ${MAX_INTERVAL_MINUTES}.`
      );
    }
    return { mode, everyMinutes };
  }

  if (mode === 'daily') {
    return {
      mode,
      times: normalizeDailyTimes(rawSchedule.times),
      timezone: validateTimezone(rawSchedule.timezone),
    };
  }

  invalidSchedule('schedule.mode must be interval or daily.');
};

export const DEFAULT_WAVE_MODEL_SCHEDULE = Object.freeze({ mode: 'interval', everyMinutes: 60 });
