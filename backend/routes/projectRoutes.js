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

router.use(protect);

// ─────────────────────────────────────────────
// Admin routes - keep before dynamic /:id routes
// ─────────────────────────────────────────────
router.get('/admin/all', isAdmin, getAdminProjects);

router.patch('/:id/start-review', isAdmin, startReviewProject);

router.post('/:id/review-comment', isAdmin, addReviewComment);

router.patch('/:id/request-revision', isAdmin, requestProjectRevision);

router.patch('/:id/approve', isAdmin, approveProject);

router.patch('/:id/reject', isAdmin, rejectProject);

router.patch('/:id/publish', isAdmin, publishProject);

router.patch('/:id/archive', isAdmin, archiveProject);

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