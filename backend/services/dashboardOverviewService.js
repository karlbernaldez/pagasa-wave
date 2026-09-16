import ForecastPackage from '../models/ForecastPackage.js';
import { buildDateMatch, parseAnalyticsDateRange } from '../utils/analyticsDateRange.js';
import { FORECAST_PACKAGE_STATUS } from '../utils/forecastPackage.js';
import { getWavePipelineStatus } from './wavePipelineStatus.js';

const DASHBOARD_TIME_ZONE = 'Asia/Manila';
const RECENT_PACKAGE_LIMIT = 6;
const RECENT_ACTIVITY_LIMIT = 8;
const REVIEW_STATUSES = ['Submitted', 'Under Review'];
const RETURNED_STATUSES = ['Revision Requested', 'Rejected'];
const TREND_ACTIONS = ['submitted', 'approved', 'published', 'revision_requested', 'rejected'];
const ATTENTION_PIPELINE_STATES = new Set(['FAILED', 'WAITING_FOR_SOURCE', 'UNKNOWN']);

const toPermissionSet = (permissions = []) =>
  permissions instanceof Set ? permissions : new Set(permissions || []);

const countFromRows = (rows = []) =>
  Object.fromEntries(rows.map((row) => [String(row._id || 'unknown'), Number(row.count) || 0]));

const formatManilaDateKey = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: DASHBOARD_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
};

const serializeRange = (range) => ({
  start: range.start,
  end: range.end,
  days: range.days,
  timezone: range.timezone,
});

const actionTarget = (tab, resourceId = null) => ({
  type: 'dashboard_tab',
  tab,
  ...(resourceId ? { resourceId: String(resourceId) } : {}),
});

export function buildQuickActions(permissions = []) {
  const permissionSet = toPermissionSet(permissions);
  const actions = [];

  if (permissionSet.has('forecast.review')) {
    actions.push({
      key: 'review_queue',
      label: 'Review Queue',
      description: 'Review and resolve submitted forecast packages.',
      icon: 'review',
      target: actionTarget('forecast_review'),
    });
  }

  if (permissionSet.has('forecast.view')) {
    actions.push({
      key: 'forecast_packages',
      label: 'Forecast Packages',
      description: 'Browse operational forecast packages.',
      icon: 'forecast',
      target: actionTarget('forecast_packages'),
    });
  }

  if (permissionSet.has('wave_pipeline.view')) {
    actions.push({
      key: 'wave_pipeline',
      label: 'Wave Pipeline',
      description: 'Inspect wave model source and package readiness.',
      icon: 'pipeline',
      target: actionTarget('wave_pipeline'),
    });
  }

  if (permissionSet.has('wave_models.manage')) {
    actions.push({
      key: 'wave_models',
      label: 'Wave Models',
      description: 'Manage configured operational wave models.',
      icon: 'models',
      target: actionTarget('wave_models'),
    });
  }

  if (permissionSet.has('calendar.view')) {
    actions.push({
      key: 'calendar',
      label: 'Calendar',
      description: 'Open the operational forecast calendar.',
      icon: 'calendar',
      target: actionTarget('calendar'),
    });
  }

  if (
    ['analytics_forecast.view', 'analytics_users.view', 'analytics_system.view'].some(
      (permission) => permissionSet.has(permission)
    )
  ) {
    actions.push({
      key: 'analytics',
      label: 'Analytics',
      description: 'Explore operational trends and outcomes.',
      icon: 'analytics',
      target: actionTarget('analytics'),
    });
  }

  if (permissionSet.has('users.view')) {
    actions.push({
      key: 'users',
      label: 'User Management',
      description: 'Review user account status and access.',
      icon: 'users',
      target: actionTarget('users'),
    });
  }

  return actions;
}

