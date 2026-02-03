import asyncHandler from '../utils/asyncHandler.js';
import { throwError } from '../utils/errorHelper.js';
import Feature from '../models/Feature.js';
import {
  ensureProjectExists,
  ensureFeatureExists,
  validateGeometry,
  buildNewSourceIdAndUpdateData,
} from '../utils/dbHelpers.js';

// ===============================
// CREATE FEATURE
// ===============================
export const createFeature = asyncHandler(async (req, res) => {
  const { geometry, properties = {}, name = 'Untitled Feature', sourceId } = req.body;
  const owner = req.user.id;
  const projectId = properties.project;

  validateGeometry(geometry);
  if (!sourceId || !owner || !projectId) throwError('Missing required fields: sourceId or properties.project.', 400);

  await ensureProjectExists(projectId, owner);

  const fullProperties = { ...properties, owner };

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
  });
});

// ===============================
// GET ALL FEATURES
// ===============================
export const getAllFeatures = asyncHandler(async (req, res) => {
  const features = await Feature.find().sort({ createdAt: -1 });
  res.json(features);
});

// ===============================
// GET FEATURES BY USER & PROJECT
// ===============================
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

// ===============================
// GET FEATURE BY SOURCE ID
// ===============================
export const getFeatureBySourceId = asyncHandler(async (req, res) => {
  const { sourceId } = req.params;
  const feature = await ensureFeatureExists(sourceId);
  res.json(feature);
});

// ===============================
// DELETE FEATURE
// ===============================
export const deleteFeature = asyncHandler(async (req, res) => {
  const { sourceId } = req.params;

  const result = await Feature.deleteOne({ sourceId });
  if (result.deletedCount === 0) throwError(`Feature with sourceId "${sourceId}" not found. Nothing deleted.`, 404);

  res.status(200).json({
    status: 'success',
    message: `Feature with sourceId "${sourceId}" was deleted successfully.`,
  });
});

// ===============================
// UPDATE FEATURE NAME
// ===============================
export const updateFeatureName = asyncHandler(async (req, res) => {
  const { sourceId } = req.params;
  const { newName } = req.body;

  if (!newName || typeof newName !== 'string') throwError('Invalid name. Name must be a non-empty string.', 400);

  const feature = await ensureFeatureExists(sourceId);
  const [newSourceId, updateData] = buildNewSourceIdAndUpdateData(feature, newName);

  const updatedFeature = await Feature.findOneAndUpdate(
    { sourceId },
    { $set: updateData },
    { new: true }
  );

  res.json({
    message: 'Feature name updated successfully.',
    feature: updatedFeature,
  });
});
