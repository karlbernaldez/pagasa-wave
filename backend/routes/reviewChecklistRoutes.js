import express from 'express';

import {
  createReviewChecklistDefinitionVersionController,
  getActiveReviewChecklistDefinitionController,
  getPackageReviewChecklistController,
  updatePackageReviewChecklistItemController,
} from '../controllers/reviewChecklistController.js';
import protect from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/permissionMiddleware.js';

const router = express.Router();

router.use(protect);

router.get(
  '/definition',
  requirePermission('settings_review_targets.view'),
  getActiveReviewChecklistDefinitionController
);
router.post(
  '/definition',
  requirePermission('settings_review_targets.manage'),
  createReviewChecklistDefinitionVersionController
);
router.get(
  '/packages/:id',
  requirePermission('projects.review'),
  getPackageReviewChecklistController
);
router.patch(
  '/packages/:id/items/:itemId',
  requirePermission('projects.review'),
  updatePackageReviewChecklistItemController
);

export default router;
