import asyncHandler from '../utils/asyncHandler.js';
import { throwError } from '../utils/errorHelper.js';
import {
  getPublishedPackageArtifactReadiness,
  isPublishedPdfStyle,
  queuePublishedPackagePdfGeneration,
  savePublishedChartSnapshot,
} from '../services/publishedPdfArtifactService.js';
import { REQUIRED_FORECAST_CHART_TYPES } from '../utils/forecastPackage.js';

const CHART_TYPE_SET = new Set(REQUIRED_FORECAST_CHART_TYPES);

function normalizeString(value) {
  return String(value || '').trim();
}

export const getPublishedArtifactReadiness = asyncHandler(async (req, res) => {
  const readiness = await getPublishedPackageArtifactReadiness(req.params.id);
  if (!readiness) throwError('Forecast Package not found', 404);
  res.json(readiness);
});

export const uploadPublishedChartSnapshot = asyncHandler(async (req, res) => {
  const packageId = normalizeString(req.params.id);
  const style = normalizeString(req.body?.style);
  const chartType = normalizeString(req.body?.chartType);
  const projectId = normalizeString(req.body?.projectId);
  const imageDataUrl = normalizeString(req.body?.imageDataUrl);

  if (!packageId || !projectId || !imageDataUrl) {
    throwError('packageId, projectId, and imageDataUrl are required', 400);
  }
  if (!isPublishedPdfStyle(style)) {
    throwError('Unsupported published chart style', 400);
  }
  if (!CHART_TYPE_SET.has(chartType)) {
    throwError('Unsupported forecast chart type', 400);
  }

  let readiness;
  try {
    readiness = await savePublishedChartSnapshot({
      packageId,
      style,
      chartType,
      projectId,
      imageDataUrl,
    });
  } catch (error) {
    throwError(error?.message || 'Failed to store published chart snapshot', 400);
  }

  if (readiness.ready) {
    queuePublishedPackagePdfGeneration(packageId);
  }

  res.status(201).json({
    status: readiness.ready ? 'complete' : 'collecting',
    style,
    readyCount: readiness.readyCount,
    requiredCount: readiness.requiredCount,
  });
});
