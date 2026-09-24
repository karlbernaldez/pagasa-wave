import { loadAnalyticsOverview, loadSystemAnalytics } from '../services/analyticsService.js';
import ForecastPackage from '../models/ForecastPackage.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import {
  loadPublishedChartViewAnalytics,
  loadUserContributionAnalytics,
} from '../services/operationalAnalyticsService.js';
import { formatManilaDateKey } from '../services/publishedChartViewService.js';
import { buildDateMatch, parseAnalyticsDateRange } from '../utils/analyticsDateRange.js';
import { parseForecastAnalyticsFilters } from '../utils/forecastAnalyticsFilters.js';
import {
  buildUserAnalyticsExportRows,
  USER_ANALYTICS_EXPORT_HEADERS,
} from '../utils/analyticsSanitizers.js';
import { toCsv } from '../utils/csv.js';

const ANALYTICS_PACKAGE_STATUSES = Object.freeze([
  'Submitted',
  'Under Review',
  'Revision Requested',
  'Approved',
  'Published',
  'Rejected',
  'Archived',
]);

const sendCsv = (res, filename, headers, rows) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.status(200).send(`\uFEFF${toCsv(headers, rows)}\n`);
};

const filenameFor = (section, range) =>
  `wavelab-${section}-analytics-${range.start}-to-${range.end}.csv`;

export const exportAnalyticsOverview = async (req, res, next) => {
  try {
    const range = parseAnalyticsDateRange(req.query);
    const overview = await loadAnalyticsOverview(range, req.permissions || []);
    const rows = [
      ['metadata.timezone', range.timezone],
      ['metadata.generated_at', overview.generatedAt],
    ];

    for (const [section, payload] of Object.entries(overview.sections || {})) {
      for (const [key, value] of Object.entries(payload.summary || {})) {
        if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
          rows.push([`${section}.summary.${key}`, value ?? '']);
        }
      }
    }

    for (const error of overview.errors || []) {
      rows.push([`${error.section}.availability`, 'unavailable']);
    }

    return sendCsv(res, filenameFor('overview', range), ['metric', 'value'], rows);
  } catch (error) {
    return next(error);
  }
};
export const exportForecastAnalytics = async (req, res, next) => {
  try {
    const range = parseAnalyticsDateRange(req.query);
    const filters = parseForecastAnalyticsFilters(req.query);
    const useChartScope = Boolean(filters.chartType);
    const Model = useChartScope ? Project : ForecastPackage;
    const match = {
      ...(useChartScope
        ? { chartType: filters.chartType }
        : { status: { $in: ANALYTICS_PACKAGE_STATUSES } }),
      ...(filters.status ? { status: filters.status } : {}),
      ...buildDateMatch('forecastDate', range),
    };
    const rows = await Model.aggregate([
      { $match: match },
      { $sort: { forecastDate: -1, _id: -1 } },
      { $limit: 1000 },
      {
        $project: {
          _id: 1,
          name: 1,
          chartType: 1,
          forecastDate: 1,
          status: 1,
          submittedAt: 1,
          reviewedAt: 1,
          publishedAt: 1,
        },
      },
    ]);

    return sendCsv(
      res,
      filenameFor('forecast', range),
      [
        'record_id',
        'record_type',
        'chart_type',
        'name',
        'forecast_date',
        'status',
        'submitted_at',
        'reviewed_at',
        'published_at',
      ],
      rows.map((row) => [
        row._id,
        useChartScope ? 'chart' : 'package',
        row.chartType || '',
        row.name,
        row.forecastDate,
        row.status,
        row.submittedAt,
        row.reviewedAt,
        row.publishedAt,
      ])
    );
  } catch (error) {
    return next(error);
  }
};

export const exportUserAnalytics = async (req, res, next) => {
  try {
    const range = parseAnalyticsDateRange(req.query);
    const match = {
      deletedAt: null,
      ...buildDateMatch('createdAt', range),
    };
    const [total, statusRows, roleRows, contributions] = await Promise.all([
      User.countDocuments(match),
      User.aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
      ]),
      User.aggregate([
        { $match: match },
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
      ]),
      loadUserContributionAnalytics(range),
    ]);

    return sendCsv(
      res,
      filenameFor('users', range),
      USER_ANALYTICS_EXPORT_HEADERS,
      buildUserAnalyticsExportRows({ total, statusRows, roleRows, contributions })
    );
  } catch (error) {
    return next(error);
  }
};

