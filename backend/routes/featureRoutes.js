// backend/routes/featureRoutes.js
import express from 'express';
import {
  createFeature,
  getFeaturesByUserAndProject,
  getFeatureBySourceId,
  deleteFeature,
  updateFeatureName,
  getProjectFeatureCollection,
  updateFeatureCoordinates,
  updateFeatureStyle,
  requestFeatureChange,
  approveFeatureChangeRequest,
  declineFeatureChangeRequest,
} from '../controllers/featureController.js';
import protect from '../middleware/authMiddleware.js';
import { authenticateToken } from '../middleware/authenticateToken.js';
import { requirePermission } from '../middleware/permissionMiddleware.js';
import { isOwnerOrAdmin, isFeatureOwnerOrAdmin } from '../middleware/featuresMiddleware.js';
import { auditAnnotationMutation } from '../middleware/annotationAuditMiddleware.js';
import { lockFeatureProjectMutation } from '../middleware/projectMutationLockMiddleware.js';

const router = express.Router();

router.use(protect);

router.post(
  '/',
  requirePermission('studio.edit'),
  authenticateToken,
  lockFeatureProjectMutation,
  auditAnnotationMutation('created'),
  createFeature
);
router.get(
  '/admin/project/:projectId/features',
  requirePermission('studio.view'),
  isOwnerOrAdmin,
  getProjectFeatureCollection
);
router.get(
  '/my-projects/:projectId',
  requirePermission('studio.view'),
  isOwnerOrAdmin,
  getFeaturesByUserAndProject
);
router.post(
  '/requests/:notificationId/approve',
  requirePermission('studio.edit'),
  lockFeatureProjectMutation,
  approveFeatureChangeRequest
);
router.post(
  '/requests/:notificationId/decline',
  requirePermission('studio.edit'),
  declineFeatureChangeRequest
);
router.post(
  '/:sourceId/request-change',
  requirePermission('studio.edit'),
  lockFeatureProjectMutation,
  requestFeatureChange
);
router.get(
  '/:sourceId',
  requirePermission('studio.view'),
  isFeatureOwnerOrAdmin,
  getFeatureBySourceId
);
router.delete(
  '/:sourceId',
  requirePermission('studio.edit'),
  isFeatureOwnerOrAdmin,
  lockFeatureProjectMutation,
  auditAnnotationMutation('deleted'),
  deleteFeature
);
router.patch(
  '/:sourceId/coordinates',
  requirePermission('studio.edit'),
  isFeatureOwnerOrAdmin,
  lockFeatureProjectMutation,
  auditAnnotationMutation('moved'),
  updateFeatureCoordinates
);
router.patch(
  '/:sourceId/style',
  requirePermission('studio.edit'),
  isFeatureOwnerOrAdmin,
  lockFeatureProjectMutation,
  auditAnnotationMutation('styled'),
  updateFeatureStyle
);
router.patch(
  '/:sourceId',
  requirePermission('studio.edit'),
  isFeatureOwnerOrAdmin,
  lockFeatureProjectMutation,
  auditAnnotationMutation('renamed'),
  updateFeatureName
);

export default router;
