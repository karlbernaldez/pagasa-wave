import asyncHandler from '../utils/asyncHandler.js';
import {
  createReviewChecklistDefinitionVersion,
  getActiveReviewChecklistDefinition,
  getPackageReviewChecklist,
  updatePackageReviewChecklistItem,
} from '../services/reviewChecklistService.js';

export const getActiveReviewChecklistDefinitionController = asyncHandler(async (_req, res) => {
  const definition = await getActiveReviewChecklistDefinition();
  res.json({ definition });
});

export const createReviewChecklistDefinitionVersionController = asyncHandler(async (req, res) => {
  const definition = await createReviewChecklistDefinitionVersion(req.body || {}, req.user?.id);
  res.status(201).json({ definition });
});

export const getPackageReviewChecklistController = asyncHandler(async (req, res) => {
  const checklist = await getPackageReviewChecklist(req.params.id);

  if (!checklist) {
    return res.status(404).json({
      message: 'Active review checklist not found for this Forecast Package.',
    });
  }

  return res.json({ checklist });
});

export const updatePackageReviewChecklistItemController = asyncHandler(async (req, res) => {
  const result = await updatePackageReviewChecklistItem({
    forecastPackageId: req.params.id,
    itemId: req.params.itemId,
    status: req.body?.status,
    comment: req.body?.comment,
    expectedVersion: req.body?.version,
    userId: req.user?.id,
  });

  res.json(result);
});
