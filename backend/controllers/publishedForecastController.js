import asyncHandler from '../utils/asyncHandler.js';
import { throwError } from '../utils/errorHelper.js';
import Project from '../models/Project.js';
import Feature from '../models/Feature.js';
import { PROJECT_STATUS } from '../utils/projectWorkflow.js';
import { formatLocalDateKey } from '../utils/forecastPackage.js';

const DEFAULT_RASTER_BOUNDS = [100, -5, 180, 50];
const DEFAULT_MODEL_RUN_HOUR = 18;
const DEFAULT_MODEL_RUN_DAY_OFFSET = -1;

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

function getPublishedVersion(project) {
  const versions = Array.isArray(project?.versions) ? project.versions : [];
  return [...versions]
    .reverse()
    .find((version) => version?.reason === 'publish' && (version.featureCollection || version.snapshot || version.raster));
}

function getPublishedFeatureCollectionFromVersions(project) {
  const publishedVersion = getPublishedVersion(project);
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

function padDatePart(value) {
  return String(value).padStart(2, '0');
}

function formatForecastDateToken(value) {
  const localKey = formatLocalDateKey(value);
  return localKey ? localKey.replaceAll('-', '') : '';
}

function shiftDateToken(dateToken, offsetDays) {
  const match = String(dateToken || '').match(/^(\d{4})(\d{2})(\d{2})$/);
  if (!match) return '';
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0));
  date.setUTCDate(date.getUTCDate() + Number(offsetDays || 0));
  return `${date.getUTCFullYear()}${padDatePart(date.getUTCMonth() + 1)}${padDatePart(date.getUTCDate())}`;
}

function interpolateTemplate(template, values) {
  if (!template) return '';
  return String(template).replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
    if (key in values) return encodeURIComponent(String(values[key] ?? ''));
    return match;
  });
}

function getRawRasterAsset(project) {
  const publishedVersion = getPublishedVersion(project);
  return project?.publishedRaster || publishedVersion?.raster || project?.raster || null;
}

function normalizeBounds(value) {
  if (!Array.isArray(value) || value.length !== 4) return DEFAULT_RASTER_BOUNDS;
  return value.map(Number).every(Number.isFinite) ? value.map(Number) : DEFAULT_RASTER_BOUNDS;
}

function getNumberSetting(asset, key, envName, fallback) {
  const value = asset?.[key] ?? process.env[envName] ?? fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function resolveCogRaster(project) {
  const asset = getRawRasterAsset(project) || {};
  const forecastDate = formatForecastDateToken(project?.forecastDate);
  const runHour = getNumberSetting(asset, 'runHour', 'PUBLIC_WAVE_MODEL_RUN_HOUR', DEFAULT_MODEL_RUN_HOUR);
  const runDayOffset = getNumberSetting(asset, 'runDayOffset', 'PUBLIC_WAVE_MODEL_RUN_DAY_OFFSET', DEFAULT_MODEL_RUN_DAY_OFFSET);
  const runDate = asset.runDate || shiftDateToken(forecastDate, runDayOffset);
  const runHourToken = padDatePart(runHour);
  const runDateTime = asset.runDateTime || `${runDate}${runHourToken}`;
  const model = asset.model || process.env.PUBLIC_WAVE_COG_MODEL || 'WW3';
  const tokenValues = {
    projectId: String(project?._id || ''),
    chartType: project?.chartType || '',
    forecastDate,
    date: forecastDate,
    model,
    runDate,
    runHour: runHourToken,
    runDateTime,
    cycle: runHourToken,
  };

  const defaultLocalTileTemplate = process.env.NODE_ENV === 'production'
    ? ''
    : 'http://127.0.0.1:8081/{model}/light/{runDateTime}/{z}/{x}/{y}.png';
  const cogUrl = asset.cogUrl || asset.url || interpolateTemplate(process.env.PUBLIC_WAVE_COG_URL_TEMPLATE, tokenValues);
  const directTileUrl = asset.tileUrl || interpolateTemplate(process.env.PUBLIC_WAVE_COG_TILE_TEMPLATE || defaultLocalTileTemplate, tokenValues);
  const cogTileTemplate = process.env.PUBLIC_COG_TILE_TEMPLATE || process.env.TITILER_COG_TILE_TEMPLATE || '';
  const tileUrl = directTileUrl || (cogUrl && cogTileTemplate
    ? interpolateTemplate(cogTileTemplate, { ...tokenValues, cogUrl, url: cogUrl })
    : '');

  if (!tileUrl) return null;

  return {
    type: 'cog',
    model: tokenValues.model,
    cogUrl: cogUrl || null,
    tileUrl,
    tileSize: Number(asset.tileSize) || 256,
    scheme: asset.scheme || 'xyz',
    bounds: normalizeBounds(asset.bounds),
    opacity: Number.isFinite(Number(asset.opacity)) ? Number(asset.opacity) : 0.96,
    attribution: asset.attribution || 'WaveLab / DOST-PAGASA',
    runDate,
    runHour: runHourToken,
    runDateTime,
  };
}

async function buildPublishedForecastPayload(project, { canArchive = false } = {}) {
  const versionFeatureCollection = getPublishedFeatureCollectionFromVersions(project);
  const featureCollection = versionFeatureCollection || await getCurrentFeatureCollection(project._id);

  return {
    project: getPublicProjectPayload(project),
    featureCollection,
    raster: resolveCogRaster(project),
    canArchive,
  };
}

function populatePublishedProject(query) {
  return query
    .populate('owner', 'firstName lastName email username position')
    .populate('reviewStartedBy', 'firstName lastName email username')
    .populate('approvedBy', 'firstName lastName email username')
    .populate('rejectedBy', 'firstName lastName email username')
    .populate('auditLogs.performedBy', 'firstName lastName email username');
}

async function findPublicPublishedProject(projectId) {
  const project = await populatePublishedProject(Project.findOne({
    _id: projectId,
    status: PROJECT_STATUS.PUBLISHED,
  }));

  if (!project) {
    throwError('Published chart not found. Archived charts require an access request.', 404);
  }

  return project;
}

async function findPublishedProject(projectId) {
  const project = await populatePublishedProject(Project.findOne({
    _id: projectId,
    status: { $in: [PROJECT_STATUS.PUBLISHED, PROJECT_STATUS.ARCHIVED] },
  }));

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

function buildPublicListQuery(req) {
  const search = String(req.query.search || '').trim();
  const before = getDateBoundary(req.query.before);
  const after = getDateBoundary(req.query.after);
  const query = { status: PROJECT_STATUS.PUBLISHED };

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

  return query;
}

export const listPublicPublishedForecasts = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 50);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const skip = (page - 1) * limit;
  const query = buildPublicListQuery(req);

  const [projects, total] = await Promise.all([
    Project.find(query)
      .select('name description chartType forecastDate status publishedAt owner approvedBy reviewComment publishedRaster')
      .populate('owner', 'firstName lastName username')
      .populate('approvedBy', 'firstName lastName username')
      .sort({ forecastDate: -1, publishedAt: -1, updatedAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Project.countDocuments(query),
  ]);

  res.json({
    projects: projects.map((project) => ({ ...project, raster: resolveCogRaster(project) })),
    total,
    page,
    limit,
    mode: 'active',
    totalPages: Math.max(1, Math.ceil(total / limit)),
    hasMore: page < Math.max(1, Math.ceil(total / limit)),
  });
});

export const getPublicPublishedForecastOutput = asyncHandler(async (req, res) => {
  const project = await findPublicPublishedProject(req.params.id);
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
