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
import { requireRole } from '../middleware/adminMiddleware.js';
import { isOwnerOrAdmin, isFeatureOwnerOrAdmin } from '../middleware/featuresMiddleware.js';
import { lockFeatureProjectMutation } from '../middleware/projectMutationLockMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(requireRole('forecaster', 'admin'));

router.post('/', authenticateToken, lockFeatureProjectMutation, createFeature);
router.get('/admin/project/:projectId/features', isOwnerOrAdmin, getProjectFeatureCollection);
router.get('/my-projects/:projectId', isOwnerOrAdmin, getFeaturesByUserAndProject);
router.post('/requests/:notificationId/approve', lockFeatureProjectMutation, approveFeatureChangeRequest);
router.post('/requests/:notificationId/decline', declineFeatureChangeRequest);
router.post('/:sourceId/request-change', lockFeatureProjectMutation, requestFeatureChange);
router.get('/:sourceId', isFeatureOwnerOrAdmin, getFeatureBySourceId);
router.delete('/:sourceId', isFeatureOwnerOrAdmin, lockFeatureProjectMutation, deleteFeature);
router.patch(
  '/:sourceId/coordinates',
  isFeatureOwnerOrAdmin,
  lockFeatureProjectMutation,
  updateFeatureCoordinates
);
router.patch('/:sourceId/style', isFeatureOwnerOrAdmin, lockFeatureProjectMutation, updateFeatureStyle);
router.patch('/:sourceId', isFeatureOwnerOrAdmin, lockFeatureProjectMutation, updateFeatureName);

export default router;
