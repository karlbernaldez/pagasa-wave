import asyncHandler from '../utils/asyncHandler.js';
import { recordPublishedChartView } from '../services/publishedChartViewService.js';

export const recordPublicPublishedChartView = asyncHandler(async (req, res) => {
  const result = await recordPublishedChartView({
    projectId: req.params.id,
    viewerToken: req.body?.viewerToken,
    now: new Date(),
  });

  res.status(result.counted ? 201 : 200).json({
    counted: result.counted,
    dateKey: result.dateKey,
  });
});
