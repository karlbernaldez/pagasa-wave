import asyncHandler from '../utils/asyncHandler.js';
import { throwError } from '../utils/errorHelper.js';
import Project from '../models/Project.js';
import Feature from '../models/Feature.js';
import { PROJECT_STATUS } from '../utils/projectWorkflow.js';

const PUBLIC_LIST_STATUS = Object.freeze({
  ACTIVE: 'active',
  ARCHIVE: 'archive',
  ALL: 'all',
});

function getProjectOwnerId(project) {
  return String(project?.owner?._id || project?.owner || '');
}

function canViewPublishedForecast(project, user) {
  if (!project || !user) return false;
  if (user.role === 'admin') return true;
  return getProjectOwnerId(project) === String(user.id);
}

function getStableFeatureId(feature) {
  return feature?.properties?.stableId || feature?.properties?.annotationId || feature?.properties?.sourceId || feature?.sourceId;
}

function toFeatureSnapshot(feature) {
  const stableId = getStableFeatureId(feature);

  return {
    type: 'Feature',
    id: stableId,
    geometry: feature.geometry,
    properties: {
      ...(feature.properties || {}),
      name: feature.name,
      sourceId: feature.sourceId,
      stableId,
      annotationId: stableId,
    },
  };
}

function getPublishedFeatureCollectionFromVersions(project) {
  const versions = Array.isArray(project?.versions) ? project.versions : [];
  const publishedVersion = [...versions]
    .reverse()
    .find((version) => version?.reason === 'publish' && (version.featureCollection || version.snapshot));

  const source = publishedVersion?.featureCollection || publishedVersion?.snapshot;

  if (source?.type === 'FeatureCollection' && Array.isArray(source.features)) {
    return source;
  }

  return null;
}

async function getCurrentFeatureCollection(projectId) {
  const features = await Feature.find({
    'properties.project': projectId,
  }).lean();

  return {
    type: 'FeatureCollection',
    features: features.map(toFeatureSnapshot),
  };
}

function getPublicProjectPayload(project) {
  return {
    _id: project._id,
    name: project.name,
    description: project.description,
    chartType: project.chartType,
    forecastDate: project.forecastDate,
    status: project.status,
    publishedAt: project.publishedAt,
    owner: project.owner,
    approvedBy: project.approvedBy,
    auditLogs: project.auditLogs,
    reviewComment: project.reviewComment,
  };
}

async function buildPublishedForecastPayload(project, { canArchive = false } = {}) {
  const versionFeatureCollection = getPublishedFeatureCollectionFromVersions(project);
  const featureCollection = versionFeatureCollection || await getCurrentFeatureCollection(project._id);

  return {
    project: getPublicProjectPayload(project),
    featureCollection,
    canArchive,
  };
}

async function findPublishedProject(projectId) {
  const project = await Project.findOne({
    _id: projectId,
    status: { $in: [PROJECT_STATUS.PUBLISHED, PROJECT_STATUS.ARCHIVED] },
  })
    .populate('owner', 'firstName lastName email username position')
    .populate('reviewStartedBy', 'firstName lastName email username')
    .populate('approvedBy', 'firstName lastName email username')
    .populate('rejectedBy', 'firstName lastName email username')
    .populate('auditLogs.performedBy', 'firstName lastName email username');

  if (!project) {
    throwError('Published forecast not found', 404);
  }

  return project;
}

function getDateBoundary(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function getListMode(value) {
  const mode = String(value || PUBLIC_LIST_STATUS.ACTIVE).toLowerCase();
  return Object.values(PUBLIC_LIST_STATUS).includes(mode) ? mode : PUBLIC_LIST_STATUS.ACTIVE;
}

function buildPublicListQuery(req) {
  const mode = getListMode(req.query.mode);
  const search = String(req.query.search || '').trim();
  const before = getDateBoundary(req.query.before);
  const after = getDateBoundary(req.query.after);
  const query = {};

  if (mode === PUBLIC_LIST_STATUS.ARCHIVE) {
    query.status = { $in: [PROJECT_STATUS.PUBLISHED, PROJECT_STATUS.ARCHIVED] };
  } else if (mode === PUBLIC_LIST_STATUS.ALL) {
    query.status = { $in: [PROJECT_STATUS.PUBLISHED, PROJECT_STATUS.ARCHIVED] };
  } else {
    query.status = PROJECT_STATUS.PUBLISHED;
  }

  if (before || after) {
    query.forecastDate = {};
    if (before) query.forecastDate.$lt = before;
    if (after) query.forecastDate.$gte = after;
  }

  if (search) {
    const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 80);
    query.$or = [
      { name: { $regex: safeSearch, $options: 'i' } },
      { description: { $regex: safeSearch, $options: 'i' } },
      { chartType: { $regex: safeSearch, $options: 'i' } },
    ];
  }

  return { mode, query };
}

export const listPublicPublishedForecasts = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 50);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const skip = (page - 1) * limit;
  const { mode, query } = buildPublicListQuery(req);

  const [projects, total] = await Promise.all([
    Project.find(query)
      .select('name description chartType forecastDate status publishedAt owner approvedBy reviewComment')
      .populate('owner', 'firstName lastName username')
      .populate('approvedBy', 'firstName lastName username')
      .sort({ forecastDate: -1, publishedAt: -1, updatedAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Project.countDocuments(query),
  ]);

  res.json({
    projects,
    total,
    page,
    limit,
    mode,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    hasMore: page < Math.max(1, Math.ceil(total / limit)),
  });
});

export const getPublicPublishedForecastOutput = asyncHandler(async (req, res) => {
  const project = await findPublishedProject(req.params.id);
  const canArchive = req.user?.role === 'admin' && project.status === PROJECT_STATUS.PUBLISHED;
  res.json(await buildPublishedForecastPayload(project, { canArchive }));
});

export const getPublishedForecastOutput = asyncHandler(async (req, res) => {
  if (!req.user) throwError('Unauthorized', 401);

  const project = await findPublishedProject(req.params.id);

  if (!canViewPublishedForecast(project, req.user)) {
    throwError('You do not have access to this published forecast', 403);
  }

  res.json(await buildPublishedForecastPayload(project, { canArchive: req.user.role === 'admin' && project.status === PROJECT_STATUS.PUBLISHED }));
});
