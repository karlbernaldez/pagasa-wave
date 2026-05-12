import Project from '../models/Project.js';
import Feature from '../models/Feature.js';
import { throwError } from './errorHelper.js';

/**
 * Ensure project exists, optionally validate owner
 * @param {string} projectId - Project ID
 * @param {string} [owner] - Optional owner ID
 * @returns {Promise<Project>}
 */
export const ensureProjectExists = async (projectId, owner = null) => {
  const project = await Project.findById(projectId);
  if (!project) throwError('Project not found.', 404);

  if (owner && project.owner.toString() !== owner.toString()) {
    throwError('Unauthorized: you do not own this project.', 403);
  }

  return project;
};

/**
 * Ensure feature exists, optionally validate owner and project
 * @param {string} sourceId - Feature source ID
 * @param {string} [owner] - Optional owner ID
 * @param {string} [projectId] - Optional project ID
 * @returns {Promise<Feature>}
 */
export const ensureFeatureExists = async (sourceId, owner = null, projectId = null) => {
  const query = { sourceId };
  if (owner) query['properties.owner'] = owner;
  if (projectId) query['properties.project'] = projectId;

  const feature = await Feature.findOne(query);
  if (!feature) throwError('Feature not found.', 404);

  return feature;
};

/**
 * Validate geometry object
 * @param {Object} geometry
 */
export const validateGeometry = (geometry) => {
  if (!geometry || typeof geometry !== 'object') {
    throwError('Geometry must be an object.', 400);
  }

  const { type, coordinates } = geometry;

  if (!type || !coordinates) {
    throwError('Invalid geometry object. Missing type or coordinates.', 400);
  }

  const isNumber = (n) => typeof n === 'number' && !isNaN(n);

  const isLngLat = (coord) =>
    Array.isArray(coord) &&
    coord.length === 2 &&
    isNumber(coord[0]) &&
    isNumber(coord[1]) &&
    coord[0] >= -180 &&
    coord[0] <= 180 &&
    coord[1] >= -90 &&
    coord[1] <= 90;

  if (type === 'Point') {
    if (!isLngLat(coordinates)) {
      throwError('Invalid Point coordinates. Must be [lng, lat].', 400);
    }
  }

  if (type === 'LineString') {
    if (
      !Array.isArray(coordinates) ||
      coordinates.length < 2 ||
      !coordinates.every(isLngLat)
    ) {
      throwError('Invalid LineString coordinates.', 400);
    }
  }

  if (type === 'Polygon') {
    if (
      !Array.isArray(coordinates) ||
      coordinates.length === 0
    ) {
      throwError('Invalid Polygon coordinates.', 400);
    }

    coordinates.forEach((ring) => {
      if (
        !Array.isArray(ring) ||
        ring.length < 4 ||
        !ring.every(isLngLat)
      ) {
        throwError('Invalid Polygon ring. Must contain at least 4 [lng, lat] points.', 400);
      }

      // Check if polygon is closed
      const first = ring[0];
      const last = ring[ring.length - 1];

      if (first[0] !== last[0] || first[1] !== last[1]) {
        throwError('Polygon ring must be closed (first and last coordinates must match).', 400);
      }
    });
  }

  if (!['Point', 'LineString', 'Polygon'].includes(type)) {
    throwError(`Unsupported geometry type: ${type}`, 400);
  }
};

function getStableFeatureId(feature) {
  return feature?.properties?.stableId || feature?.properties?.annotationId || feature?.properties?.sourceId || feature?.sourceId;
}

function buildRenamedFeatureProperties(feature, newName) {
  const stableId = getStableFeatureId(feature);

  return {
    name: newName,
    'properties.labelValue': newName,
    'properties.title': newName,
    'properties.name': newName,
    'properties.stableId': stableId,
    'properties.annotationId': stableId,
  };
}

/**
 * Build new SourceId and update data for feature renaming.
 * Keep all user-visible label fields in sync so Studio, Project Library previews,
 * review modals, and reload hydration all display the same renamed annotation.
 * Preserve stable annotation identity separately from sourceId so review diffs can
 * classify renames and geometry edits as changed instead of removed + added.
 *
 * @param {Feature} feature - Existing feature
 * @param {string} newName - New feature name
 * @returns {[string, Object]} - New sourceId and update object
 */
export const buildNewSourceIdAndUpdateData = (feature, newName) => {
  const type = feature.properties.type || feature.properties.markerType || feature.properties.symbolType;
  const isMarker = ['low_pressure', 'high_pressure', 'typhoon', 'less_1'].includes(type);
  const newSourceId = isMarker ? `${type}_${newName}` : newName;

  return [
    newSourceId,
    {
      sourceId: newSourceId,
      ...buildRenamedFeatureProperties(feature, newName),
    },
  ];
};

/**
 * Ensure project name is unique for a user (optionally exclude a project ID)
 * @param {string} name
 * @param {string} owner
 * @param {string} [excludeId]
 */
export const ensureUniqueProjectName = async (name, owner, excludeId = null) => {
  const existing = await Project.findOne({ name, owner });
  if (existing && existing._id.toString() !== excludeId) {
    throwError('A project with this name already exists.', 409);
  }
  return existing;
};

/**
 * Delete a project and all related features
 * @param {string} projectId
 * @param {string} owner
 * @returns {Promise<number>} - Number of deleted features
 */
export const deleteProjectAndFeatures = async (projectId, owner) => {
  // Delete related features
  const deleteResult = await Feature.deleteMany({
    'properties.project': projectId,
    'properties.owner': owner,
  });

  // Delete the project
  const project = await Project.findById(projectId);
  if (!project) throwError('Project not found.', 404);
  if (project.owner.toString() !== owner.toString()) throwError('Unauthorized: cannot delete this project.', 403);

  await project.deleteOne();
  return deleteResult.deletedCount;
};
