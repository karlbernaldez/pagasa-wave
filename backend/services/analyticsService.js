import ForecastPackage from '../models/ForecastPackage.js';
import User from '../models/User.js';
import {
  loadPublishedChartViewAnalytics,
  loadUserContributionAnalytics,
} from './operationalAnalyticsService.js';
import { formatManilaDateKey } from './publishedChartViewService.js';
import { getWavePipelineStatus } from './wavePipelineStatus.js';
import { buildDateMatch, parseAnalyticsDateRange } from '../utils/analyticsDateRange.js';

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

const median = (values = []) => {
  const clean = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!clean.length) return null;
  const middle = Math.floor(clean.length / 2);
  return clean.length % 2 ? clean[middle] : (clean[middle - 1] + clean[middle]) / 2;
};

const timingMetric = (values) => {
  const value = median(values);
  return {
    medianHours: value == null ? null : Math.round(value * 10) / 10,
    sampleSize: values.filter(Number.isFinite).length,
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

const buildThroughput = (rows = []) => {
  const byDate = new Map();
  for (const row of rows) {
    const key = row?._id?.date;
    const action = row?._id?.action;
    if (!key || !action) continue;
    const point = byDate.get(key) || { date: key, submitted: 0, completed: 0, returned: 0 };
    const count = Number(row.count) || 0;
    if (action === 'submitted') point.submitted += count;
    if (action === 'approved' || action === 'published') point.completed += count;
    if (action === 'revision_requested' || action === 'rejected') point.returned += count;
    byDate.set(key, point);
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
};

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

export async function loadForecastAnalytics(
  range,
  { ForecastPackageModel = ForecastPackage } = {}
) {
  const match = {
    status: { $in: ANALYTICS_PACKAGE_STATUSES },
    ...buildDateMatch('forecastDate', range),
  };
  const [packages, statusRows, events] = await Promise.all([
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
  ]);

  const statusCounts = rowsToCountObject(statusRows);
  const statusSummary = summarizeForecastStatuses(statusCounts, packages.length);
  const actionCount = (action) => Number(events.actionCounts[action]) || 0;

  return {
    total: packages.length,
    sampleSize: packages.length,
    statusCounts,
    summary: {
      ...statusSummary,
      submitted: actionCount('submitted'),
      publishedEvents: actionCount('published'),
      revisionRequests: actionCount('revision_requested'),
    },
    throughput: events.throughput,
    timing: buildTimingSummary(packages),
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
      };
    }),
    range: serializeAnalyticsRange(range),
    generatedAt: new Date().toISOString(),
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
