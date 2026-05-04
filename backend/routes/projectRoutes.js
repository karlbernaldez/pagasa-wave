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

import protect from '../middleware/authMiddleware.js';
import isOwnerOrAdmin from '../middleware/projectMiddleware.js';
import { isAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

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

router.patch('/:id/rename', isOwnerOrAdmin, renameProject); // IMPORTANT: updateProject must NOT allow status changes

router.delete('/:id', isOwnerOrAdmin, deleteProject);

// Workflow - owner action
router.patch('/:id/submit', submitProject);

export default router;