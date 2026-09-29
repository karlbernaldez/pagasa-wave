import asyncHandler from '../utils/asyncHandler.js';
import { executeArchivePolicy, previewArchivePolicy } from '../services/archivePolicyService.js';

export const previewArchivePolicyController = asyncHandler(async (_req, res) => {
  const preview = await previewArchivePolicy();
  res.json(preview);
});

export const runArchivePolicyController = asyncHandler(async (req, res) => {
  const result = await executeArchivePolicy({
    actorUserId: req.user?.id,
  });

  res.json(result);
});
