// backend/routes/featureRoutes.js
import express from 'express';
import { createFeature, getAllFeatures, getFeaturesByUserAndProject, getFeatureBySourceId, deleteFeature, updateFeatureName } from '../controllers/featureController.js';
import protect from '../middleware/authMiddleware.js'
import { authenticateToken } from '../middleware/authenticateToken.js';

const router = express.Router();

// Protect all feature routes
router.use(protect);

// Routes
router.post('/', authenticateToken, createFeature);
router.get('/', getAllFeatures);
router.get('/my-projects/:projectId', authenticateToken, getFeaturesByUserAndProject);
router.get('/:sourceId', getFeatureBySourceId);
router.delete('/:sourceId', authenticateToken, deleteFeature);
router.patch('/:sourceId', authenticateToken, updateFeatureName);



export default router;