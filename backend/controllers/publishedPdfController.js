import fs from 'node:fs/promises';

import asyncHandler from '../utils/asyncHandler.js';
import {
  ensurePublishedPdfArtifactForDate,
  getPublishedPdfArtifactForDate,
  isPublishedPdfStyle,
  queuePublishedPackagePdfGeneration,
} from '../services/publishedPdfArtifactService.js';

function normalizeDateKey(value) {
  const dateKey = String(value || '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(dateKey) ? dateKey : '';
}

function getStyle(value) {
  const style = String(value || 'wave-wind').trim();
  return isPublishedPdfStyle(style) ? style : '';
}

export const getPublicPublishedPdfStatus = asyncHandler(async (req, res) => {
  const dateKey = normalizeDateKey(req.query.date);
  const style = getStyle(req.query.style);

  if (!dateKey || !style) {
    return res.status(400).json({
      status: 'invalid',
      message: 'A valid date and chart style are required.',
    });
  }

  const result = await ensurePublishedPdfArtifactForDate(dateKey, style);
  if (!result) {
    return res.status(404).json({
      status: 'unavailable',
      message: 'No published forecast package is available for this date.',
    });
  }

  const artifact = result.artifact;
  if (!result.readiness?.ready) {
    return res.status(202).json({
      status: 'awaiting-snapshots',
      message: 'Published chart snapshots are still being prepared.',
      readyCount: result.readiness?.readyCount || 0,
      requiredCount: result.readiness?.requiredCount || 0,
    });
  }

  if (!artifact) {
    return res.status(202).json({
      status: 'pending',
      message: 'Published PDF generation has been queued.',
    });
  }

  if (artifact.status === 'ready' && artifact.filePath) {
    try {
      await fs.access(artifact.filePath);
      return res.json({
        status: 'ready',
        fileName: artifact.fileName,
        fileSize: artifact.fileSize,
        generatedAt: artifact.generatedAt,
        sha256: artifact.sha256,
      });
    } catch {
      queuePublishedPackagePdfGeneration(result.forecastPackage._id);
      return res.status(202).json({
        status: 'pending',
        message: 'Published PDF is being regenerated.',
      });
    }
  }

  return res.status(artifact.status === 'failed' ? 503 : 202).json({
    status: artifact.status,
    message:
      artifact.status === 'failed'
        ? 'Published PDF generation failed and has been queued for retry.'
        : 'Published PDF generation is in progress.',
  });
});

export const downloadPublicPublishedPdf = asyncHandler(async (req, res) => {
  const dateKey = normalizeDateKey(req.query.date);
  const style = getStyle(req.query.style);

  if (!dateKey || !style) {
    return res.status(400).json({ message: 'A valid date and chart style are required.' });
  }

  const result = await getPublishedPdfArtifactForDate(dateKey, style);
  const artifact = result?.artifact;

  if (!result) {
    return res.status(404).json({ message: 'Published forecast package not found.' });
  }

  if (!result.readiness?.ready) {
    return res.status(409).json({
      message: 'Published chart snapshots are still being prepared.',
      status: 'awaiting-snapshots',
    });
  }

  if (!artifact || artifact.status !== 'ready' || !artifact.filePath) {
    queuePublishedPackagePdfGeneration(result.forecastPackage._id);
    return res.status(409).json({
      message: 'Published PDF is not ready yet.',
      status: artifact?.status || 'pending',
    });
  }

  try {
    await fs.access(artifact.filePath);
  } catch {
    queuePublishedPackagePdfGeneration(result.forecastPackage._id);
    return res.status(409).json({
      message: 'Published PDF is being regenerated.',
      status: 'pending',
    });
  }

  return res.download(artifact.filePath, artifact.fileName || 'wavelab-wave-chart-set.pdf');
});
