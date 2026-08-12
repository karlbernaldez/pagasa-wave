import Feature from '../models/Feature.js';
import ForecastPackage from '../models/ForecastPackage.js';
import Notification from '../models/Notification.js';
import { acquireProjectMutationLock } from '../utils/projectMutationLock.js';

function releaseLockWithResponse(res, release) {
  let released = false;
  const releaseOnce = () => {
    if (released) return;
    released = true;
    res.off('finish', releaseOnce);
    res.off('close', releaseOnce);
    release();
  };

  res.once('finish', releaseOnce);
  res.once('close', releaseOnce);
}

async function lockResolvedProject(req, res, next, resolveProjectId) {
  try {
    const projectId = await resolveProjectId(req);
    if (!projectId) return next();

    const release = await acquireProjectMutationLock(projectId);
    releaseLockWithResponse(res, release);
    return next();
  } catch (error) {
    return next(error);
  }
}

export function lockFeatureProjectMutation(req, res, next) {
  return lockResolvedProject(req, res, next, async () => {
    const bodyProjectId = req.body?.properties?.project;
    if (bodyProjectId) return bodyProjectId;

    if (req.params.notificationId) {
      const notification = await Notification.findById(req.params.notificationId)
        .select('metadata.projectId')
        .lean();
      return notification?.metadata?.projectId || null;
    }

    if (!req.params.sourceId) return null;
    const feature = await Feature.findOne({ sourceId: req.params.sourceId })
      .select('properties.project')
      .lean();
    return feature?.properties?.project || null;
  });
}

export function lockProjectParamMutation(req, res, next) {
  return lockResolvedProject(req, res, next, async () => req.params.projectId || null);
}

export function lockPackageChartMutation(req, res, next) {
  return lockResolvedProject(req, res, next, async () => {
    if (!req.params.id || !req.params.chartType) return null;
    const forecastPackage = await ForecastPackage.findById(req.params.id).select('charts').lean();
    const chart = forecastPackage?.charts?.find((row) => row.chartType === req.params.chartType);
    return chart?.project || null;
  });
}
