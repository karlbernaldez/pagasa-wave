import ForecastPackage from '../models/ForecastPackage.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import {
  loadPublishedChartViewAnalytics,
  loadUserContributionAnalytics,
} from './operationalAnalyticsService.js';
import { formatManilaDateKey } from './publishedChartViewService.js';
import { getWavePipelineStatus } from './wavePipelineStatus.js';
import { buildDateMatch, parseAnalyticsDateRange } from '../utils/analyticsDateRange.js';
import { REQUIRED_FORECAST_CHARTS } from '../utils/forecastPackage.js';

export const ANALYTICS_PACKAGE_STATUSES = Object.freeze([
  'Submitted',
  'Under Review',
  'Revision Requested',
  'Approved',
  'Published',
  'Rejected',
  'Archived',
]);

const FORECAST_EVENT_ACTIONS = Object.freeze([
  'submitted',
  'review_started',
  'revision_requested',
  'approved',
  'rejected',
  'published',
]);

const DECIDED_STATUSES = new Set(['Revision Requested', 'Approved', 'Published', 'Rejected']);
const COMPLETED_STATUSES = new Set(['Approved', 'Published']);

const rowsToCountObject = (rows = [], key = '_id') =>
  Object.fromEntries(rows.map((row) => [String(row[key] || 'unknown'), Number(row.count) || 0]));

export const serializeAnalyticsRange = (range) => ({
  start: range.start,
  end: range.end,
  days: range.days,
  timezone: range.timezone,
});

const dateKey = (date) => {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
};

const shiftDateKey = (value, days) => {
  const [year, month, day] = String(value).split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
};

export const previousAnalyticsRange = (range) =>
  parseAnalyticsDateRange({
    start: shiftDateKey(range.start, -range.days),
    end: shiftDateKey(range.start, -1),
  });

const percentile = (values = [], percentileValue = 0.5) => {
  const clean = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!clean.length) return null;
  const rank = (clean.length - 1) * percentileValue;
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  if (lower === upper) return clean[lower];
  const weight = rank - lower;
  return clean[lower] + (clean[upper] - clean[lower]) * weight;
};

const roundHours = (value) => (value == null ? null : Math.round(value * 10) / 10);

const timingMetric = (values) => {
  const clean = values.filter(Number.isFinite);
  return {
    medianHours: roundHours(percentile(clean, 0.5)),
    p75Hours: roundHours(percentile(clean, 0.75)),
    p90Hours: roundHours(percentile(clean, 0.9)),
    sampleSize: clean.length,
  };
};

const firstAuditAt = (auditLogs, actions, { after = null } = {}) => {
  const allowed = new Set(actions);
  const afterMs = after ? new Date(after).getTime() : null;
  const timestamps = (auditLogs || [])
    .filter((log) => allowed.has(log?.action))
    .map((log) => new Date(log.timestamp).getTime())
    .filter((timestamp) => Number.isFinite(timestamp) && (afterMs == null || timestamp >= afterMs));
  return timestamps.length ? new Date(Math.min(...timestamps)) : null;
};

const hoursBetween = (start, end) => {
  if (!start || !end) return null;
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) return null;
  return (endMs - startMs) / 3600000;
};

const packageTiming = (forecastPackage) => {
  const logs = forecastPackage.auditLogs || [];
  const submittedAt =
    firstAuditAt(logs, ['submitted']) ||
    (forecastPackage.submittedAt ? new Date(forecastPackage.submittedAt) : null);
  const preparationStartedAt = firstAuditAt(logs, ['chart_claimed', 'chart_completion_updated']);
  const reviewStartedAt =
    firstAuditAt(logs, ['review_started'], { after: submittedAt }) ||
    (forecastPackage.reviewStartedAt ? new Date(forecastPackage.reviewStartedAt) : null);
  const decisionAt = firstAuditAt(logs, ['approved', 'revision_requested', 'rejected'], {
    after: reviewStartedAt,
  });
  const approvedAt = firstAuditAt(logs, ['approved']);
  const publishedAt =
    firstAuditAt(logs, ['published'], { after: approvedAt }) ||
    (forecastPackage.publishedAt ? new Date(forecastPackage.publishedAt) : null);

  return {
    preparationHours: hoursBetween(preparationStartedAt, submittedAt),
    reviewWaitHours: hoursBetween(submittedAt, reviewStartedAt),
    reviewDurationHours: hoursBetween(reviewStartedAt, decisionAt),
    publicationDelayHours: hoursBetween(approvedAt, publishedAt),
  };
};

