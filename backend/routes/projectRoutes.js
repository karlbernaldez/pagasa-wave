// backend/routes/projectRoutes.js

import express from 'express';
import {
  createProject,
  getUserProjects,
  getLatestUserProject,
  getProjectById,
  updateProject,
  deleteProject,
  submitProject,
  startReviewProject,
  addReviewComment,
  requestProjectRevision,
  approveProject,
  rejectProject,
  markProjectNoPublication,
  publishProject,
  archiveProject,
  renameProject
} from '../controllers/projectController.js';
import { getAdminForecastPackage, getAdminProjects } from '../controllers/adminProjectController.js';
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
router.get('/admin/projects/:id/package', isAdmin, getAdminForecastPackage);

router.patch('/:id/start-review', isAdmin, preventAdminSelfReview, startReviewProject);

router.post('/:id/review-comment', isAdmin, preventAdminSelfReview, addReviewComment);

router.patch('/:id/request-revision', isAdmin, preventAdminSelfReview, requestProjectRevision);

router.patch('/:id/approve', isAdmin, preventAdminSelfReview, approveProject);

router.patch('/:id/reject', isAdmin, preventAdminSelfReview, rejectProject);

router.patch('/:id/no-publication', isAdmin, preventAdminSelfReview, markProjectNoPublication);

router.patch('/:id/publish', isAdmin, preventAdminSelfReview, publishProject);

router.patch('/:id/archive', isAdmin, preventAdminSelfReview, archiveProject);

// ─────────────────────────────────────────────
// Published output routes - keep before dynamic /:id routes
// ─────────────────────────────────────────────
router.get('/:id/published-output', getPublishedForecastOutput);

// ─────────────────────────────────────────────
// Owner routes
// ─────────────────────────────────────────────
router.post('/', createProject);

router.get('/', getUserProjects);

router.get('/latest', getLatestUserProject);

router.get('/:id', isOwnerOrAdmin, getProjectById);

router.put('/:id', isOwnerOrAdmin, updateProject);

router.patch('/:id/rename', isOwnerOrAdmin, requireEditableProject, renameProject); // IMPORTANT: updateProject must NOT allow status changes

router.delete('/:id', isOwnerOrAdmin, requireEditableProject, deleteProject);

// Workflow - owner action
router.patch('/:id/submit', submitProject);

export default router;
