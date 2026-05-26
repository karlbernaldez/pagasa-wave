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
  publishProject,
  archiveProject,
  renameProject
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
import { requireExpectedVersion } from '../middleware/optimisticConcurrency.js';

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

router.get('/public/published', listPublicPublishedForecasts);
router.get('/public/published/:id', getPublicPublishedForecastOutput);
router.use(protect);
router.get('/admin/projects', isAdmin, getAdminProjects);
router.patch('/:id/start-review', requireExpectedVersion, isAdmin, preventAdminSelfReview, startReviewProject);
router.post('/:id/review-comment', requireExpectedVersion, isAdmin, preventAdminSelfReview, addReviewComment);
router.patch('/:id/request-revision', requireExpectedVersion, isAdmin, preventAdminSelfReview, requestProjectRevision);
router.patch('/:id/approve', requireExpectedVersion, isAdmin, preventAdminSelfReview, approveProject);
router.patch('/:id/reject', requireExpectedVersion, isAdmin, preventAdminSelfReview, rejectProject);
router.patch('/:id/publish', requireExpectedVersion, isAdmin, preventAdminSelfReview, publishProject);
router.patch('/:id/archive', requireExpectedVersion, isAdmin, preventAdminSelfReview, archiveProject);
router.get('/:id/published-output', getPublishedForecastOutput);
router.post('/', createProject);
router.get('/', getUserProjects);
router.get('/latest', getLatestUserProject);
router.get('/:id', isOwnerOrAdmin, getProjectById);
router.put('/:id', requireExpectedVersion, isOwnerOrAdmin, updateProject);
router.patch('/:id/rename', requireExpectedVersion, isOwnerOrAdmin, requireEditableProject, renameProject);
router.delete('/:id', requireExpectedVersion, isOwnerOrAdmin, requireEditableProject, deleteProject);
router.patch('/:id/submit', requireExpectedVersion, submitProject);

export default router;