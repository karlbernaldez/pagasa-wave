import mongoose from 'mongoose';
import Project from '../models/Project.js';
import Feature from '../models/Feature.js';

export const isOwnerOrAdmin = async (req, res, next) => {
    console.log('User in isOwnerOrAdmin:', req.user);
    try {
        const projectId = req.params.projectId; // Change to `projectId`
        console.log('Project ID:', projectId);

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ message: 'Invalid project ID' });
        }

        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        console.log('User ID:', userId);
        console.log('Project Owner:', project.owner.toString());

        if (project.owner.toString() !== userId && !isAdmin) {
            return res.status(403).json({ message: 'Access denied. Not the owner or admin.' });
        }

        // Attach project to request object if needed later
        req.project = project;
        next();
    } catch (error) {
        console.error('Authorization error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const isFeatureOwnerOrAdmin = async (req, res, next) => {
  console.log('User in isFeatureOwnerOrAdmin:', req.user);
  try {
    const { sourceId } = req.params; // Access sourceId from route parameters
    console.log('Source ID:', sourceId);

    // Find feature by sourceId
    const feature = await Feature.findOne({ sourceId });

    if (!feature) {
      return res.status(404).json({ message: 'Feature not found' });
    }

    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    console.log('User ID:', userId);
    console.log('Feature Owner:', feature.properties.owner);

    // Check if feature.properties.owner exists before comparing
    if (!feature.properties.owner) {
      return res.status(500).json({ message: 'Feature owner is not set in the database.' });
    }

    // Ensure we have a valid owner
    if (feature.properties.owner.toString() !== userId && !isAdmin) {
      return res.status(403).json({ message: 'Access denied. Not the feature owner or admin.' });
    }

    // Attach feature to request object if needed later
    req.feature = feature;
    next();
  } catch (error) {
    console.error('Authorization error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
