import asyncHandler from '../utils/asyncHandler.js';
import { throwError } from '../utils/errorHelper.js';
import Feature from '../models/Feature.js';
import {
  ensureProjectExists,
  ensureFeatureExists,
  validateGeometry,
  buildNewSourceIdAndUpdateData,
} from '../utils/dbHelpers.js';
import { isForecastPackageChartProject } from '../utils/forecastPackageAccess.js';
import { canEditProjectStatus, getProjectEditLockMessage } from '../utils/projectWorkflow.js';
import { emitForecastChartUpdated } from '../socket/socketEmitter.js';
import { createNotification } from '../services/notification/notificationService.js';

function ensureProjectIsEditable(project) {
  if (!canEditProjectStatus(project.status)) {
    throwError(getProjectEditLockMessage(project.status), 403);
  }
}

function buildFeatureProperties(properties, owner, sourceId) {
  const stableId = properties.stableId || properties.annotationId || properties.sourceId || sourceId;
  return { ...properties, owner, sourceId, stableId, annotationId: stableId };
}

function isSameId(left, right) {
  return String(left?._id || left || '') === String(right?._id || right || '');
}

function getFeatureOwner(feature) {
  return feature?.properties?.owner?._id || feature?.properties?.owner;
}

function getFeatureProjectId(feature) {
  return feature?.properties?.project?._id || feature?.properties?.project;
}

function featureCanEdit(feature, user) {
  return Boolean(user?.role === 'admin' || isSameId(getFeatureOwner(feature), user?.id));
}

function featureToClient(feature, user) {
  const plain = typeof feature.toObject === 'function' ? feature.toObject() : feature;
  return {
    ...plain,
    properties: {
      ...(plain.properties || {}),
      canEdit: featureCanEdit(plain, user),
      owner: plain.properties?.owner,
    },
  };
}

function toGeoJsonFeature(feature, user) {
  const stableId = feature.properties?.stableId || feature.properties?.annotationId || feature.properties?.sourceId || feature.sourceId;
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
      canEdit: featureCanEdit(feature, user),
    },
  };
}

function emitAnnotationUpdate(projectId, action, sourceId) {
  emitForecastChartUpdated(projectId, { action, resourceType: 'annotation', sourceId });
}

async function ensureFeatureMutationAllowed(sourceId, user) {
  const feature = await ensureFeatureExists(sourceId);
  const projectId = getFeatureProjectId(feature);
  const project = await ensureProjectExists(projectId, user.id);
  ensureProjectIsEditable(project);
  if (!featureCanEdit(feature, user)) {
    throwError('Only the annotation owner or an admin can change this annotation. Send a request to the owner instead.', 403);
  }
  return { feature, project };
}

export const createFeature = asyncHandler(async (req, res) => {
  const { geometry, properties = {}, name = 'Untitled Feature', sourceId } = req.body;
  const owner = req.user.id;
  const projectId = properties.project;
  validateGeometry(geometry);
  if (!sourceId || !owner || !projectId) throwError('Missing required fields: sourceId or properties.project.', 400);
  const project = await ensureProjectExists(projectId, owner);
  ensureProjectIsEditable(project);
  const fullProperties = buildFeatureProperties(properties, owner, sourceId);
  const result = await Feature.updateOne(
    { sourceId, 'properties.owner': owner, 'properties.project': projectId },
    { $setOnInsert: { type: 'Feature', geometry, properties: fullProperties, name, sourceId } },
    { upsert: true }
  );
  if (result.upsertedCount > 0) emitAnnotationUpdate(projectId, 'annotation_created', sourceId);
  res.status(result.upsertedCount > 0 ? 201 : 200).json({
    message: result.upsertedCount > 0 ? 'Feature saved successfully (new)' : 'Feature already exists. Skipped saving.',
    sourceId,
    stableId: fullProperties.stableId,
  });
});

export const getAllFeatures = asyncHandler(async (req, res) => {
  const features = await Feature.find().sort({ createdAt: -1 });
  res.json(features.map((feature) => featureToClient(feature, req.user)));
});

export const getProjectFeatureCollection = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  if (!projectId) throwError('Missing projectId.', 400);
  const features = await Feature.find({ 'properties.project': projectId });
  res.json({ type: 'FeatureCollection', features: features.map((feature) => toGeoJsonFeature(feature, req.user)) });
});

