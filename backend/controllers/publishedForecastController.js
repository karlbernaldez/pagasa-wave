import asyncHandler from '../utils/asyncHandler.js';
import { throwError } from '../utils/errorHelper.js';
import Project from '../models/Project.js';
import Feature from '../models/Feature.js';
import { PROJECT_STATUS } from '../utils/projectWorkflow.js';

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

export const getPublishedForecastOutput = asyncHandler(async (req, res) => {
  if (!req.user) throwError('Unauthorized', 401);

  const project = await Project.findById(req.params.id)
    .populate('owner', 'firstName lastName email username position')
    .populate('reviewStartedBy', 'firstName lastName email username')
    .populate('approvedBy', 'firstName lastName email username')
    .populate('rejectedBy', 'firstName lastName email username')
    .populate('auditLogs.performedBy', 'firstName lastName email username');

  if (!project) throwError('Published forecast not found', 404);

  if (project.status !== PROJECT_STATUS.PUBLISHED) {
    throwError('This project is not published yet', 404);
  }

  if (!canViewPublishedForecast(project, req.user)) {
    throwError('You do not have access to this published forecast', 403);
  }

  const versionFeatureCollection = getPublishedFeatureCollectionFromVersions(project);
  const featureCollection = versionFeatureCollection || await getCurrentFeatureCollection(project._id);

  res.json({
    project,
    featureCollection,
    canArchive: req.user.role === 'admin',
  });
});
