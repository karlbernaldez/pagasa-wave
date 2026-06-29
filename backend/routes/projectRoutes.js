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
import ForecastPackage from '../models/ForecastPackage.js';

import protect from '../middleware/authMiddleware.js';
import isOwnerOrAdmin from '../middleware/projectMiddleware.js';
import { isAdmin } from '../middleware/adminMiddleware.js';
import { throwError } from '../utils/errorHelper.js';
import { canEditProjectStatus, getProjectEditLockMessage } from '../utils/projectWorkflow.js';
import { emitForecastChartUpdated, emitForecastPackageUpdated } from '../socket/socketEmitter.js';

const router = express.Router();

function getId(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value._id) return String(value._id);
  if (value.id) return String(value.id);
  if (typeof value.toString === 'function' && value.toString !== Object.prototype.toString) return String(value.toString());
  return '';
}

async function emitProjectWorkflowUpdate(projectId, project, action) {
  if (!projectId) return;

  const forecastPackage = await ForecastPackage.findOne({ 'charts.project': projectId })
    .populate('owner', 'firstName lastName email username')
    .populate('charts.project')
    .lean();

  const payload = {
    action,
    status: project?.status,
    packageId: getId(forecastPackage),
  };

  emitForecastChartUpdated(projectId, payload);

  if (forecastPackage) {
    emitForecastPackageUpdated(forecastPackage, {
      action,
      projectId,
      projectStatus: project?.status,
    });
  }
}

function emitProjectWorkflowAfterResponse(action) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      const result = originalJson(body);
      const projectId = getId(body) || req.params.id;

      emitProjectWorkflowUpdate(projectId, body, action).catch((error) => {
        console.error('[ProjectRoutes] Failed to emit workflow socket update:', error);
      });

      return result;
    };
    next();
  };
}

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

router.patch('/:id/start-review', isAdmin, preventAdminSelfReview, emitProjectWorkflowAfterResponse('review_started'), startReviewProject);

router.post('/:id/review-comment', isAdmin, preventAdminSelfReview, emitProjectWorkflowAfterResponse('comment_added'), addReviewComment);

router.patch('/:id/request-revision', isAdmin, preventAdminSelfReview, emitProjectWorkflowAfterResponse('revision_requested'), requestProjectRevision);

router.patch('/:id/approve', isAdmin, preventAdminSelfReview, emitProjectWorkflowAfterResponse('approved'), approveProject);

router.patch('/:id/reject', isAdmin, preventAdminSelfReview, emitProjectWorkflowAfterResponse('rejected'), rejectProject);

router.patch('/:id/no-publication', isAdmin, preventAdminSelfReview, emitProjectWorkflowAfterResponse('marked_no_publication'), markProjectNoPublication);

router.patch('/:id/publish', isAdmin, preventAdminSelfReview, emitProjectWorkflowAfterResponse('published'), publishProject);

router.patch('/:id/archive', isAdmin, preventAdminSelfReview, emitProjectWorkflowAfterResponse('archived'), archiveProject);

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
router.patch('/:id/submit', emitProjectWorkflowAfterResponse('submitted'), submitProject);

export default router;
