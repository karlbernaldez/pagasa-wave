import express from 'express';

import {
  getUserProjects,
  getLatestUserProject,
  getProjectById,
  createProject,
  renameProject,
  updateProject,
  deleteProject,
  submitProject,
  startReviewProject,
  addReviewComment,
  requestProjectRevision,
  approveProject,
  rejectProject,
  publishProject,
  archiveProject,
} from '../controllers/projects/projectController.js';

// ── Other controllers ─────────────────────────────────────────────────────────
import { getAllProjectsForAdmin as getAdminProjects } from '../controllers/projects/adminProjectController.js';
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

// ── Route guards ──────────────────────────────────────────────────────────────

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

// ── Public routes (no auth) ───────────────────────────────────────────────────

router.get('/public/published', listPublicPublishedForecasts);
router.get('/public/published/:id', getPublicPublishedForecastOutput);

// ── All routes below require authentication ───────────────────────────────────

router.use(protect);

// ── Admin project ────────────────────────────────────────────────────

router.get('/admin/projects', isAdmin, getAdminProjects);

router.patch('/:id/start-review',      isAdmin, preventAdminSelfReview, startReviewProject);
router.patch('/:id/request-revision',  isAdmin, preventAdminSelfReview, requestProjectRevision);
router.patch('/:id/approve',           isAdmin, preventAdminSelfReview, approveProject);
router.patch('/:id/reject',            isAdmin, preventAdminSelfReview, rejectProject);
router.patch('/:id/publish',           isAdmin, preventAdminSelfReview, publishProject);
router.patch('/:id/archive',           isAdmin, preventAdminSelfReview, archiveProject);

router.post('/:id/review-comment',     isAdmin, preventAdminSelfReview, addReviewComment);

// ── Published output (authenticated) ─────────────────────────────────────────

router.get('/:id/published-output', getPublishedForecastOutput);

// ── Owner project (new controller) ───────────────────────────────────

router.get('/',       getUserProjects);
router.get('/latest', getLatestUserProject);
router.post('/',      createProject);

router.get('/:id',    isOwnerOrAdmin, getProjectById);
router.put('/:id',    isOwnerOrAdmin, updateProject);

router.patch('/:id/rename',  isOwnerOrAdmin, requireEditableProject, renameProject);
router.patch('/:id/submit',  isOwnerOrAdmin, requireEditableProject, submitProject);
router.delete('/:id',        isOwnerOrAdmin, requireEditableProject, deleteProject);

export default router;