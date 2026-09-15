import asyncHandler from '../utils/asyncHandler.js';
import { throwError } from '../utils/errorHelper.js';
import ForecastPackage from '../models/ForecastPackage.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import { PROJECT_STATUS } from '../utils/projectWorkflow.js';

const ALLOWED_ADMIN_STATUSES = Object.freeze([
  PROJECT_STATUS.SUBMITTED,
  PROJECT_STATUS.UNDER_REVIEW,
  PROJECT_STATUS.REVISION_REQUESTED,
  PROJECT_STATUS.APPROVED,
  PROJECT_STATUS.PUBLISHED,
  PROJECT_STATUS.REJECTED,
  PROJECT_STATUS.NO_PUBLICATION,
  PROJECT_STATUS.ARCHIVED,
]);

const ALLOWED_CHART_TYPES = ['analysis', 'forecast_24h', 'forecast_36h', 'forecast_48h'];

const CHART_TYPE_SORT = ALLOWED_CHART_TYPES.reduce((order, chartType, index) => {
  order[chartType] = index;
  return order;
}, {});

const CHART_NAME_SUFFIX_PATTERNS = [
  /\s[-–—]\s*(wave\s*)?analysis\s*(chart)?\s*$/i,
  /\s[-–—]\s*(24|24h|24-hour|24\s*hour)\s*(wave\s*)?(forecast\s*)?(chart)?\s*$/i,
  /\s[-–—]\s*(36|36h|36-hour|36\s*hour)\s*(wave\s*)?(forecast\s*)?(chart)?\s*$/i,
  /\s[-–—]\s*(48|48h|48-hour|48\s*hour)\s*(wave\s*)?(forecast\s*)?(chart)?\s*$/i,
];

const ADMIN_PROJECT_SORT_FIELDS = {
  name: 'name',
  chartType: 'chartType',
  type: 'chartType',
  forecastDate: 'forecastDate',
  status: 'status',
  lastOpenedAt: 'lastOpenedAt',
  submittedAt: 'submittedAt',
  updatedAt: 'updatedAt',
  createdAt: 'createdAt',
};

function assertAuthorizedPermission(req, permission) {
  if (!req.user) throwError('Unauthorized', 401);
  if (
    !Array.isArray(req.authorizedPermissions) ||
    !req.authorizedPermissions.includes(permission)
  ) {
    throwError('You do not have permission to perform this action.', 403);
  }
}

