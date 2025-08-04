// backend/routes/featureRoutes.js
import express from 'express';
import { createFeature, getAllFeatures, getFeaturesByUserAndProject, getFeatureBySourceId, deleteFeature, updateFeatureName } from '../controllers/featureController.js';
import protect from '../middleware/authMiddleware.js'

const router = express.Router();

// Protect all feature routes
router.use(protect);

// Routes
router.post('/', createFeature);
router.get('/', getAllFeatures);
router.get('/my-projects', getFeaturesByUserAndProject);
router.get('/:sourceId', getFeatureBySourceId);
router.delete('/:sourceId', deleteFeature);
router.patch('/:sourceId', updateFeatureName);



export default router;