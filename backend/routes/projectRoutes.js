// backend/routes/projectRoutes.js

import { createHash } from 'node:crypto';
import express from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
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
  renameProject,
} from '../controllers/projectController.js';
import {
  getAdminForecastPackage,
  getAdminProjects,
} from '../controllers/adminProjectController.js';
import {
  getPublishedForecastOutput,
  getPublicPublishedForecastOutput,
  listPublicPublishedForecasts,
} from '../controllers/publishedForecastController.js';
import { recordPublicPublishedChartView } from '../controllers/publishedChartViewController.js';
import Project from '../models/Project.js';
import ForecastPackage from '../models/ForecastPackage.js';

import protect from '../middleware/authMiddleware.js';
import isOwnerOrAdmin from '../middleware/projectMiddleware.js';
import { requireAnyPermission, requirePermission } from '../middleware/permissionMiddleware.js';
import { throwError } from '../utils/errorHelper.js';
import { canEditProjectStatus, getProjectEditLockMessage } from '../utils/projectWorkflow.js';
import { emitForecastChartUpdated, emitForecastPackageUpdated } from '../socket/socketEmitter.js';

const router = express.Router();

const publishedViewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    createHash('sha256')
      .update(String(ipKeyGenerator(req)))
      .digest('hex'),
  message: { message: 'Published chart view rate limit exceeded.' },
});

function getId(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value._id) return String(value._id);
  if (value.id) return String(value.id);
  if (typeof value.toString === 'function' && value.toString !== Object.prototype.toString)
    return String(value.toString());
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

async function preventLegacyOwnerSelfReview(req, _res, next) {
  try {
    const project = await Project.findById(req.params.id).select('owner forecastPackage');
    if (!project) throwError('Project not found', 404);

    const isSharedForecastChart =
      Boolean(project.forecastPackage) ||
      Boolean(await ForecastPackage.exists({ 'charts.project': project._id }));

    if (!isSharedForecastChart && project.owner && String(project.owner) === String(req.user?.id)) {
      throwError('Reviewers cannot review their own projects', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
}

const canViewProject = requireAnyPermission(
  'projects.view',
  'projects.view_own',
  'projects.view_all',
  'projects.review'
);

router.get('/public/published', listPublicPublishedForecasts);
router.get('/public/published/:id', getPublicPublishedForecastOutput);
router.post('/public/published/:id/view', publishedViewLimiter, recordPublicPublishedChartView);

router.use(protect);

router.get('/admin/projects', requirePermission('projects.review'), getAdminProjects);
router.get(
  '/admin/projects/:id/package',
  requirePermission('projects.review'),
  getAdminForecastPackage
);

router.patch(
  '/:id/start-review',
  requirePermission('projects.review'),
  preventLegacyOwnerSelfReview,
  emitProjectWorkflowAfterResponse('review_started'),
  startReviewProject
);
router.post(
  '/:id/review-comment',
  requirePermission('projects.review'),
  preventLegacyOwnerSelfReview,
  emitProjectWorkflowAfterResponse('comment_added'),
  addReviewComment
);
router.patch(
  '/:id/request-revision',
  requirePermission('projects.review'),
  preventLegacyOwnerSelfReview,
  emitProjectWorkflowAfterResponse('revision_requested'),
  requestProjectRevision
);
router.patch(
  '/:id/approve',
  requirePermission('projects.approve'),
  preventLegacyOwnerSelfReview,
  emitProjectWorkflowAfterResponse('approved'),
  approveProject
);
router.patch(
  '/:id/reject',
  requirePermission('projects.review'),
  preventLegacyOwnerSelfReview,
  emitProjectWorkflowAfterResponse('rejected'),
  rejectProject
);
router.patch(
  '/:id/no-publication',
  requirePermission('projects.review'),
  preventLegacyOwnerSelfReview,
  emitProjectWorkflowAfterResponse('marked_no_publication'),
  markProjectNoPublication
);
router.patch(
  '/:id/publish',
  requirePermission('projects.publish'),
  preventLegacyOwnerSelfReview,
  emitProjectWorkflowAfterResponse('published'),
  publishProject
);
router.patch(
  '/:id/archive',
  requirePermission('projects.review'),
  preventLegacyOwnerSelfReview,
  emitProjectWorkflowAfterResponse('archived'),
  archiveProject
);

router.get('/:id/published-output', canViewProject, isOwnerOrAdmin, getPublishedForecastOutput);

router.post('/', requirePermission('projects.create'), createProject);
router.get('/', requirePermission('projects.view_own'), getUserProjects);
router.get('/latest', requirePermission('projects.view_own'), getLatestUserProject);
router.get('/:id', canViewProject, isOwnerOrAdmin, getProjectById);
router.put('/:id', requirePermission('projects.edit'), isOwnerOrAdmin, updateProject);
router.patch(
  '/:id/rename',
  requirePermission('projects.edit'),
  isOwnerOrAdmin,
  requireEditableProject,
  renameProject
);
router.delete(
  '/:id',
  requirePermission('projects.edit'),
  isOwnerOrAdmin,
  requireEditableProject,
  deleteProject
);
router.patch(
  '/:id/submit',
  requirePermission('projects.submit'),
  emitProjectWorkflowAfterResponse('submitted'),
  submitProject
);

export default router;