const buildTimingSummary = (packages) => {
  const rows = packages.map(packageTiming);
  return {
    preparation: timingMetric(rows.map((row) => row.preparationHours)),
    reviewWait: timingMetric(rows.map((row) => row.reviewWaitHours)),
    reviewDuration: timingMetric(rows.map((row) => row.reviewDurationHours)),
    publicationDelay: timingMetric(rows.map((row) => row.publicationDelayHours)),
  };
};

const latestAuditAt = (forecastPackage, actions = null) => {
  const allowed = actions ? new Set(actions) : null;
  const timestamps = (forecastPackage.auditLogs || [])
    .filter((log) => !allowed || allowed.has(log?.action))
    .map((log) => new Date(log.timestamp).getTime())
    .filter(Number.isFinite);
  return timestamps.length ? new Date(Math.max(...timestamps)) : null;
};

const packageTurnaroundHours = (forecastPackage) => {
  const submittedAt =
    firstAuditAt(forecastPackage.auditLogs, ['submitted']) ||
    (forecastPackage.submittedAt ? new Date(forecastPackage.submittedAt) : null);
  const publishedAt =
    firstAuditAt(forecastPackage.auditLogs, ['published'], { after: submittedAt }) ||
    (forecastPackage.publishedAt ? new Date(forecastPackage.publishedAt) : null);
  return hoursBetween(submittedAt, publishedAt);
};

const CURRENT_AGING_STATUS_ACTIONS = Object.freeze({
  Submitted: ['submitted'],
  'Under Review': ['review_started', 'submitted'],
  'Revision Requested': ['revision_requested'],
  Approved: ['approved'],
});

const currentStatusStartedAt = (forecastPackage) => {
  const actions = CURRENT_AGING_STATUS_ACTIONS[forecastPackage.status];
  if (!actions) return null;
  return latestAuditAt(forecastPackage, actions);
};

const agingBucketForHours = (hours) => {
  if (!Number.isFinite(hours) || hours < 0) return null;
  if (hours < 6) return 'under_6h';
  if (hours < 12) return '6_to_12h';
  if (hours < 24) return '12_to_24h';
  if (hours < 48) return '24_to_48h';
  return '48h_plus';
};

const buildBottleneckAnalysis = (packages = [], timing, referenceNow = new Date()) => {
  const stageRows = [
    ['preparation', 'Preparation', timing.preparation],
    ['reviewWait', 'Review wait', timing.reviewWait],
    ['reviewDuration', 'Review duration', timing.reviewDuration],
    ['publicationDelay', 'Publication delay', timing.publicationDelay],
  ]
    .filter(([, , metric]) => metric?.sampleSize > 0)
    .map(([key, label, metric]) => ({
      key,
      label,
      medianHours: metric.medianHours,
      p75Hours: metric.p75Hours,
      p90Hours: metric.p90Hours,
      sampleSize: metric.sampleSize,
    }))
    .sort(
      (a, b) =>
        (Number(b.p90Hours) || 0) - (Number(a.p90Hours) || 0) ||
        (Number(b.medianHours) || 0) - (Number(a.medianHours) || 0)
    );

  const turnaroundRows = packages
    .map((forecastPackage) => ({
      id: String(forecastPackage._id),
      name: forecastPackage.name,
      forecastDate: forecastPackage.forecastDate,
      status: forecastPackage.status,
      turnaroundHours: packageTurnaroundHours(forecastPackage),
      revisionCycles: countAuditAction(forecastPackage, 'revision_requested'),
    }))
    .filter((row) => Number.isFinite(row.turnaroundHours))
    .sort((a, b) => b.turnaroundHours - a.turnaroundHours);

  const nowMs = new Date(referenceNow).getTime();
  const agingRows = packages
    .map((forecastPackage) => {
      const statusStartedAt = currentStatusStartedAt(forecastPackage);
      const startedMs = statusStartedAt?.getTime();
      const ageHours =
        Number.isFinite(nowMs) && Number.isFinite(startedMs) && nowMs >= startedMs
          ? (nowMs - startedMs) / 3600000
          : null;
      return {
        id: String(forecastPackage._id),
        name: forecastPackage.name,
        forecastDate: forecastPackage.forecastDate,
        status: forecastPackage.status,
        statusStartedAt,
        ageHours: roundHours(ageHours),
        bucket: agingBucketForHours(ageHours),
      };
    })
    .filter((row) => row.bucket)
    .sort((a, b) => b.ageHours - a.ageHours);

  const agingBuckets = {
    under_6h: 0,
    '6_to_12h': 0,
    '12_to_24h': 0,
    '24_to_48h': 0,
    '48h_plus': 0,
  };
  for (const row of agingRows) agingBuckets[row.bucket] += 1;

  return {
    slowestStage: stageRows[0] || null,
    stages: stageRows,
    turnaround: {
      ...timingMetric(turnaroundRows.map((row) => row.turnaroundHours)),
      slowestPackages: turnaroundRows.slice(0, 10).map((row) => ({
        ...row,
        turnaroundHours: roundHours(row.turnaroundHours),
      })),
    },
    openAging: {
      asOf: Number.isFinite(nowMs) ? new Date(nowMs).toISOString() : new Date().toISOString(),
      totalOpen: agingRows.length,
      buckets: agingBuckets,
      oldest: agingRows.slice(0, 10),
    },
  };
};