export const exportPublicReachAnalytics = async (req, res, next) => {
  try {
    const range = parseAnalyticsDateRange(req.query);
    const publishedChartViews = await loadPublishedChartViewAnalytics(range, {
      currentDateKey: formatManilaDateKey(),
    });
    const rows = [
      ['metadata.timezone', range.timezone],
      ['metadata.generated_at', new Date().toISOString()],
      ['views.period', publishedChartViews.totalViews],
      ['views.all_time', publishedChartViews.allTimeViews],
      ['views.today', publishedChartViews.viewsToday],
      ['views.yesterday', publishedChartViews.viewsYesterday],
      ['charts.distinct_viewed', publishedChartViews.distinctChartsViewed || 0],
      ...publishedChartViews.trend.map((row) => [`views.daily.${row.date}`, row.views]),
      ...publishedChartViews.topCharts.map((row) => [
        `views.chart.${row.projectId}.${row.name || 'published-chart'}`,
        row.views,
      ]),
    ];
    return sendCsv(res, filenameFor('public', range), ['metric', 'value'], rows);
  } catch (error) {
    return next(error);
  }
};

export const exportSystemAnalytics = async (req, res, next) => {
  try {
    const range = parseAnalyticsDateRange(req.query);
    const payload = await loadSystemAnalytics(range);
    const history = payload.history || {};
    const historySummary = history.summary || {};

    const rows = [
      ['metadata.timezone', range.timezone],
      ['metadata.generated_at', payload.generatedAt],
      ['current.models', payload.summary?.models ?? 0],
      ['current.models_ready', payload.summary?.readyModels ?? 0],
      ['current.packages_available', payload.summary?.packagesAvailable ?? 0],
      ['current.pipeline_health', payload.summary?.pipelineHealth ?? 'unavailable'],
      ['current.forecast_cycle', payload.summary?.currentForecastCycle ?? ''],
      ['current.package_date', payload.packageDate ?? ''],
      ['history.collecting_since', history.collectingSince ?? ''],
      ['history.runs', historySummary.runs ?? 0],
      ['history.successful', historySummary.successful ?? 0],
      ['history.failed', historySummary.failed ?? 0],
      ['history.retry_attempts', historySummary.retryAttempts ?? 0],
      ['history.success_rate_percent', historySummary.successRate ?? ''],
      ['history.failure_rate_percent', historySummary.failureRate ?? ''],
      ['history.median_duration_seconds', historySummary.medianDurationSeconds ?? ''],
      ['history.p90_duration_seconds', historySummary.p90DurationSeconds ?? ''],
      ['history.duration_sample_size', historySummary.durationSampleSize ?? 0],
      ['alerts.active', payload.alerts?.active ?? false],
      ['alerts.critical', payload.alerts?.critical ?? 0],
      ['alerts.warning', payload.alerts?.warning ?? 0],
      ...((payload.alerts?.alerts || []).flatMap((alert, index) => [
        [`alerts.${index + 1}.severity`, alert.severity || ''],
        [`alerts.${index + 1}.type`, alert.type || ''],
        [`alerts.${index + 1}.model`, alert.model || ''],
        [`alerts.${index + 1}.message`, alert.message || ''],
      ])),
      ...payload.models.map((model) => [`current.model.${model.code}.state`, model.state || '']),
      ...payload.models.map((model) => [
        `current.model.${model.code}.frame_coverage`,
        `${model.frameCount || 0}/${model.expectedFrameCount || 0}`,
      ]),
      ...(history.models || []).flatMap((model) => [
        [`history.model.${model.model}.runs`, model.runs],
        [`history.model.${model.model}.successful`, model.successful],
        [`history.model.${model.model}.failed`, model.failed],
        [`history.model.${model.model}.retry_attempts`, model.retryAttempts],
        [`history.model.${model.model}.success_rate_percent`, model.successRate ?? ''],
        [`history.model.${model.model}.median_duration_seconds`, model.medianDurationSeconds ?? ''],
        [`history.model.${model.model}.p90_duration_seconds`, model.p90DurationSeconds ?? ''],
      ]),
      ...(history.trend || []).flatMap((point) => [
        [`history.daily.${point.date}.runs`, point.runs],
        [`history.daily.${point.date}.successful`, point.successful],
        [`history.daily.${point.date}.failed`, point.failed],
      ]),
    ];

    return sendCsv(res, filenameFor('system', range), ['metric', 'value'], rows);
  } catch (error) {
    return next(error);
  }
};
