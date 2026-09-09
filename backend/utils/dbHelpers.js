import Project from '../models/Project.js';
import Feature from '../models/Feature.js';
import { throwError } from './errorHelper.js';
import { isForecastPackageChartProject } from './forecastPackageAccess.js';

/**
 * Ensure project exists, optionally validate legacy standalone ownership.
 * Forecast Package chart projects are shared operational resources and never
 * use owner as an authorization boundary.
 *
 * @param {string} projectId - Project ID
 * @param {string} [owner] - Optional legacy standalone owner ID
 * @returns {Promise<Project>}
 */
export const ensureProjectExists = async (projectId, owner = null) => {
  const project = await Project.findById(projectId);
  if (!project) throwError('Project not found.', 404);

  if (owner) {
    const sharedForecastChart = await isForecastPackageChartProject(project._id || projectId);
    if (!sharedForecastChart) {
      const projectOwner = project.owner?._id || project.owner;
      if (!projectOwner || String(projectOwner) !== String(owner)) {
        throwError('Unauthorized: you do not have access to this project.', 403);
      }
    }
  }

  return project;
};

/**
 * Ensure feature exists, optionally validate creator attribution and project.
 * Creator attribution is retained for legacy standalone annotation workflows;
 * shared Forecast Package charts derive edit rights from project access.
 *
 * @param {string} sourceId - Feature source ID
 * @param {string} [owner] - Optional creator ID
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

  const isNumber = (n) => typeof n === 'number' && !Number.isNaN(n);

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
    if (!Array.isArray(coordinates) || coordinates.length === 0) {
      throwError('Invalid Polygon coordinates.', 400);
    }

    coordinates.forEach((ring) => {
      if (!Array.isArray(ring) || ring.length < 4 || !ring.every(isLngLat)) {
        throwError('Invalid Polygon ring. Must contain at least 4 [lng, lat] points.', 400);
      }

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
  return (
    feature?.properties?.stableId ||
    feature?.properties?.annotationId ||
    feature?.properties?.sourceId ||
    feature?.sourceId
  );
}

function getFeatureType(feature) {
  return (
    feature?.properties?.type ||
    feature?.properties?.markerType ||
    feature?.properties?.symbolType ||
    ''
  );
}

function buildRenamedFeatureProperties(feature, newName) {
  const stableId = getStableFeatureId(feature);
  const type = getFeatureType(feature);
  const isLowWaveMarker = type === 'less_1';

  const updateData = {
    name: newName,
    'properties.title': newName,
    'properties.name': newName,
    'properties.displayName': newName,
    'properties.stableId': stableId,
    'properties.annotationId': stableId,
    'properties.sourceId': feature.sourceId,
  };

  // Low-wave point markers use labelValue for the rendered map symbol (<1).
  // Renaming should change only the layer display name, not the meteorological symbol.
  if (!isLowWaveMarker) {
    updateData['properties.labelValue'] = newName;
  }

  return updateData;
}

/**
 * Build stable SourceId and update data for feature renaming.
 *
 * Production rule: sourceId is object identity. It must never change during
 * rename, because Mapbox layers, annotation panel rows, style updates, delete,
 * drag persistence, and websocket refresh all target this ID. A rename only
 * changes user-visible fields.
 *
 * @param {Feature} feature - Existing feature
 * @param {string} newName - New feature name
 * @returns {[string, Object]} - Stable sourceId and update object
 */
export const buildNewSourceIdAndUpdateData = (feature, newName) => {
  const stableSourceId = feature.sourceId || getStableFeatureId(feature);

  return [stableSourceId, buildRenamedFeatureProperties(feature, newName)];
};

/**
 * Ensure project name uniqueness. Historical standalone projects retain their
 * owner-scoped namespace; ownerless operational charts use a shared namespace.
 *
 * @param {string} name
 * @param {string|null} owner
 * @param {string} [excludeId]
 */
export const ensureUniqueProjectName = async (name, owner = null, excludeId = null) => {
  const query = owner ? { name, owner } : { name, owner: null };
  const existing = await Project.findOne(query);
  if (existing && existing._id.toString() !== String(excludeId || '')) {
    throwError('A project with this name already exists.', 409);
  }
  return existing;
};

/**
 * Delete a standalone project and related features. Forecast Package chart
 * projects are structural package resources and cannot be deleted directly.
 *
 * @param {string} projectId
 * @param {string} owner
 * @returns {Promise<number>} - Number of deleted features
 */
export const deleteProjectAndFeatures = async (projectId, owner) => {
  const project = await Project.findById(projectId);
  if (!project) throwError('Project not found.', 404);

  if (await isForecastPackageChartProject(projectId)) {
    throwError('Forecast Package chart projects cannot be deleted directly.', 409);
  }

  const projectOwner = project.owner?._id || project.owner;
  if (!projectOwner || String(projectOwner) !== String(owner)) {
    throwError('Unauthorized: cannot delete this project.', 403);
  }

  const deleteResult = await Feature.deleteMany({
    'properties.project': projectId,
  });

  await project.deleteOne();
  return deleteResult.deletedCount;
};