export function buildSummaryCards({
  permissions = [],
  workflowCounts = {},
  publishedToday = 0,
  waveModels = [],
} = {}) {
  const permissionSet = toPermissionSet(permissions);
  const cards = [];
  const canForecastMetrics =
    permissionSet.has('analytics_forecast.view') || permissionSet.has('forecast.review');

  if (canForecastMetrics) {
    const inReview = REVIEW_STATUSES.reduce(
      (sum, status) => sum + (Number(workflowCounts[status]) || 0),
      0
    );
    const returned = RETURNED_STATUSES.reduce(
      (sum, status) => sum + (Number(workflowCounts[status]) || 0),
      0
    );

    cards.push(
      {
        key: 'in_review',
        label: 'In Review',
        value: inReview,
        format: 'integer',
        tone: 'info',
        icon: 'review',
      },
      {
        key: 'returned',
        label: 'Returned',
        value: returned,
        format: 'integer',
        tone: returned > 0 ? 'warning' : 'neutral',
        icon: 'revision',
      },
      {
        key: 'published_today',
        label: 'Published Today',
        value: Number(publishedToday) || 0,
        format: 'integer',
        tone: 'success',
        icon: 'publish',
      }
    );
  }

  if (permissionSet.has('wave_pipeline.view')) {
    const readyModels = waveModels.filter((model) => model.pipelineState === 'READY').length;
    cards.push({
      key: 'models_ready',
      label: 'Models Ready',
      value: readyModels,
      total: waveModels.length,
      format: 'ratio',
      tone: readyModels === waveModels.length && waveModels.length > 0 ? 'success' : 'warning',
      icon: 'models',
    });
  }

  return cards;
}

function buildWaveModels(pipelinePayload) {
  return (pipelinePayload?.models || []).map((model) => ({
    id: model.modelId ? String(model.modelId) : String(model.model || ''),
    key: String(model.model || '').toLowerCase(),
    code: model.model,
    name: model.modelLabel || model.model,
    sourceCycle: model.sourceCycle || model.requiredSourceCycle || null,
    requiredSourceCycle: model.requiredSourceCycle || null,
    frames: {
      ready: Number(model.frameCount) || 0,
      expected: Number(model.expectedFrameCount) || 0,
    },
    package: model.packageTag
      ? {
          name: model.packageTag,
          status: model.published ? 'ready' : String(model.state || '').toLowerCase(),
        }
      : null,
    pipelineState: model.state || 'UNKNOWN',
    message: model.message || '',
    updatedAt: model.completedAt || model.lastCheckAt || pipelinePayload?.generatedAt || null,
  }));
}

function buildPipelineAttention(waveModels = []) {
  return waveModels
    .filter((model) => ATTENTION_PIPELINE_STATES.has(model.pipelineState))
    .map((model) => ({
      id: `wave-model-${model.id}-${model.pipelineState}`,
      type: 'wave_model_status',
      severity: model.pipelineState === 'FAILED' ? 'critical' : 'warning',
      title: `${model.name} needs attention`,
      description: model.message || `${model.name} is not ready for the current operational cycle.`,
      createdAt: model.updatedAt,
      action: {
        label: 'View pipeline',
        target: actionTarget('wave_pipeline', model.id),
      },
    }));
}

function buildForecastAttention(workflowCounts = {}, canReview = false) {
  if (!canReview) return [];
  const inReview = REVIEW_STATUSES.reduce(
    (sum, status) => sum + (Number(workflowCounts[status]) || 0),
    0
  );
  const returned = RETURNED_STATUSES.reduce(
    (sum, status) => sum + (Number(workflowCounts[status]) || 0),
    0
  );
  const items = [];

  if (inReview > 0) {
    items.push({
      id: 'forecast-review-backlog',
      type: 'forecast_review',
      severity: 'info',
      title: `${inReview} forecast package${inReview === 1 ? '' : 's'} awaiting review`,
      description: 'Submitted forecast work is ready for reviewer action.',
      createdAt: null,
      action: {
        label: 'Open review queue',
        target: actionTarget('forecast_review'),
      },
    });
  }

  if (returned > 0) {
    items.push({
      id: 'forecast-returned-backlog',
      type: 'forecast_revision',
      severity: 'warning',
      title: `${returned} forecast package${returned === 1 ? '' : 's'} returned for follow-up`,
      description: 'Revision-requested or rejected forecast work still needs attention.',
      createdAt: null,
      action: {
        label: 'Open review queue',
        target: actionTarget('forecast_review'),
      },
    });
  }

  return items;
}

