import mongoose from 'mongoose';
import Project from '../models/Project.js';
import Feature from '../models/Feature.js';
import { canAccessProject, isForecastPackageChartProject } from '../utils/forecastPackageAccess.js';

export const isOwnerOrAdmin = async (req, res, next) => {
  try {
    const projectId = req.params.projectId;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'Invalid project ID' });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const hasAccess = await canAccessProject(req.user, project, req.permissions || []);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied for this project.' });
    }

    req.project = project;
    next();
  } catch (error) {
    console.error('Authorization error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const isFeatureOwnerOrAdmin = async (req, res, next) => {
  try {
    const { sourceId } = req.params;
    const feature = await Feature.findOne({ sourceId });

    if (!feature) {
      return res.status(404).json({ message: 'Feature not found' });
    }

    const projectId = feature.properties?.project;
    if (projectId && (await isForecastPackageChartProject(projectId))) {
      req.feature = feature;
      return next();
    }

    const userId = String(req.user?.id || req.user?._id || '');
    const canEditAnyAnnotation = (req.permissions || []).includes('studio.edit_any_annotation');

    if (!feature.properties.owner) {
      return res.status(500).json({ message: 'Feature creator is not set in the database.' });
    }

    if (feature.properties.owner.toString() !== userId && !canEditAnyAnnotation) {
      return res.status(403).json({ message: 'Access denied for this annotation.' });
    }

    req.feature = feature;
    next();
  } catch (error) {
    console.error('Authorization error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
