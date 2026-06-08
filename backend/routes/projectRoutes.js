// backend/routes/projectRoutes.js

import express from 'express';
import {
  createProject,
  createForecastProject,
  getUserProjects,
  getLatestUserProject,
  getProjectById,
  updateProject,
  deleteProject,
  deleteForecastProject,
  submitProject,
  submitForecastProject,
  startReviewProject,
  startReviewForecastProject,
  addReviewComment,
  addForecastReviewComment,
  requestProjectRevision,
  requestForecastProjectRevision,
  approveProject,
  approveForecastProject,
  rejectProject,
  rejectForecastProject,
  publishProject,
  publishForecastProject,
  archiveProject,
  renameProject,
  renameForecastProject
} from '../controllers/projectController.js';
import { getAdminProjects } from '../controllers/adminProjectController.js';
import {
  getPublishedForecastOutput,
  getPublicPublishedForecastOutput,
  listPublicPublishedForecasts,
} from '../controllers/publishedForecastController.js';
import Project from '../models/Project.js';

import protect from '../middleware/authMiddleware.js';
import isOwnerOrAdmin from '../middleware/projectMiddleware.js';
import { isAdmin } from '../middleware/adminMiddleware.js';
import { throwError } from '../utils/errorHelper.js';
import { canEditProjectStatus, getProjectEditLockMessage } from '../utils/projectWorkflow.js';

const router = express.Router();

async function requireEditableProject(req, _res, next) {
  try {
    const project = await Project.findById(req.params.id).select('status');
    if (!project) throwError('Project not found', 404);
    if (!canEditProjectStatus(project.status)) {
      throwError(getProjectEditLockMessage(project.status), 403);
    }
    next();
  } catch (error) {
    next(error);
  }
}

async function preventAdminSelfReview(req, _res, next) {
  try {
    const project = await Project.findById(req.params.id).select('owner');
    if (!project) throwError('Project not found', 404);
    if (String(project.owner) === String(req.user?.id)) {
      throwError('Admins cannot review their own projects', 403);
    }
    next();
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────
// Public published output routes
// ─────────────────────────────────────────────
router.get('/public/published', listPublicPublishedForecasts);
router.get('/public/published/:id', getPublicPublishedForecastOutput);

router.use(protect);

// ─────────────────────────────────────────────
// Admin routes - keep before dynamic /:id routes
// ─────────────────────────────────────────────
router.get('/admin/projects', isAdmin, getAdminProjects);

router.patch('/:id/start-review', isAdmin, preventAdminSelfReview, startReviewProject);

router.patch('/forecast-projects/:forecastProjectId/start-review', isAdmin, startReviewForecastProject);

router.post('/:id/review-comment', isAdmin, preventAdminSelfReview, addReviewComment);

router.post('/forecast-projects/:forecastProjectId/review-comment', isAdmin, addForecastReviewComment);

router.patch('/:id/request-revision', isAdmin, preventAdminSelfReview, requestProjectRevision);

router.patch('/forecast-projects/:forecastProjectId/request-revision', isAdmin, requestForecastProjectRevision);

router.patch('/:id/approve', isAdmin, preventAdminSelfReview, approveProject);

router.patch('/forecast-projects/:forecastProjectId/approve', isAdmin, approveForecastProject);

router.patch('/:id/reject', isAdmin, preventAdminSelfReview, rejectProject);

router.patch('/forecast-projects/:forecastProjectId/reject', isAdmin, rejectForecastProject);

router.patch('/:id/publish', isAdmin, preventAdminSelfReview, publishProject);

router.patch('/forecast-projects/:forecastProjectId/publish', isAdmin, publishForecastProject);

router.patch('/:id/archive', isAdmin, preventAdminSelfReview, archiveProject);

// ─────────────────────────────────────────────
// Published output routes - keep before dynamic /:id routes
// ─────────────────────────────────────────────
router.get('/:id/published-output', getPublishedForecastOutput);

// ─────────────────────────────────────────────
// Owner routes
// ─────────────────────────────────────────────
router.post('/', createProject);

router.post('/forecast-projects', createForecastProject);

router.get('/', getUserProjects);

router.get('/latest', getLatestUserProject);

router.patch('/forecast-projects/:forecastProjectId/rename', renameForecastProject);

router.patch('/forecast-projects/:forecastProjectId/submit', submitForecastProject);

router.delete('/forecast-projects/:forecastProjectId', deleteForecastProject);

router.get('/:id', isOwnerOrAdmin, getProjectById);

router.put('/:id', isOwnerOrAdmin, updateProject);

router.patch('/:id/rename', isOwnerOrAdmin, requireEditableProject, renameProject); // IMPORTANT: updateProject must NOT allow status changes

router.delete('/:id', isOwnerOrAdmin, requireEditableProject, deleteProject);

// Workflow - owner action
router.patch('/:id/submit', submitProject);

export default router;