async function loadForecastAnalytics(range) {
  const packageMatch = buildDateMatch('forecastDate', range);
  const auditTimeMatch = buildDateMatch('auditLogs.timestamp', range);
  const [statusRows, trendRows] = await Promise.all([
    ForecastPackage.aggregate([
      { $match: packageMatch },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ]),
    ForecastPackage.aggregate([
      { $unwind: '$auditLogs' },
      {
        $match: {
          'auditLogs.action': { $in: TREND_ACTIONS },
          ...auditTimeMatch,
        },
      },
      {
        $project: {
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$auditLogs.timestamp',
              timezone: DASHBOARD_TIME_ZONE,
            },
          },
          action: '$auditLogs.action',
        },
      },
      {
        $group: {
          _id: { date: '$date', action: '$action' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]),
  ]);

  const byDate = new Map();
  for (const row of trendRows) {
    const date = row?._id?.date;
    if (!date) continue;
    const point = byDate.get(date) || {
      date,
      submitted: 0,
      approved: 0,
      published: 0,
      returned: 0,
    };
    const action = row?._id?.action;
    const count = Number(row.count) || 0;
    if (action === 'submitted') point.submitted += count;
    if (action === 'approved') point.approved += count;
    if (action === 'published') point.published += count;
    if (action === 'revision_requested' || action === 'rejected') point.returned += count;
    byDate.set(date, point);
  }

  return {
    forecastWorkflowTrend: {
      title: 'Forecast Workflow Trend',
      description: 'Actual workflow events during the selected operating period.',
      series: [
        { key: 'submitted', label: 'Submitted' },
        { key: 'approved', label: 'Approved' },
        { key: 'published', label: 'Published' },
        { key: 'returned', label: 'Returned' },
      ],
      points: [...byDate.values()],
    },
    packageStatusDistribution: statusRows.map((row) => ({
      key: String(row._id || 'unknown')
        .toLowerCase()
        .replaceAll(' ', '_'),
      label: String(row._id || 'Unknown'),
      count: Number(row.count) || 0,
    })),
  };
}

async function loadCurrentWorkflowSummary(todayRange) {
  const [statusRows, publishedToday] = await Promise.all([
    ForecastPackage.aggregate([
      { $match: { status: { $ne: FORECAST_PACKAGE_STATUS.ARCHIVED } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    ForecastPackage.countDocuments({
      status: FORECAST_PACKAGE_STATUS.PUBLISHED,
      ...buildDateMatch('publishedAt', todayRange),
    }),
  ]);

  return {
    workflowCounts: countFromRows(statusRows),
    publishedToday,
  };
}

async function loadRecentPackages() {
  return ForecastPackage.aggregate([
    { $sort: { forecastDate: -1, updatedAt: -1, _id: -1 } },
    { $limit: RECENT_PACKAGE_LIMIT },
    {
      $project: {
        _id: 1,
        name: 1,
        forecastDate: 1,
        status: 1,
        updatedAt: 1,
      },
    },
  ]);
}

async function loadRecentActivity() {
  return ForecastPackage.aggregate([
    { $unwind: '$auditLogs' },
    {
      $match: {
        'auditLogs.action': {
          $in: [
            'submitted',
            'review_started',
            'revision_requested',
            'approved',
            'rejected',
            'published',
          ],
        },
      },
    },
    { $sort: { 'auditLogs.timestamp': -1 } },
    { $limit: RECENT_ACTIVITY_LIMIT },
    {
      $project: {
        packageId: '$_id',
        packageName: '$name',
        action: '$auditLogs.action',
        occurredAt: '$auditLogs.timestamp',
      },
    },
  ]);
}

function serializeRecentPackages(rows = []) {
  return rows.map((row) => ({
    id: String(row._id),
    forecastDate: row.forecastDate,
    name: row.name,
    status: row.status,
    updatedAt: row.updatedAt,
    actions: [
      {
        key: 'open',
        label: 'Open',
        target: actionTarget('forecast_packages', row._id),
      },
    ],
  }));
}

function serializeRecentActivity(rows = []) {
  const labels = {
    submitted: 'Forecast package submitted',
    review_started: 'Forecast review started',
    revision_requested: 'Forecast revision requested',
    approved: 'Forecast package approved',
    rejected: 'Forecast package rejected',
    published: 'Forecast package published',
  };

  return rows.map((row, index) => ({
    id: `${row.packageId}-${row.action}-${new Date(row.occurredAt).getTime()}-${index}`,
    type: `forecast_${row.action}`,
    title: labels[row.action] || 'Forecast package updated',
    description: row.packageName || 'Forecast package',
    occurredAt: row.occurredAt,
    target: actionTarget('forecast_packages', row.packageId),
  }));
}

export async function getDashboardOverview({
  permissions = [],
  query = {},
  now = new Date(),
} = {}) {
  const permissionSet = toPermissionSet(permissions);
  const range = parseAnalyticsDateRange(query, now);
  const operationalDate = formatManilaDateKey(now);
  const todayRange = parseAnalyticsDateRange({ start: operationalDate, end: operationalDate }, now);
  const errors = [];

  const canForecastAnalytics = permissionSet.has('analytics_forecast.view');
  const canForecastMetrics = canForecastAnalytics || permissionSet.has('forecast.review');
  const canViewForecasts =
    permissionSet.has('forecast.view') || permissionSet.has('forecast.review');
  const canReviewForecasts = permissionSet.has('forecast.review');
  const canViewPipeline = permissionSet.has('wave_pipeline.view');

  let forecastAnalytics = null;
  let workflowCounts = {};
  let publishedToday = 0;
  let recentPackages = [];
  let recentActivity = [];
  let waveModels = [];

  const tasks = [];

  if (canForecastAnalytics) {
    tasks.push(
      loadForecastAnalytics(range)
        .then((value) => {
          forecastAnalytics = value;
        })
        .catch((error) => {
          errors.push({
            source: 'forecast_analytics',
            code: 'FORECAST_ANALYTICS_UNAVAILABLE',
            message: error.message || 'Forecast analytics are temporarily unavailable.',
          });
        })
    );
  }

  if (canForecastMetrics) {
    tasks.push(
      loadCurrentWorkflowSummary(todayRange)
        .then((value) => {
          workflowCounts = value.workflowCounts;
          publishedToday = value.publishedToday;
        })
        .catch((error) => {
          errors.push({
            source: 'forecast_summary',
            code: 'FORECAST_SUMMARY_UNAVAILABLE',
            message: error.message || 'Forecast workflow summary is temporarily unavailable.',
          });
        })
    );
  }

  if (canViewForecasts) {
    tasks.push(
      loadRecentPackages()
        .then((value) => {
          recentPackages = value;
        })
        .catch((error) => {
          errors.push({
            source: 'recent_packages',
            code: 'RECENT_PACKAGES_UNAVAILABLE',
            message: error.message || 'Recent forecast packages are temporarily unavailable.',
          });
        })
    );

    tasks.push(
      loadRecentActivity()
        .then((value) => {
          recentActivity = value;
        })
        .catch((error) => {
          errors.push({
            source: 'recent_activity',
            code: 'RECENT_ACTIVITY_UNAVAILABLE',
            message: error.message || 'Recent operational activity is temporarily unavailable.',
          });
        })
    );
  }

  if (canViewPipeline) {
    tasks.push(
      getWavePipelineStatus(now)
        .then((value) => {
          waveModels = buildWaveModels(value);
        })
        .catch((error) => {
          errors.push({
            source: 'wave_models',
            code: 'WAVE_MODEL_STATUS_UNAVAILABLE',
            message: error.message || 'Wave model readiness is temporarily unavailable.',
          });
        })
    );
  }

  await Promise.all(tasks);

  return {
    meta: {
      operationalDate,
      generatedAt: new Date().toISOString(),
      timezone: DASHBOARD_TIME_ZONE,
      range: serializeRange(range),
      partial: errors.length > 0,
    },
    summaryCards: buildSummaryCards({
      permissions: permissionSet,
      workflowCounts,
      publishedToday,
      waveModels,
    }),
    forecastWorkflowTrend: canForecastAnalytics
      ? forecastAnalytics?.forecastWorkflowTrend || null
      : null,
    packageStatusDistribution: canForecastAnalytics
      ? forecastAnalytics?.packageStatusDistribution || []
      : [],
    waveModels: canViewPipeline ? waveModels : [],
    recentPackages: canViewForecasts ? serializeRecentPackages(recentPackages) : [],
    attentionItems: [
      ...buildForecastAttention(workflowCounts, canReviewForecasts),
      ...buildPipelineAttention(waveModels),
    ],
    recentActivity: canViewForecasts ? serializeRecentActivity(recentActivity) : [],
    quickActions: buildQuickActions(permissionSet),
    errors,
  };
}
