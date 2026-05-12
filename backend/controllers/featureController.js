import asyncHandler from '../utils/asyncHandler.js';
import { throwError } from '../utils/errorHelper.js';
import Feature from '../models/Feature.js';
import {
  ensureProjectExists,
  ensureFeatureExists,
  validateGeometry,
  buildNewSourceIdAndUpdateData,
} from '../utils/dbHelpers.js';
import { canEditProjectStatus, getProjectEditLockMessage } from '../utils/projectWorkflow.js';

function ensureProjectIsEditable(project) {
  if (!canEditProjectStatus(project.status)) {
    throwError(getProjectEditLockMessage(project.status), 403);
  }
}

function buildFeatureProperties(properties, owner, sourceId) {
  const stableId = properties.stableId || properties.annotationId || properties.sourceId || sourceId;

  return {
    ...properties,
    owner,
    sourceId,
    stableId,
    annotationId: stableId,
  };
}

function toGeoJsonFeature(feature) {
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
    },
  };
}

// CREATE FEATURE
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
    {
      $setOnInsert: {
        type: 'Feature',
        geometry,
        properties: fullProperties,
        name,
        sourceId,
      },
    },
    { upsert: true }
  );

  res.status(result.upsertedCount > 0 ? 201 : 200).json({
    message: result.upsertedCount > 0 ? 'Feature saved successfully (new)' : 'Feature already exists. Skipped saving.',
    sourceId,
    stableId: fullProperties.stableId,
  });
});

// GET ALL FEATURES
export const getAllFeatures = asyncHandler(async (req, res) => {
  const features = await Feature.find().sort({ createdAt: -1 });
  res.json(features);
});

// GET FEATURES AS FEATURECOLLECTION (ADMIN)
export const getProjectFeatureCollection = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  if (!projectId) throwError('Missing projectId.', 400);

  const features = await Feature.find({
    'properties.project': projectId
  });

  const featureCollection = {
    type: 'FeatureCollection',
    features: features.map(toGeoJsonFeature)
  };

  res.json(featureCollection);
});

// GET FEATURES BY USER & PROJECT
export const getFeaturesByUserAndProject = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { projectId } = req.params;

  if (!projectId) throwError('Missing projectId in route.', 400);

  const features = await Feature.find({
    'properties.owner': userId,
    'properties.project': projectId,
  }).sort({ createdAt: -1 });

  res.json(features);
});

// GET FEATURE BY SOURCE ID
export const getFeatureBySourceId = asyncHandler(async (req, res) => {
  const { sourceId } = req.params;
  const feature = await ensureFeatureExists(sourceId);
  res.json(feature);
});

// DELETE FEATURE
export const deleteFeature = asyncHandler(async (req, res) => {
  const { sourceId } = req.params;
  const userId = req.user.id;
  const feature = await ensureFeatureExists(sourceId, userId);
  const project = await ensureProjectExists(feature.properties.project, userId);
  ensureProjectIsEditable(project);

  const result = await Feature.deleteOne({ sourceId, 'properties.owner': userId });
  if (result.deletedCount === 0) throwError(`Feature with sourceId "${sourceId}" not found. Nothing deleted.`, 404);

  res.status(200).json({
    status: 'success',
    message: `Feature with sourceId "${sourceId}" was deleted successfully.`,
  });
});

// UPDATE FEATURE NAME
export const updateFeatureName = asyncHandler(async (req, res) => {
  const { sourceId } = req.params;
  const { newName } = req.body;
  const userId = req.user.id;

  if (!newName || typeof newName !== 'string') throwError('Invalid name. Name must be a non-empty string.', 400);

  const feature = await ensureFeatureExists(sourceId, userId);
  const project = await ensureProjectExists(feature.properties.project, userId);
  ensureProjectIsEditable(project);

  const [newSourceId, updateData] = buildNewSourceIdAndUpdateData(feature, newName);

  const updatedFeature = await Feature.findOneAndUpdate(
    { sourceId, 'properties.owner': userId },
    { $set: updateData },
    { new: true }
  );

  res.json({
    message: 'Feature name updated successfully.',
    feature: updatedFeature,
  });
});

// UPDATE FEATURE COORDINATES (drag)
export const updateFeatureCoordinates = asyncHandler(async (req, res) => {
  const { sourceId } = req.params;
  const { coordinates } = req.body;
  const userId = req.user.id;

  if (
    !Array.isArray(coordinates) ||
    coordinates.length !== 2 ||
    typeof coordinates[0] !== 'number' ||
    typeof coordinates[1] !== 'number'
  ) {
    throwError('Invalid coordinates. Must be [lng, lat] as numbers.', 400);
  }

  const feature = await ensureFeatureExists(sourceId, userId);
  const project = await ensureProjectExists(feature.properties.project, userId);
  ensureProjectIsEditable(project);

  await Feature.findOneAndUpdate(
    { sourceId, 'properties.owner': userId },
    { $set: { 'geometry.coordinates': coordinates } },
    { new: true }
  );

  res.json({ message: 'Coordinates updated.', sourceId, coordinates });
});