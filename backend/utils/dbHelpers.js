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
  if (!geometry || !geometry.type || !geometry.coordinates) {
    throwError('Invalid geometry object.', 400);
  }
};

/**
 * Build new SourceId and update data for feature renaming
 * @param {Feature} feature - Existing feature
 * @param {string} newName - New feature name
 * @returns {[string, Object]} - New sourceId and update object
 */
export const buildNewSourceIdAndUpdateData = (feature, newName) => {
  const type = feature.properties.type;
  if (['low_pressure', 'high_pressure', 'typhoon', 'less_1'].includes(type)) {
    const newSourceId = `${type}_${newName}`;
    return [
      newSourceId,
      {
        sourceId: newSourceId,
        name: newName,
        'properties.labelValue': newName,
        'properties.title': newName,
      },
    ];
  } else {
    const newSourceId = newName;
    return [
      newSourceId,
      {
        sourceId: newSourceId,
        name: newName,
        'properties.title': newName,
      },
    ];
  }
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
