// backend/routes/featureRoutes.js
import express from 'express';
import { createFeature, getAllFeatures, getFeaturesByUserAndProject, getFeatureBySourceId, deleteFeature, updateFeatureName } from '../controllers/featureController.js';
import protect from '../middleware/authMiddleware.js'
import { authenticateToken } from '../middleware/authenticateToken.js';
import {isOwnerOrAdmin, isFeatureOwnerOrAdmin} from '../middleware/featuresMiddleware.js';

const router = express.Router();

// Protect all feature routes
router.use(protect);

// Routes
router.post('/', authenticateToken, createFeature); //checked
router.get('/my-projects/:projectId', isOwnerOrAdmin, getFeaturesByUserAndProject); // checked
router.get('/:sourceId', isFeatureOwnerOrAdmin, getFeatureBySourceId); // checked
router.delete('/:sourceId', isFeatureOwnerOrAdmin, deleteFeature); // checked
router.patch('/:sourceId', isFeatureOwnerOrAdmin, updateFeatureName); //checked



export default router;