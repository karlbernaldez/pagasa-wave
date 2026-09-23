export const ANALYTICS_SECTIONS = Object.freeze([
  {
    id: 'overview',
    label: 'Executive Analysis',
    shortLabel: 'Executive',
    permission: null,
    description: 'Cross-section performance analysis for the selected reporting period.',
  },
  {
    id: 'forecast',
    label: 'Forecast Performance',
    shortLabel: 'Forecast',
    permission: 'analytics_forecast.view',
    description:
      'Throughput, workflow efficiency, revision pressure, timing, and package-level performance.',
  },
  {
    id: 'public',
    label: 'Public Reach',
    shortLabel: 'Public Reach',
    permission: 'analytics_system.view',
    description: 'Privacy-safe reach and usage of published WaveLab charts.',
  },
  {
    id: 'users',
    label: 'Collaboration Activity',
    shortLabel: 'Collaboration',
    permission: 'analytics_users.view',
    description:
      'Aggregate account health and operational participation without employee scoring or identity exposure.',
  },
  {
    id: 'system',
    label: 'System & Pipeline',
    shortLabel: 'System',
    permission: 'analytics_system.view',
    description:
      'Current pipeline evidence and model readiness; historical reliability appears only when persisted telemetry exists.',
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
  const subsectionPermissions = [
    'analytics_forecast.view',
    'analytics_users.view',
    'analytics_system.view',
  ];
  const hasAnalytics = subsectionPermissions.some((permission) => permissionSet.has(permission));
  return ANALYTICS_SECTIONS.filter((section) =>
    section.id === 'overview' ? hasAnalytics : permissionSet.has(section.permission)
  );
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
    const date = selectedEnd ? new Date(endDate.getTime() - offset * DAY_MS) : new Date(endDate);
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

export function buildWorkflowFunnel(payload = {}) {
  const summary = payload.summary || {};
  return [
    { stage: 'Submitted', value: toCount(summary.submitted) },
    { stage: 'Review started', value: toCount(summary.reviewStarted) },
    { stage: 'Revision requested', value: toCount(summary.revisionRequests) },
    { stage: 'Approved', value: toCount(summary.approvedEvents) },
    { stage: 'Published', value: toCount(summary.publishedEvents) },
  ];
}

export function buildTimingRows(timing = {}) {
  const definitions = [
    ['Preparation', timing.preparation, 'First tracked chart activity to submission'],
    ['Review wait', timing.reviewWait, 'Submission to review start'],
    ['Review duration', timing.reviewDuration, 'Review start to review decision'],
    ['Publication delay', timing.publicationDelay, 'Approval to publication'],
  ];

  return definitions.map(([stage, metric, definition]) => ({
    stage,
    medianHours: metric?.medianHours ?? null,
    p75Hours: metric?.p75Hours ?? null,
    p90Hours: metric?.p90Hours ?? null,
    sampleSize: toCount(metric?.sampleSize),
    definition,
  }));
}

export function buildPackagePerformanceRows(packages = []) {
  return (packages || []).map((item) => ({
    id: item.id,
    forecastDate: item.forecastDate,
    name: item.name || 'Forecast package',
    status: item.status || 'Unknown',
    submittedAt: item.submittedAt || null,
    reviewedAt: item.reviewedAt || null,
    publishedAt: item.publishedAt || null,
    reviewDurationHours:
      item.reviewDurationHours == null || !Number.isFinite(Number(item.reviewDurationHours))
        ? null
        : Number(item.reviewDurationHours),
    revisionCycles: toCount(item.revisionCycles),
  }));
}

export function formatComparisonDelta(metric = {}, { percentagePoints = false } = {}) {
  const value = percentagePoints ? metric.percentagePointChange : metric.percentChange;
  if (value == null || !Number.isFinite(Number(value))) return null;
  const numeric = Number(value);
  const prefix = numeric > 0 ? '+' : '';
  return percentagePoints ? `${prefix}${numeric} pp` : `${prefix}${numeric}%`;
}

export function buildBottleneckStageRows(bottlenecks = {}) {
  return (bottlenecks.stages || []).map((stage) => ({
    label: stage.label || stage.key || 'Unknown stage',
    medianHours: stage.medianHours ?? null,
    p75Hours: stage.p75Hours ?? null,
    p90Hours: stage.p90Hours ?? null,
    sampleSize: toCount(stage.sampleSize),
  }));
}

export function buildAgingDistributionRows(openAging = {}) {
  const buckets = openAging.buckets || {};
  const labels = [
    ['under_6h', '< 6h'],
    ['6_to_12h', '6–12h'],
    ['12_to_24h', '12–24h'],
    ['24_to_48h', '24–48h'],
    ['48h_plus', '48h+'],
  ];

  return labels.map(([key, label]) => ({
    label,
    value: toCount(buckets[key]),
  }));
}

export function buildSlowestPackageRows(bottlenecks = {}) {
  return (bottlenecks.turnaround?.slowestPackages || []).map((item) => ({
    id: item.id,
    name: item.name || 'Forecast package',
    forecastDate: item.forecastDate,
    status: item.status || 'Unknown',
    turnaroundHours:
      item.turnaroundHours == null || !Number.isFinite(Number(item.turnaroundHours))
        ? null
        : Number(item.turnaroundHours),
    revisionCycles: toCount(item.revisionCycles),
  }));
}

export function buildOpenAgingRows(bottlenecks = {}) {
  return (bottlenecks.openAging?.oldest || []).map((item) => ({
    id: item.id,
    name: item.name || 'Forecast package',
    forecastDate: item.forecastDate,
    status: item.status || 'Unknown',
    statusStartedAt: item.statusStartedAt || null,
    ageHours:
      item.ageHours == null || !Number.isFinite(Number(item.ageHours))
        ? null
        : Number(item.ageHours),
  }));
}

export function buildChartTypePerformanceRows(chartTypes = []) {
  return (chartTypes || []).map((row) => ({
    chartType: row.chartType,
    label: row.label || row.chartType || 'Unknown chart',
    horizonHours:
      row.horizonHours == null || !Number.isFinite(Number(row.horizonHours))
        ? null
        : Number(row.horizonHours),
    projects: toCount(row.projects),
    submitted: toCount(row.submitted),
    revisionRequests: toCount(row.revisionRequests),
    published: toCount(row.published),
    revisionRate:
      row.revisionRate == null || !Number.isFinite(Number(row.revisionRate))
        ? null
        : Number(row.revisionRate),
    firstPassPublicationRate:
      row.firstPassPublicationRate == null || !Number.isFinite(Number(row.firstPassPublicationRate))
        ? null
        : Number(row.firstPassPublicationRate),
    reviewMedianHours: row.timing?.reviewDuration?.medianHours ?? null,
    reviewP90Hours: row.timing?.reviewDuration?.p90Hours ?? null,
    turnaroundMedianHours: row.timing?.submissionToPublication?.medianHours ?? null,
    turnaroundP90Hours: row.timing?.submissionToPublication?.p90Hours ?? null,
    sampleSize: toCount(row.timing?.submissionToPublication?.sampleSize),
  }));
}


export function buildForecastFindings(payload = {}) {
  const findings = [];
  const comparison = payload.comparison || {};
  const bottlenecks = payload.bottlenecks || {};
  const efficiency = payload.efficiency || {};
  const chartTypes = buildChartTypePerformanceRows(payload.chartTypes);

  if (bottlenecks.slowestStage?.label && bottlenecks.slowestStage?.p90Hours != null) {
    findings.push({
      id: 'slowest-stage',
      title: 'Primary workflow bottleneck',
      detail: `${bottlenecks.slowestStage.label} has the highest observed P90 duration at ${bottlenecks.slowestStage.p90Hours}h across ${toCount(bottlenecks.slowestStage.sampleSize)} complete sample(s).`,
    });
  }

  const highestRevision = [...chartTypes]
    .filter((row) => row.submitted > 0 && row.revisionRate != null)
    .sort((a, b) => b.revisionRate - a.revisionRate)[0];
  if (highestRevision) {
    findings.push({
      id: 'highest-revision-chart',
      title: 'Highest revision pressure',
      detail: `${highestRevision.label} has the highest observed revision rate at ${highestRevision.revisionRate}% for the selected period.`,
    });
  }

  const oldOpen = toCount(bottlenecks.openAging?.buckets?.['24_to_48h']) +
    toCount(bottlenecks.openAging?.buckets?.['48h_plus']);
  if (oldOpen > 0) {
    findings.push({
      id: 'aged-open-items',
      title: 'Open items require attention',
      detail: `${oldOpen} open package${oldOpen === 1 ? '' : 's'} have remained in their current recorded workflow state for at least 24 hours.`,
    });
  }

  const publishedChange = comparison.published?.percentChange;
  if (publishedChange != null && Number.isFinite(Number(publishedChange)) && Number(publishedChange) !== 0) {
    const direction = Number(publishedChange) > 0 ? 'increased' : 'decreased';
    findings.push({
      id: 'publication-change',
      title: 'Publication volume changed',
      detail: `Published forecast events ${direction} by ${Math.abs(Number(publishedChange))}% versus the immediately preceding equal-length period.`,
    });
  }

  if (efficiency.firstPassApprovalRate != null) {
    findings.push({
      id: 'first-pass',
      title: 'First-pass workflow efficiency',
      detail: `${efficiency.firstPassApprovalRate}% of completed forecast packages reached completion without a recorded revision request.`,
    });
  }

  return findings.slice(0, 5);
}

export function buildForecastExplorerRows(packages = []) {
  return buildPackagePerformanceRows(packages).map((item) => ({
    ...item,
    revisionClass: item.revisionCycles > 0 ? 'revised' : 'no_revision',
  }));
}

export function buildForecastExplorerFilters(rows = []) {
  const statuses = [...new Set(rows.map((row) => row.status).filter(Boolean))].sort();
  return [
    {
      key: 'status',
      label: 'statuses',
      options: statuses.map((status) => ({ value: status, label: status })),
    },
    {
      key: 'revisionClass',
      label: 'revision states',
      options: [
        { value: 'revised', label: 'Revised' },
        { value: 'no_revision', label: 'No revision' },
      ],
    },
  ];
}
