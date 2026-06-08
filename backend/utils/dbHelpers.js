import Project from '../models/Project.js';
import Chart from '../models/Chart.js';
import Feature from '../models/Feature.js';

import { throwError } from './errorHelper.js';

export const ensureProjectExists = async (projectId, owner = null) => {
  const project = await Project.findById(projectId);
  if (!project) throwError('Project not found.', 404);

  if (owner && project.owner.toString() !== owner.toString()) {
    throwError('Unauthorized: you do not own this project.', 403);
  }

  return project;
};

export const ensureFeatureExists = async (sourceId, owner = null, projectId = null) => {
  const query = { sourceId };

  if (owner) query.owner = owner;
  if (projectId) query.project = projectId;

  const feature = await Feature.findOne(query);
  if (!feature) throwError('Feature not found.', 404);

  return feature;
};

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
  return (
    feature?.stableId ||
    feature?.annotationId ||
    feature?.sourceId
  );
}

function buildRenamedFeatureProperties(feature, newName) {
  const stableId = getStableFeatureId(feature);

  return {
    annotationId: stableId,
    stableId,
    'properties.label': newName,
  };
}

export const buildNewSourceIdAndUpdateData = (feature, newName) => {
  const type =
    feature.properties?.featureType;
  const isMarker = [
    'high_pressure',
    'low_pressure',
    'typhoon',
    'wave_height',
    'front',
  ].includes(type);
  const newSourceId = isMarker ? `${type}_${newName}` : newName;

  return [
    newSourceId,
    {
      sourceId: newSourceId,
      ...buildRenamedFeatureProperties(feature, newName),
    },
  ];
};

export const ensureUniqueProjectName = async (name, owner, excludeId = null) => {
  const existing = await Project.findOne({ name, owner });
  if (existing && existing._id.toString() !== excludeId) {
    throwError('A project with this name already exists.', 409);
  }
  return existing;
};

export const deleteProjectHierarchy = async (
  projectId,
  owner
) => {
  const project = await Project.findById(projectId);

  if (!project) {
    throwError('Project not found.', 404);
  }

  if (
    project.owner.toString() !== owner.toString()
  ) {
    throwError(
      'Unauthorized: cannot delete this project.',
      403
    );
  }

  const charts = await Chart.find(
    { project: projectId },
    { _id: 1 }
  ).lean();

  const chartIds = charts.map(
    chart => chart._id
  );

  const featureResult =
    await Feature.deleteMany({
      chart: {
        $in: chartIds,
      },
    });

  const chartResult =
    await Chart.deleteMany({
      project: projectId,
    });

  await project.deleteOne();

  return {
    deletedFeatures:
      featureResult.deletedCount,
    deletedCharts:
      chartResult.deletedCount,
  };
};
