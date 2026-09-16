const ANALYTICS_TIMEZONE_OFFSET_MINUTES = 8 * 60;
const DEFAULT_RANGE_DAYS = 14;
const MAX_RANGE_DAYS = 90;
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

const pad = (value) => String(value).padStart(2, '0');

const toManilaDateParts = (date = new Date()) => {
  const shifted = new Date(date.getTime() + ANALYTICS_TIMEZONE_OFFSET_MINUTES * 60 * 1000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
};

const dateKeyFromParts = ({ year, month, day }) => `${year}-${pad(month)}-${pad(day)}`;

const assertDateKey = (value, fieldName) => {
  const key = String(value || '').trim();
  if (!DATE_ONLY_RE.test(key)) {
    const error = new Error(`${fieldName} must use YYYY-MM-DD format.`);
    error.status = 400;
    throw error;
  }

  const [year, month, day] = key.split('-').map(Number);
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    const error = new Error(`${fieldName} is not a valid calendar date.`);
    error.status = 400;
    throw error;
  }

  return { key, year, month, day };
};

const manilaStartUtc = ({ year, month, day }) =>
  new Date(Date.UTC(year, month - 1, day) - ANALYTICS_TIMEZONE_OFFSET_MINUTES * 60 * 1000);

const addCalendarDays = ({ year, month, day }, days) => {
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
};

export function parseAnalyticsDateRange(query = {}, now = new Date()) {
  const hasStart = query.start !== undefined && query.start !== '';
  const hasEnd = query.end !== undefined && query.end !== '';

  if (hasStart !== hasEnd) {
    const error = new Error('start and end must be provided together.');
    error.status = 400;
    throw error;
  }

  const today = toManilaDateParts(now);
  const startParts = hasStart
    ? assertDateKey(query.start, 'start')
    : addCalendarDays(today, -(DEFAULT_RANGE_DAYS - 1));
  const endParts = hasEnd ? assertDateKey(query.end, 'end') : today;

  const startDay = Date.UTC(startParts.year, startParts.month - 1, startParts.day);
  const endDay = Date.UTC(endParts.year, endParts.month - 1, endParts.day);
  if (startDay > endDay) {
    const error = new Error('start must be on or before end.');
    error.status = 400;
    throw error;
  }

  const inclusiveDays = Math.floor((endDay - startDay) / DAY_MS) + 1;
  if (inclusiveDays > MAX_RANGE_DAYS) {
    const error = new Error(`Analytics date range cannot exceed ${MAX_RANGE_DAYS} days.`);
    error.status = 400;
    throw error;
  }

  const endExclusiveParts = addCalendarDays(endParts, 1);
  return {
    start: dateKeyFromParts(startParts),
    end: dateKeyFromParts(endParts),
    startAt: manilaStartUtc(startParts),
    endExclusive: manilaStartUtc(endExclusiveParts),
    days: inclusiveDays,
    timezone: 'Asia/Manila',
  };
}

export function buildDateMatch(field, range) {
  return {
    [field]: {
      $gte: range.startAt,
      $lt: range.endExclusive,
    },
  };
}

export const ANALYTICS_DATE_RANGE_LIMITS = Object.freeze({
  defaultDays: DEFAULT_RANGE_DAYS,
  maxDays: MAX_RANGE_DAYS,
  timezone: 'Asia/Manila',
});