function clampInt(value, min, max, fallback) {
  const number = Math.trunc(Number(value));
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getDateRangeFilter(dateRange) {
  const daysByRange = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
  };

  const days = daysByRange[dateRange];
  if (!days) return null;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function getDateBounds(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return { start, end };
}

function getPackageNamePrefix(projectName = '') {
  const name = String(projectName || '').trim();
  if (!name) return '';

  return CHART_NAME_SUFFIX_PATTERNS.reduce(
    (current, pattern) => current.replace(pattern, ''),
    name
  ).trim();
}

function getPackageNameRegex(projectName = '') {
  const prefix = getPackageNamePrefix(projectName);
  if (!prefix || prefix.length < 6) return null;
  return new RegExp(`^${escapeRegex(prefix)}(?:\\s[-–—]\\s|$)`, 'i');
}

function getIsoDateTokens(value = '') {
  return [...String(value || '').matchAll(/\b\d{4}-\d{2}-\d{2}\b/g)].map((match) => match[0]);
}

function pushDateBoundsFilter(filters, field, value) {
  const bounds = getDateBounds(value);
  if (!bounds) return null;

  filters.push({ [field]: { $gte: bounds.start, $lt: bounds.end } });
  return bounds;
}

function uniqueProjectsById(projects = []) {
  const seen = new Set();
  return projects.filter((project) => {
    const id = String(project?._id || '');
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function sortProjectsByChartType(projects = []) {
  return [...projects].sort((a, b) => {
    const typeDiff = (CHART_TYPE_SORT[a?.chartType] ?? 99) - (CHART_TYPE_SORT[b?.chartType] ?? 99);
    if (typeDiff !== 0) return typeDiff;
    return new Date(b?.updatedAt || 0) - new Date(a?.updatedAt || 0);
  });
}

function getPackageProjects(forecastPackage) {
  return sortProjectsByChartType(
    uniqueProjectsById(
      (forecastPackage?.charts || [])
        .map((chart) => chart?.project)
        .filter((project) => project && typeof project === 'object')
        .filter((project) => ALLOWED_CHART_TYPES.includes(project.chartType))
    )
  );
}

function withAdminProjectPopulates(query) {
  return query
    .populate('owner', 'firstName lastName email username')
    .populate('forecastPackage', 'name forecastDate status')
    .populate('reviewStartedBy', 'firstName lastName email username')
    .populate('approvedBy', 'firstName lastName email username')
    .populate('rejectedBy', 'firstName lastName email username')
    .populate('noPublicationBy', 'firstName lastName email username')
    .populate('auditLogs.performedBy', 'firstName lastName email username');
}

function withPackagePopulates(query) {
  return query
    .populate('owner', 'firstName lastName email username')
    .populate('reviewStartedBy', 'firstName lastName email username')
    .populate('approvedBy', 'firstName lastName email username')
    .populate('rejectedBy', 'firstName lastName email username')
    .populate({
      path: 'charts.project',
      populate: [
        { path: 'owner', select: 'firstName lastName email username' },
        { path: 'forecastPackage', select: 'name forecastDate status' },
        { path: 'reviewStartedBy', select: 'firstName lastName email username' },
        { path: 'approvedBy', select: 'firstName lastName email username' },
        { path: 'rejectedBy', select: 'firstName lastName email username' },
        { path: 'noPublicationBy', select: 'firstName lastName email username' },
        { path: 'auditLogs.performedBy', select: 'firstName lastName email username' },
      ],
    });
}

function buildStatusCounts(rows) {
  return ALLOWED_ADMIN_STATUSES.reduce(
    (counts, status) => {
      counts[status] = 0;
      return counts;
    },
    rows.reduce((counts, row) => {
      if (row?._id) counts[row._id] = row.count;
      return counts;
    }, {})
  );
}

async function getOwnerSearchIds(searchRegex) {
  const owners = await User.find({
    $or: [
      { username: searchRegex },
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
    ],
  })
    .select('_id')
    .limit(100)
    .lean();

  return owners.map((owner) => owner._id);
}

export const getAdminProjects = asyncHandler(async (req, res) => {
  assertAuthorizedPermission(req, 'projects.review');

  const {
    page = 1,
    limit = 12,
    search = '',
    status = '',
    type = '',
    dateRange = '',
    sortBy = 'updatedAt',
    sortDir = 'desc',
  } = req.query;

  const pageNumber = clampInt(page, 1, Number.MAX_SAFE_INTEGER, 1);
  const limitNumber = clampInt(limit, 1, 100, 12);
  const skip = (pageNumber - 1) * limitNumber;

  const query = {
    status: { $in: ALLOWED_ADMIN_STATUSES },
  };

  const filters = [];

  if (status && status !== 'All') {
    if (!ALLOWED_ADMIN_STATUSES.includes(status)) {
      throwError('Invalid or unauthorized status filter', 400);
    }
    filters.push({ status });
  }

  if (type && type !== 'All') {
    const normalizedType = String(type).trim();
    if (!ALLOWED_CHART_TYPES.includes(normalizedType)) {
      throwError('Invalid project type filter', 400);
    }
    filters.push({ chartType: normalizedType });
  }

  const cutoffDate = getDateRangeFilter(dateRange);
  if (cutoffDate) {
    const dateQuery = { $gte: cutoffDate };
    filters.push({
      $or: [
        { updatedAt: dateQuery },
        { submittedAt: dateQuery },
        { noPublicationAt: dateQuery },
        { forecastDate: dateQuery },
      ],
    });
  }

  const trimmedSearch = String(search || '').trim();
  if (trimmedSearch) {
    const safeSearch = escapeRegex(trimmedSearch.slice(0, 80));
    const searchRegex = new RegExp(safeSearch, 'i');
    const ownerIds = await getOwnerSearchIds(searchRegex);

    filters.push({
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { chartType: searchRegex },
        { noPublicationReason: searchRegex },
        { noPublicationNotes: searchRegex },
        ...(ownerIds.length > 0 ? [{ owner: { $in: ownerIds } }] : []),
      ],
    });
  }

  if (filters.length > 0) {
    query.$and = filters;
  }

  const sortField = ADMIN_PROJECT_SORT_FIELDS[sortBy] || 'updatedAt';
  const sortDirection = sortDir === 'asc' ? 1 : -1;
  const sortQuery = {
    [sortField]: sortDirection,
    updatedAt: -1,
    submittedAt: -1,
    createdAt: -1,
    _id: -1,
  };

  const [projects, total, statusCountRows] = await Promise.all([
    withAdminProjectPopulates(Project.find(query))
      .sort(sortQuery)
      .skip(skip)
      .limit(limitNumber)
      .lean(),
    Project.countDocuments(query),
    Project.aggregate([{ $match: query }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  res.json({
    projects,
    total,
    page: pageNumber,
    limit: limitNumber,
    totalPages: Math.max(1, Math.ceil(total / limitNumber)),
    statusCounts: buildStatusCounts(statusCountRows),
  });
});

async function findPackageByProject(project) {
  if (project.forecastPackage) {
    const forecastPackage = await withPackagePopulates(
      ForecastPackage.findById(project.forecastPackage)
    ).lean();

    if (forecastPackage) return forecastPackage;
  }

  const directPackage = await withPackagePopulates(
    ForecastPackage.findOne({ 'charts.project': project._id })
  ).lean();

  if (directPackage) return directPackage;

  const forecastBounds = getDateBounds(project.forecastDate);
  if (!forecastBounds) return null;

  return withPackagePopulates(
    ForecastPackage.findOne({
      forecastDate: { $gte: forecastBounds.start, $lt: forecastBounds.end },
    })
  ).lean();
}

async function findLegacyPackageProjects(project) {
  const packageFilters = [];
  const packageNameRegex = getPackageNameRegex(project.name);
  const isoDateTokens = getIsoDateTokens(project.name);

  if (packageNameRegex) {
    packageFilters.push({ name: packageNameRegex });
  }

  isoDateTokens.forEach((dateToken) => {
    packageFilters.push({ name: new RegExp(escapeRegex(dateToken), 'i') });
  });

  const forecastBounds = pushDateBoundsFilter(packageFilters, 'forecastDate', project.forecastDate);
  pushDateBoundsFilter(packageFilters, 'submittedAt', project.submittedAt);
  pushDateBoundsFilter(packageFilters, 'createdAt', project.createdAt);

  const query = {
    status: { $in: ALLOWED_ADMIN_STATUSES },
    chartType: { $in: ALLOWED_CHART_TYPES },
    ...(packageFilters.length > 0 ? { $or: packageFilters } : {}),
  };

  const projects = sortProjectsByChartType(
    uniqueProjectsById(
      await withAdminProjectPopulates(Project.find(query))
        .sort({ forecastDate: -1, chartType: 1, updatedAt: -1, _id: -1 })
        .limit(20)
        .lean()
    )
  );

  return {
    forecastDate: forecastBounds?.start || getDateBounds(project.forecastDate)?.start || null,
    packageName: getPackageNamePrefix(project.name),
    projects,
  };
}

export const getAdminForecastPackage = asyncHandler(async (req, res) => {
  assertAuthorizedPermission(req, 'projects.review');

  const project = await Project.findById(req.params.id)
    .select('name forecastDate submittedAt createdAt owner forecastPackage')
    .lean();

  if (!project) throwError('Project not found', 404);

  const forecastPackage = await findPackageByProject(project);

  if (forecastPackage) {
    const projects = getPackageProjects(forecastPackage);

    return res.json({
      package: {
        _id: forecastPackage._id,
        id: forecastPackage._id,
        name: forecastPackage.name,
        forecastDate: forecastPackage.forecastDate,
        status: forecastPackage.status,
      },
      forecastDate: forecastPackage.forecastDate,
      packageName: forecastPackage.name,
      expectedChartTypes: ALLOWED_CHART_TYPES,
      chartCount: projects.length,
      isComplete: ALLOWED_CHART_TYPES.every((chartType) =>
        projects.some((candidate) => candidate.chartType === chartType)
      ),
      projects,
    });
  }

  const legacyPackage = await findLegacyPackageProjects(project);
  const projects = legacyPackage.projects;

  return res.json({
    package: null,
    forecastDate: legacyPackage.forecastDate,
    packageName: legacyPackage.packageName,
    expectedChartTypes: ALLOWED_CHART_TYPES,
    chartCount: projects.length,
    isComplete: ALLOWED_CHART_TYPES.every((chartType) =>
      projects.some((candidate) => candidate.chartType === chartType)
    ),
    projects,
  });
});
