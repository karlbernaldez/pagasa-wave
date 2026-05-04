import asyncHandler from '../utils/asyncHandler.js';
import { throwError } from '../utils/errorHelper.js';
import Project from '../models/Project.js';
import User from '../models/User.js';

const ALLOWED_ADMIN_STATUSES = [
  'Submitted',
  'Under Review',
  'Revision Requested',
  'Approved',
  'Published',
  'Rejected',
  'Archived',
];

const ALLOWED_CHART_TYPES = [
  'analysis',
  'forecast_24h',
  'forecast_36h',
  'forecast_48h',
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
  if (!req.user || req.user.role !== 'admin') {
    throwError('Admin access required', 403);
  }

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

  const [projects, total] = await Promise.all([
    Project.find(query)
      .populate('owner', 'firstName lastName email username')
      .populate('reviewStartedBy', 'firstName lastName email username')
      .populate('approvedBy', 'firstName lastName email username')
      .populate('rejectedBy', 'firstName lastName email username')
      .populate('auditLogs.performedBy', 'firstName lastName email username')
      .sort(sortQuery)
      .skip(skip)
      .limit(limitNumber)
      .lean(),
    Project.countDocuments(query),
  ]);

  res.json({
    projects,
    total,
    page: pageNumber,
    limit: limitNumber,
    totalPages: Math.max(1, Math.ceil(total / limitNumber)),
  });
});
