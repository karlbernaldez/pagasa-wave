import Project from '../models/Project.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

export const createProject = async (req, res) => {
  try {
    // --- Extract data ---
    const { name, description, chartType, forecastDate } = req.body;
    const owner = req.user?.id;

    // --- Validate required fields ---
    if (!owner) {
      return res.status(401).json({ message: 'Unauthorized: owner missing' });
    }
    if (!name || !chartType) {
      return res.status(400).json({ message: 'Project name and chartType are required.' });
    }

    // --- Check duplicate project name per owner ---
    const existing = await Project.findOne({ name, owner });
    if (existing) {
      return res.status(409).json({ message: 'A project with this name already exists for this user.' });
    }

    // --- Create new project ---
    const project = new Project({
      name,
      description: description || '',
      chartType,
      forecastDate: forecastDate || null,
      owner,
    });

    await project.save();

    // --- Return success ---
    res.status(201).json(project);

  } catch (error) {
    console.error('Error creating project:', error);

    // --- Return validation errors if available ---
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getUserProjects = async (req, res) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Decode and verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const ownerId = decoded.id;

    // Query the projects owned by the user
    const projects = await Project.find({ owner: ownerId }).sort({ createdAt: -1 });

    res.status(200).json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    res.status(500).json({ message: 'Server error' });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid project ID' });
    }

    // Populate the owner field and exclude sensitive data like password and refreshToken
    const project = await Project.findById(id)
      .populate('owner', 'firstName lastName email position') // specify only the fields you need
      .exec();

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.status(200).json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, chartType, forecastDate } = req.body;
    const owner = req.user?.id;

    // Check if the project exists
    const project = await Project.findOne({ _id: id, owner });
    if (!project) {
      return res.status(404).json({ message: 'Project not found or unauthorized' });
    }

    // Validate input
    if (!name || !chartType || !forecastDate) {
      return res.status(400).json({ message: 'All fields (name, chartType, forecastDate) are required' });
    }

    // Check if the new name is already taken by another project of the same owner
    const existing = await Project.findOne({ name, owner });
    if (existing && existing._id.toString() !== id) {
      return res.status(409).json({ message: 'A project with this name already exists.' });
    }

    // Update the project with new data
    project.name = name;
    project.description = description;
    project.chartType = chartType;
    project.forecastDate = forecastDate;

    await project.save(); // Save the updated project

    res.status(200).json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const owner = req.user?.id;

    // Check if the project exists and belongs to the current user
    const project = await Project.findOne({ _id: id, owner });

    if (!project) {
      return res.status(404).json({ message: 'Project not found or unauthorized' });
    }

    // Delete the project
    await project.deleteOne();

    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
