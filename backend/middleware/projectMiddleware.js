import mongoose from 'mongoose';
import Project from '../models/Project.js';

const isOwnerOrAdmin = async (req, res, next) => {
  console.log('User in isOwnerOrAdmin:', req.user);
  try {
    const projectId = req.params.id;

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

export default isOwnerOrAdmin;