const buildThroughput = (rows = []) => {
  const byDate = new Map();
  for (const row of rows) {
    const key = row?._id?.date;
    const action = row?._id?.action;
    if (!key || !action) continue;
    const point = byDate.get(key) || {
      date: key,
      submitted: 0,
      approved: 0,
      published: 0,
      completed: 0,
      returned: 0,
    };
    const count = Number(row.count) || 0;
    if (action === 'submitted') point.submitted += count;
    if (action === 'approved') point.approved += count;
    if (action === 'published') {
      point.published += count;
      point.completed += count;
    }
    if (action === 'revision_requested' || action === 'rejected') point.returned += count;
    byDate.set(key, point);
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
};

const CHART_ANALYTICS_ACTIONS = new Set([
  'submitted',
  'review_started',
  'revision_requested',
  'approved',
  'rejected',
  'published',
]);

const chartDefinitionByType = new Map(
  REQUIRED_FORECAST_CHARTS.map((chart) => [
    chart.chartType,
    {
      chartType: chart.chartType,
      label: chart.label,
      horizonHours:
        chart.chartType === 'analysis'
          ? 0
          : Number(String(chart.chartType).match(/forecast_(\d+)h/)?.[1]) || null,
      sortOrder: chart.sortOrder,
    },
  ])
);

const projectActionCount = (project, action) =>
  (project.auditLogs || []).filter((log) => log?.action === action).length;

const projectFirstAuditAt = (project, actions, options = {}) =>
  firstAuditAt(project.auditLogs || [], actions, options);

const projectTiming = (project) => {
  const submittedAt =
    projectFirstAuditAt(project, ['submitted']) ||
    (project.submittedAt ? new Date(project.submittedAt) : null);
  const reviewStartedAt =
    projectFirstAuditAt(project, ['review_started', 'moved_to_review'], { after: submittedAt }) ||
    (project.reviewStartedAt ? new Date(project.reviewStartedAt) : null);
  const decisionAt = projectFirstAuditAt(project, ['approved', 'revision_requested', 'rejected'], {
    after: reviewStartedAt,
  });
  const approvedAt = projectFirstAuditAt(project, ['approved']);
  const publishedAt =
    projectFirstAuditAt(project, ['published'], { after: approvedAt }) ||
    (project.publishedAt ? new Date(project.publishedAt) : null);

  return {
    reviewWaitHours: hoursBetween(submittedAt, reviewStartedAt),
    reviewDurationHours: hoursBetween(reviewStartedAt, decisionAt),
    publicationDelayHours: hoursBetween(approvedAt, publishedAt),
    submissionToPublicationHours: hoursBetween(submittedAt, publishedAt),
  };
};

const emptyChartTypeAccumulator = (definition) => ({
  ...definition,
  projects: 0,
  submitted: 0,
  reviewStarted: 0,
  revisionRequests: 0,
  approved: 0,
  rejected: 0,
  published: 0,
  projectsWithRevision: 0,
  firstPassPublished: 0,
  reviewWaitHours: [],
  reviewDurationHours: [],
  publicationDelayHours: [],
  submissionToPublicationHours: [],
});

const serializeChartTypeAccumulator = (row) => ({
  chartType: row.chartType,
  label: row.label,
  horizonHours: row.horizonHours,
  projects: row.projects,
  submitted: row.submitted,
  reviewStarted: row.reviewStarted,
  revisionRequests: row.revisionRequests,
  approved: row.approved,
  rejected: row.rejected,
  published: row.published,
  revisionRate:
    row.submitted > 0 ? Math.round((row.projectsWithRevision / row.submitted) * 1000) / 10 : null,
  firstPassPublicationRate:
    row.published > 0 ? Math.round((row.firstPassPublished / row.published) * 1000) / 10 : null,
  timing: {
    reviewWait: timingMetric(row.reviewWaitHours),
    reviewDuration: timingMetric(row.reviewDurationHours),
    publicationDelay: timingMetric(row.publicationDelayHours),
    submissionToPublication: timingMetric(row.submissionToPublicationHours),
  },
});

async function loadChartTypeAnalytics(range, { ProjectModel = Project } = {}) {
  const projects = await ProjectModel.find({
    chartType: { $in: [...chartDefinitionByType.keys()] },
    ...buildDateMatch('forecastDate', range),
  })
    .select(
      '_id chartType forecastDate status submittedAt reviewStartedAt reviewedAt publishedAt auditLogs'
    )
    .sort({ forecastDate: -1, chartType: 1, _id: -1 })
    .lean();

  const byType = new Map(
    [...chartDefinitionByType.values()].map((definition) => [
      definition.chartType,
      emptyChartTypeAccumulator(definition),
    ])
  );

  for (const project of projects) {
    const row = byType.get(project.chartType);
    if (!row) continue;

    row.projects += 1;
    const counts = Object.fromEntries(
      [...CHART_ANALYTICS_ACTIONS].map((action) => [action, projectActionCount(project, action)])
    );
    row.submitted += counts.submitted;
    row.reviewStarted += counts.review_started;
    row.revisionRequests += counts.revision_requested;
    row.approved += counts.approved;
    row.rejected += counts.rejected;
    row.published += counts.published;

    if (counts.revision_requested > 0) row.projectsWithRevision += 1;
    if (counts.published > 0 && counts.revision_requested === 0) row.firstPassPublished += 1;

    const timing = projectTiming(project);
    if (Number.isFinite(timing.reviewWaitHours)) row.reviewWaitHours.push(timing.reviewWaitHours);
    if (Number.isFinite(timing.reviewDurationHours)) {
      row.reviewDurationHours.push(timing.reviewDurationHours);
    }
    if (Number.isFinite(timing.publicationDelayHours)) {
      row.publicationDelayHours.push(timing.publicationDelayHours);
    }
    if (Number.isFinite(timing.submissionToPublicationHours)) {
      row.submissionToPublicationHours.push(timing.submissionToPublicationHours);
    }
  }

  return [...byType.values()]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(serializeChartTypeAccumulator);
}

const countAuditAction = (forecastPackage, action) =>
  (forecastPackage.auditLogs || []).filter((log) => log?.action === action).length;

const buildWorkflowEfficiency = (packages = []) => {
  const completedPackages = packages.filter((forecastPackage) =>
    COMPLETED_STATUSES.has(forecastPackage.status)
  );
  const revisionCounts = packages.map((forecastPackage) =>
    countAuditAction(forecastPackage, 'revision_requested')
  );
  const revisedPackages = revisionCounts.filter((count) => count > 0);
  const firstPassCompleted = completedPackages.filter(
    (forecastPackage) => countAuditAction(forecastPackage, 'revision_requested') === 0
  ).length;

  return {
    completedPackages: completedPackages.length,
    firstPassCompleted,
    firstPassApprovalRate: completedPackages.length
      ? Math.round((firstPassCompleted / completedPackages.length) * 100)
      : null,
    packagesWithRevision: revisedPackages.length,
    averageRevisionCycles: revisedPackages.length
      ? Math.round(
          (revisedPackages.reduce((sum, count) => sum + count, 0) / revisedPackages.length) * 10
        ) / 10
      : 0,
    maxRevisionCycles: revisedPackages.length ? Math.max(...revisedPackages) : 0,
  };
};

const percentChange = (current, previous) => {
  const currentValue = Number(current) || 0;
  const previousValue = Number(previous) || 0;
  if (previousValue === 0) return currentValue === 0 ? 0 : null;
  return Math.round(((currentValue - previousValue) / previousValue) * 1000) / 10;
};

const percentagePointChange = (current, previous) => {
  if (current == null || previous == null) return null;
  return Math.round((Number(current) - Number(previous)) * 10) / 10;
};

const buildForecastComparison = (current, previous) => ({
  previousRange: previous.range,
  submitted: {
    current: current.summary.submitted,
    previous: previous.summary.submitted,
    percentChange: percentChange(current.summary.submitted, previous.summary.submitted),
  },
  published: {
    current: current.summary.publishedEvents,
    previous: previous.summary.publishedEvents,
    percentChange: percentChange(current.summary.publishedEvents, previous.summary.publishedEvents),
  },
  revisions: {
    current: current.summary.revisionRequests,
    previous: previous.summary.revisionRequests,
    percentChange: percentChange(
      current.summary.revisionRequests,
      previous.summary.revisionRequests
    ),
  },
  completionRate: {
    current: current.summary.completionRate,
    previous: previous.summary.completionRate,
    percentagePointChange: percentagePointChange(
      current.summary.completionRate,
      previous.summary.completionRate
    ),
  },
  firstPassApprovalRate: {
    current: current.efficiency.firstPassApprovalRate,
    previous: previous.efficiency.firstPassApprovalRate,
    percentagePointChange: percentagePointChange(
      current.efficiency.firstPassApprovalRate,
      previous.efficiency.firstPassApprovalRate
    ),
  },
});

const summarizeForecastStatuses = (statusCounts, total) => {
  const count = (status) => Number(statusCounts[status]) || 0;
  const decided = [...DECIDED_STATUSES].reduce((sum, status) => sum + count(status), 0);
  const completed = [...COMPLETED_STATUSES].reduce((sum, status) => sum + count(status), 0);
  const returned = count('Revision Requested') + count('Rejected');
  return {
    packages: total,
    inReview: count('Submitted') + count('Under Review'),
    completed,
    published: count('Published'),
    returned,
    decided,
    completionRate: decided ? Math.round((completed / decided) * 100) : null,
    returnRate: decided ? Math.round((returned / decided) * 100) : null,
  };
};

const loadForecastEventCounts = async (range, ForecastPackageModel = ForecastPackage) => {
  const rows = await ForecastPackageModel.aggregate([
    { $unwind: '$auditLogs' },
    {
      $match: {
        'auditLogs.action': { $in: FORECAST_EVENT_ACTIONS },
        ...buildDateMatch('auditLogs.timestamp', range),
      },
    },
    {
      $facet: {
        byAction: [
          { $group: { _id: '$auditLogs.action', count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ],
        byDay: [
          {
            $project: {
              action: '$auditLogs.action',
              date: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$auditLogs.timestamp',
                  timezone: 'Asia/Manila',
                },
              },
            },
          },
          { $group: { _id: { date: '$date', action: '$action' }, count: { $sum: 1 } } },
          { $sort: { '_id.date': 1, '_id.action': 1 } },
        ],
      },
    },
  ]);
  const result = rows[0] || {};
  return {
    actionCounts: rowsToCountObject(result.byAction),
    throughput: buildThroughput(result.byDay),
  };
};

async function loadForecastAnalyticsPeriod(
  range,
  { ForecastPackageModel = ForecastPackage, ProjectModel = Project, referenceNow = new Date() } = {}
) {
  const match = {
    status: { $in: ANALYTICS_PACKAGE_STATUSES },
    ...buildDateMatch('forecastDate', range),
  };
  const [packages, statusRows, events, chartTypes] = await Promise.all([
    ForecastPackageModel.find(match)
      .select(
        '_id name forecastDate status submittedAt reviewStartedAt reviewedAt publishedAt auditLogs createdAt updatedAt'
      )
      .sort({ forecastDate: -1, _id: -1 })
      .lean(),
    ForecastPackageModel.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ]),
    loadForecastEventCounts(range, ForecastPackageModel),
    loadChartTypeAnalytics(range, { ProjectModel }),
  ]);

  const statusCounts = rowsToCountObject(statusRows);
  const statusSummary = summarizeForecastStatuses(statusCounts, packages.length);
  const actionCount = (action) => Number(events.actionCounts[action]) || 0;
  const timing = buildTimingSummary(packages);

  return {
    total: packages.length,
    sampleSize: packages.length,
    statusCounts,
    summary: {
      ...statusSummary,
      submitted: actionCount('submitted'),
      reviewStarted: actionCount('review_started'),
      approvedEvents: actionCount('approved'),
      publishedEvents: actionCount('published'),
      revisionRequests: actionCount('revision_requested'),
      rejectedEvents: actionCount('rejected'),
    },
    throughput: events.throughput,
    timing,
    efficiency: buildWorkflowEfficiency(packages),
    bottlenecks: buildBottleneckAnalysis(packages, timing, referenceNow),
    chartTypes,
    packages: packages.map((forecastPackage) => {
      const timing = packageTiming(forecastPackage);
      return {
        id: String(forecastPackage._id),
        name: forecastPackage.name,
        forecastDate: forecastPackage.forecastDate,
        status: forecastPackage.status,
        submittedAt:
          forecastPackage.submittedAt || firstAuditAt(forecastPackage.auditLogs, ['submitted']),
        reviewedAt: forecastPackage.reviewedAt || null,
        publishedAt:
          forecastPackage.publishedAt || firstAuditAt(forecastPackage.auditLogs, ['published']),
        reviewDurationHours:
          timing.reviewDurationHours == null
            ? null
            : Math.round(timing.reviewDurationHours * 10) / 10,
        revisionCycles: countAuditAction(forecastPackage, 'revision_requested'),
      };
    }),
    range: serializeAnalyticsRange(range),
    generatedAt: new Date().toISOString(),
  };
}

