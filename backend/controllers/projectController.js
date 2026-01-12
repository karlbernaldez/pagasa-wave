import asyncHandler from '../utils/asyncHandler.js';
import jwt from 'jsonwebtoken';
import { throwError } from '../utils/errorHelper.js';
import {
  ensureProjectExists,
  ensureUniqueProjectName,
  deleteProjectAndFeatures,
} from '../utils/dbHelpers.js';
import Project from '../models/Project.js';

// ===============================
// CREATE PROJECT
// ===============================
export const createProject = asyncHandler(async (req, res) => {
  const { name, description, chartType, forecastDate } = req.body;
  const owner = req.user?.id;

  if (!owner) throwError('Unauthorized: owner missing', 401);
  if (!name || !chartType) throwError('Project "name" and "chartType" are required.', 400);

  await ensureUniqueProjectName(name, owner);

  const project = new Project({
    name: name.trim(),
    description: description?.trim() || '',
    chartType: chartType.trim(),
    forecastDate: forecastDate || null,
    owner,
  });

  await project.save();
  res.status(201).json(project);
});

// ===============================
// GET USER PROJECTS
// ===============================
export const getUserProjects = asyncHandler(async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) throwError('No token provided', 401);

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throwError('Invalid or expired token', 403);
  }

  const projects = await Project.find({ owner: decoded.id }).sort({ createdAt: -1 });
  res.json(projects);
});

// ===============================
// GET PROJECT BY ID
// ===============================
export const getProjectById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const owner = req.user?.id;

  const project = await ensureProjectExists(id, owner);
  await project.populate('owner', 'firstName lastName email position');
  res.json(project);
});

// ===============================
// UPDATE PROJECT
// ===============================
export const updateProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, chartType, forecastDate } = req.body;
  const owner = req.user?.id;

  if (!owner) throwError('Unauthorized', 401);

  const project = await ensureProjectExists(id, owner);

  if (!name || !chartType || !forecastDate) throwError('All fields (name, chartType, forecastDate) are required', 400);

  await ensureUniqueProjectName(name, owner, id);

  project.name = name.trim();
  project.description = description?.trim() || '';
  project.chartType = chartType.trim();
  project.forecastDate = forecastDate;

  await project.save();
  res.json(project);
});

// ===============================
// DELETE PROJECT
// ===============================
export const deleteProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const owner = req.user?.id;

  if (!owner) throwError('Unauthorized', 401);

  const deletedFeaturesCount = await deleteProjectAndFeatures(id, owner);

  res.json({
    message: 'Project and related features deleted successfully',
    deletedFeatures: deletedFeaturesCount,
  });
});