export const getFeaturesByUserAndProject = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { projectId } = req.params;
  if (!projectId) throwError('Missing projectId in route.', 400);
  const sharedForecastChart = await isForecastPackageChartProject(projectId);
  const query = sharedForecastChart ? { 'properties.project': projectId } : { 'properties.owner': userId, 'properties.project': projectId };
  const features = await Feature.find(query).sort({ createdAt: -1 });
  res.json(features.map((feature) => featureToClient(feature, req.user)));
});

export const requestFeatureChange = asyncHandler(async (req, res) => {
  const { sourceId } = req.params;
  const { requestType, requestedName = '', comment = '' } = req.body || {};
  const normalizedType = String(requestType || '').trim();
  const normalizedComment = String(comment || '').trim();
  const normalizedRequestedName = String(requestedName || '').trim();
  if (!['rename', 'delete', 'label_change'].includes(normalizedType)) throwError('requestType must be rename, delete, or label_change.', 400);
  if ((normalizedType === 'rename' || normalizedType === 'label_change') && !normalizedRequestedName) throwError('requestedName is required for rename or label change requests.', 400);
  const feature = await ensureFeatureExists(sourceId);
  const projectId = getFeatureProjectId(feature);
  const project = await ensureProjectExists(projectId, req.user.id);
  const owner = getFeatureOwner(feature);
  if (isSameId(owner, req.user.id)) throwError('You own this annotation and can edit it directly.', 400);
  await createNotification({
    type: 'annotation_change_request',
    title: normalizedType === 'delete' ? 'Annotation delete requested' : 'Annotation change requested',
    message: normalizedType === 'delete'
      ? `${req.user.email || 'A forecaster'} requested deletion of "${feature.name || sourceId}".${normalizedComment ? ` ${normalizedComment}` : ''}`
      : `${req.user.email || 'A forecaster'} requested "${feature.name || sourceId}" be changed to "${normalizedRequestedName}".${normalizedComment ? ` ${normalizedComment}` : ''}`,
    recipientUser: owner,
    actorUser: req.user.id,
    resourceType: 'Feature',
    resourceId: feature._id,
    resourcePath: `/studio/${projectId}`,
    projectName: project?.name || '',
  });
  res.status(201).json({ message: 'Request sent to annotation owner.' });
});

export const getFeatureBySourceId = asyncHandler(async (req, res) => {
  const { sourceId } = req.params;
  const feature = await ensureFeatureExists(sourceId);
  res.json(featureToClient(feature, req.user));
});

export const deleteFeature = asyncHandler(async (req, res) => {
  const { sourceId } = req.params;
  const { feature } = await ensureFeatureMutationAllowed(sourceId, req.user);
  const projectId = getFeatureProjectId(feature);
  const result = await Feature.deleteOne({ sourceId, 'properties.project': projectId });
  if (result.deletedCount === 0) throwError(`Feature with sourceId "${sourceId}" not found. Nothing deleted.`, 404);
  emitAnnotationUpdate(projectId, 'annotation_deleted', sourceId);
  res.status(200).json({ status: 'success', message: `Feature with sourceId "${sourceId}" was deleted successfully.` });
});

export const updateFeatureName = asyncHandler(async (req, res) => {
  const { sourceId } = req.params;
  const { newName } = req.body;
  if (!newName || typeof newName !== 'string') throwError('Invalid name. Name must be a non-empty string.', 400);
  const { feature } = await ensureFeatureMutationAllowed(sourceId, req.user);
  const projectId = getFeatureProjectId(feature);
  const [newSourceId, updateData] = buildNewSourceIdAndUpdateData(feature, newName);
  const updatedFeature = await Feature.findOneAndUpdate({ sourceId, 'properties.project': projectId }, { $set: updateData }, { new: true });
  emitAnnotationUpdate(projectId, 'annotation_renamed', newSourceId);
  res.json({ message: 'Feature name updated successfully.', feature: featureToClient(updatedFeature, req.user) });
});

export const updateFeatureCoordinates = asyncHandler(async (req, res) => {
  const { sourceId } = req.params;
  const { coordinates } = req.body;
  if (!Array.isArray(coordinates) || coordinates.length !== 2 || typeof coordinates[0] !== 'number' || typeof coordinates[1] !== 'number') {
    throwError('Invalid coordinates. Must be [lng, lat] as numbers.', 400);
  }
  const { feature } = await ensureFeatureMutationAllowed(sourceId, req.user);
  const projectId = getFeatureProjectId(feature);
  await Feature.findOneAndUpdate({ sourceId, 'properties.project': projectId }, { $set: { 'geometry.coordinates': coordinates } }, { new: true });
  emitAnnotationUpdate(projectId, 'annotation_moved', sourceId);
  res.json({ message: 'Coordinates updated.', sourceId, coordinates });
});