export async function loadForecastAnalytics(
  range,
  {
    ForecastPackageModel = ForecastPackage,
    ProjectModel = Project,
    includeComparison = true,
    referenceNow = new Date(),
  } = {}
) {
  const current = await loadForecastAnalyticsPeriod(range, {
    ForecastPackageModel,
    ProjectModel,
    referenceNow,
  });
  if (!includeComparison) return current;

  const previousRange = previousAnalyticsRange(range);
  const previous = await loadForecastAnalyticsPeriod(previousRange, {
    ForecastPackageModel,
    ProjectModel,
    referenceNow,
  });

  return {
    ...current,
    comparison: buildForecastComparison(current, previous),
  };
}

export async function loadUserAnalytics(range, { UserModel = User } = {}) {
  const currentMatch = { deletedAt: null };
  const [total, statusRows, roleRows, contributions] = await Promise.all([
    UserModel.countDocuments(currentMatch),
    UserModel.aggregate([
      { $match: currentMatch },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ]),
    UserModel.aggregate([
      { $match: currentMatch },
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ]),
    loadUserContributionAnalytics(range),
  ]);
  const statusCounts = rowsToCountObject(statusRows);
  const active = Number(statusCounts.active) || 0;
  const pending = Number(statusCounts.pending) || 0;
  const restricted = (Number(statusCounts.suspended) || 0) + (Number(statusCounts.locked) || 0);

  return {
    total,
    statusCounts,
    roleCounts: rowsToCountObject(roleRows),
    contributions,
    summary: {
      totalAccounts: total,
      activeAccounts: active,
      pendingAccounts: pending,
      restrictedAccounts: restricted,
      activeContributors: Number(contributions.activeContributors) || 0,
      contributionEvents: Number(contributions.totalEvents) || 0,
    },
    range: serializeAnalyticsRange(range),
    generatedAt: new Date().toISOString(),
  };
}

