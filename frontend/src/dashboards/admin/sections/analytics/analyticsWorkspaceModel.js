export const ANALYTICS_SECTIONS = Object.freeze([
  {
    id: 'forecast',
    label: 'Forecast Operations',
    shortLabel: 'Forecast',
    permission: 'analytics_forecast.view',
    description: 'Package throughput, review outcomes, readiness, and recent operational trends.',
  },
  {
    id: 'users',
    label: 'User Activity',
    shortLabel: 'Users',
    permission: 'analytics_users.view',
    description:
      'Operational participation and account health without exposing names, email addresses, or contact data.',
  },
  {
    id: 'system',
    label: 'System Operations',
    shortLabel: 'System',
    permission: 'analytics_system.view',
    description: 'Cross-system readiness, public chart reach, and operational health indicators.',
  },
]);

const REVIEW_STATUSES = new Set(['Submitted', 'Under Review']);
const RETURNED_STATUSES = new Set(['Revision Requested', 'Rejected']);
const APPROVED_STATUSES = new Set(['Approved', 'Published']);
const DAY_MS = 24 * 60 * 60 * 1000;

const toCount = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
};

const parseDateKey = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return null;
  const [year, month, day] = String(value).split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

const formatDateKey = (date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(
    date.getUTCDate()
  ).padStart(2, '0')}`;

const formatShortDateKey = (value) => {
  const date = parseDateKey(value);
  if (!date) return String(value || '');
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
};

export function getAllowedAnalyticsSections(permissions = []) {
  const permissionSet = permissions instanceof Set ? permissions : new Set(permissions || []);
  return ANALYTICS_SECTIONS.filter((section) => permissionSet.has(section.permission));
}

export function buildForecastMetrics(payload = {}) {
  const packages = Array.isArray(payload.packages) ? payload.packages : [];
  const statusCounts = payload.statusCounts || {};
  const countStatus = (status) => toCount(statusCounts[status]);
  const inReview = [...REVIEW_STATUSES].reduce((total, status) => total + countStatus(status), 0);
  const returned = [...RETURNED_STATUSES].reduce((total, status) => total + countStatus(status), 0);
  const approved = [...APPROVED_STATUSES].reduce((total, status) => total + countStatus(status), 0);

  return {
    total: toCount(payload.total) || packages.length,
    sampleSize: toCount(payload.sampleSize) || packages.length,
    inReview,
    returned,
    approved,
    published: countStatus('Published'),
    archived: countStatus('Archived'),
    completionRate: payload.total ? Math.round((approved / payload.total) * 100) : 0,
  };
}

export function buildUserMetrics(payload = {}) {
  const statusCounts = payload.statusCounts || {};
  const contributions = payload.contributions || {};
  const total = toCount(payload.total);
  const active = toCount(statusCounts.active);
  const pending = toCount(statusCounts.pending);
  const suspended = toCount(statusCounts.suspended) + toCount(statusCounts.locked);

  return {
    total,
    active,
    pending,
    suspended,
    inactive: toCount(statusCounts.inactive),
    activeRate: total ? Math.round((active / total) * 100) : 0,
    contributionEvents: toCount(contributions.totalEvents),
    activeContributors: toCount(contributions.activeContributors),
  };
}

export function buildSystemMetrics(payload = {}) {
  const users = payload.users || {};
  const packages = payload.forecastPackages || {};
  const chartViews = payload.publishedChartViews || {};
  const packageStatuses = packages.statusCounts || {};
  const userStatuses = users.statusCounts || {};
  const totalUsers = toCount(users.total);
  const activeUsers = toCount(users.active);
  const totalPackages = toCount(packages.total);

  return {
    totalUsers,
    activeUsers,
    totalPackages,
    activeUserRate: totalUsers ? Math.round((activeUsers / totalUsers) * 100) : 0,
    packagesInReview: toCount(packageStatuses.Submitted) + toCount(packageStatuses['Under Review']),
    packagesReturned:
      toCount(packageStatuses['Revision Requested']) + toCount(packageStatuses.Rejected),
    packagesPublished: toCount(packageStatuses.Published),
    usersPending: toCount(userStatuses.pending),
    publishedViews: toCount(chartViews.totalViews),
    viewsToday: toCount(chartViews.viewsToday),
  };
}

const dateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function buildForecastDailySeries(packages = [], dayCount = 14, endDateKey = null) {
  const days = [];
  const selectedEnd = parseDateKey(endDateKey);
  const endDate = selectedEnd || new Date();

  for (let offset = dayCount - 1; offset >= 0; offset -= 1) {
    const date = selectedEnd
      ? new Date(endDate.getTime() - offset * DAY_MS)
      : new Date(endDate);
    if (!selectedEnd) {
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - offset);
    }
    const key = selectedEnd ? formatDateKey(date) : dateKey(date);
    days.push({
      key,
      date: key,
      label: new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        ...(selectedEnd ? { timeZone: 'UTC' } : {}),
      }).format(date),
      submitted: 0,
      completed: 0,
      returned: 0,
    });
  }

  const rows = new Map(days.map((day) => [day.key, day]));
  for (const forecastPackage of packages || []) {
    const key = dateKey(
      forecastPackage.forecastDate ||
        forecastPackage.submittedAt ||
        forecastPackage.createdAt ||
        forecastPackage.updatedAt
    );
    if (!rows.has(key)) continue;

    const row = rows.get(key);
    if (forecastPackage.submittedAt || REVIEW_STATUSES.has(forecastPackage.status)) {
      row.submitted += 1;
    }
    if (APPROVED_STATUSES.has(forecastPackage.status)) row.completed += 1;
    if (RETURNED_STATUSES.has(forecastPackage.status)) row.returned += 1;
  }

  return days;
}

export function adaptiveBucketDays(dayCount) {
  const days = Math.max(1, Number(dayCount) || 1);
  if (days <= 31) return 1;
  if (days <= 60) return 2;
  return 7;
}

export function bucketDateSeries(
  rows = [],
  { start, end, dateField = 'date', valueFields = ['value'], dayCount } = {}
) {
  const startDate = parseDateKey(start);
  const endDate = parseDateKey(end);
  if (!startDate || !endDate || endDate < startDate) return [];

  const inclusiveDays = Math.floor((endDate.getTime() - startDate.getTime()) / DAY_MS) + 1;
  const bucketDays = adaptiveBucketDays(dayCount || inclusiveDays);
  const bucketCount = Math.ceil(inclusiveDays / bucketDays);
  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const bucketStart = new Date(startDate.getTime() + index * bucketDays * DAY_MS);
    const bucketEnd = new Date(
      Math.min(endDate.getTime(), bucketStart.getTime() + (bucketDays - 1) * DAY_MS)
    );
    const bucketStartKey = formatDateKey(bucketStart);
    const bucketEndKey = formatDateKey(bucketEnd);
    return {
      key: `${bucketStartKey}:${bucketEndKey}`,
      date: bucketStartKey,
      label:
        bucketStartKey === bucketEndKey
          ? formatShortDateKey(bucketStartKey)
          : `${formatShortDateKey(bucketStartKey)}–${formatShortDateKey(bucketEndKey)}`,
      ...Object.fromEntries(valueFields.map((field) => [field, 0])),
    };
  });

  for (const row of rows || []) {
    const rowDate = parseDateKey(row?.[dateField]);
    if (!rowDate || rowDate < startDate || rowDate > endDate) continue;
    const offset = Math.floor((rowDate.getTime() - startDate.getTime()) / DAY_MS);
    const bucket = buckets[Math.floor(offset / bucketDays)];
    if (!bucket) continue;
    for (const field of valueFields) {
      bucket[field] += Number(row?.[field]) || 0;
    }
  }

  return buckets;
}

export function contributionMixRows(contributions = {}) {
  return (contributions.actionMix || [])
    .map((row) => ({ label: row.label || row.action || 'Unknown', value: toCount(row.count) }))
    .filter((row) => row.value > 0);
}

export function publishedChartRows(publishedChartViews = {}) {
  return (publishedChartViews.topCharts || [])
    .map((row) => ({ label: row.name || 'Published chart', value: toCount(row.views) }))
    .filter((row) => row.value > 0);
}

export function entriesByCount(counts = {}) {
  return Object.entries(counts)
    .map(([label, value]) => ({ label, value: toCount(value) }))
    .filter((entry) => entry.value > 0)
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}
