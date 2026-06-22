// backend/routes/featureRoutes.js
import express from 'express';
import {
  createFeature,
  getAllFeatures,
  getFeaturesByUserAndProject,
  getFeatureBySourceId,
  deleteFeature,
  updateFeatureName,
  getProjectFeatureCollection,
  updateFeatureCoordinates,
  requestFeatureChange,
  approveFeatureChangeRequest,
  declineFeatureChangeRequest,
} from '../controllers/featureController.js';
import protect from '../middleware/authMiddleware.js';
import { authenticateToken } from '../middleware/authenticateToken.js';
import { isOwnerOrAdmin, isFeatureOwnerOrAdmin } from '../middleware/featuresMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', authenticateToken, createFeature); //checked
router.get('/admin/project/:projectId/features', isOwnerOrAdmin, getProjectFeatureCollection);
router.get('/my-projects/:projectId', isOwnerOrAdmin, getFeaturesByUserAndProject); // checked
router.post('/requests/:notificationId/approve', approveFeatureChangeRequest);
router.post('/requests/:notificationId/decline', declineFeatureChangeRequest);
router.post('/:sourceId/request-change', requestFeatureChange);
router.get('/:sourceId', isFeatureOwnerOrAdmin, getFeatureBySourceId); // checked
router.delete('/:sourceId', isFeatureOwnerOrAdmin, deleteFeature); // checked
router.patch('/:sourceId/coordinates', isFeatureOwnerOrAdmin, updateFeatureCoordinates);
router.patch('/:sourceId', isFeatureOwnerOrAdmin, updateFeatureName); //checked

export default router;