export async function loadPublicReachAnalytics(range) {
  const publishedChartViews = await loadPublishedChartViewAnalytics(range, {
    currentDateKey: formatManilaDateKey(),
  });

  return {
    ...publishedChartViews,
    summary: {
      viewsToday: publishedChartViews.viewsToday,
      viewsYesterday: publishedChartViews.viewsYesterday,
      periodViews: publishedChartViews.totalViews,
      allTimeViews: publishedChartViews.allTimeViews,
      publishedChartsViewed: publishedChartViews.distinctChartsViewed || 0,
      dayOverDay: publishedChartViews.dayOverDay,
    },
    range: serializeAnalyticsRange(range),
    generatedAt: new Date().toISOString(),
  };
}

const derivePipelineHealth = (models = []) => {
  if (!models.length) return 'unavailable';
  if (models.every((model) => model.state === 'READY')) return 'healthy';
  if (models.some((model) => model.state === 'FAILED')) return 'attention';
  if (
    models.some((model) =>
      ['NORMALIZING', 'BUILDING', 'VALIDATING', 'PUBLISHING'].includes(model.state)
    )
  ) {
    return 'processing';
  }
  return 'waiting';
};

export async function loadSystemAnalytics(
  range,
  { getPipelineStatus = getWavePipelineStatus } = {}
) {
  try {
    const pipeline = await getPipelineStatus();
    const models = (pipeline.models || []).map((model) => ({
      id: String(model.modelId || model.model || ''),
      code: model.model,
      label: model.modelLabel || model.model,
      state: model.state,
      packageDate: model.packageDate,
      packageTag: model.packageTag || null,
      requiredSourceCycle: model.requiredSourceCycle || null,
      sourceCycle: model.sourceCycle || null,
      frameCount: Number(model.frameCount) || 0,
      expectedFrameCount: Number(model.expectedFrameCount) || 0,
      published: Boolean(model.published),
      lastCheckAt: model.lastCheckAt || null,
      completedAt: model.completedAt || null,
    }));
    const cycles = [...new Set(models.map((model) => model.requiredSourceCycle).filter(Boolean))];

    return {
      summary: {
        models: models.length,
        readyModels: models.filter((model) => model.state === 'READY').length,
        packagesAvailable: models.filter((model) => model.published).length,
        pipelineHealth: derivePipelineHealth(models),
        currentForecastCycle: cycles.length === 1 ? cycles[0] : cycles.length > 1 ? 'Mixed' : null,
      },
      packageDate: pipeline.packageDate,
      models,
      deployment: pipeline.deployment || null,
      available: true,
      range: serializeAnalyticsRange(range),
      generatedAt: pipeline.generatedAt || new Date().toISOString(),
    };
  } catch (error) {
    return {
      summary: {
        models: 0,
        readyModels: 0,
        packagesAvailable: 0,
        pipelineHealth: 'unavailable',
        currentForecastCycle: null,
      },
      packageDate: null,
      models: [],
      deployment: null,
      available: false,
      sourceError: error?.message || 'Wave pipeline status is unavailable.',
      range: serializeAnalyticsRange(range),
      generatedAt: new Date().toISOString(),
    };
  }
}

export async function loadAnalyticsOverview(range, permissions = []) {
  const permissionSet = permissions instanceof Set ? permissions : new Set(permissions || []);
  const tasks = [];
  const keys = [];

  if (permissionSet.has('analytics_forecast.view')) {
    keys.push('forecast');
    tasks.push(loadForecastAnalytics(range));
  }
  if (permissionSet.has('analytics_users.view')) {
    keys.push('users');
    tasks.push(loadUserAnalytics(range));
  }
  if (permissionSet.has('analytics_system.view')) {
    keys.push('public');
    tasks.push(loadPublicReachAnalytics(range));
    keys.push('system');
    tasks.push(loadSystemAnalytics(range));
  }

  const settled = await Promise.allSettled(tasks);
  const sections = {};
  const errors = [];
  settled.forEach((result, index) => {
    const key = keys[index];
    if (result.status === 'fulfilled') sections[key] = result.value;
    else
      errors.push({
        section: key,
        message: result.reason?.message || 'Analytics source unavailable.',
      });
  });

  return {
    sections,
    partial: errors.length > 0,
    errors,
    range: serializeAnalyticsRange(range),
    generatedAt: new Date().toISOString(),
  };
}

export function formatAnalyticsHours(value) {
  return value == null || !Number.isFinite(Number(value))
    ? null
    : Math.round(Number(value) * 10) / 10;
}

export function analyticsDateKey(value) {
  return dateKey(value);
}
