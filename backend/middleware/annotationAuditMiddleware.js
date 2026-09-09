import AnnotationAudit from '../models/AnnotationAudit.js';
import Feature from '../models/Feature.js';

function getFeatureSnapshot(feature) {
  if (!feature) return null;
  const plain = typeof feature.toObject === 'function' ? feature.toObject() : feature;
  return {
    name: plain.name || '',
    geometry: plain.geometry || null,
    style: plain.properties?.style || {},
    labelValue: plain.properties?.labelValue ?? null,
    frontSymbolSide: plain.properties?.frontSymbolSide ?? null,
  };
}

function getStableId(feature, sourceId) {
  return (
    feature?.properties?.stableId ||
    feature?.properties?.annotationId ||
    feature?.properties?.sourceId ||
    sourceId ||
    ''
  );
}

async function findFeature(sourceId) {
  if (!sourceId) return null;
  return Feature.findOne({ sourceId }).lean();
}

async function persistAudit({ action, before, req, sourceId }) {
  const after = action === 'deleted' ? null : await findFeature(sourceId);
  const feature = before || after;
  const projectId = feature?.properties?.project || req.body?.properties?.project;
  const performedBy = req.user?.id || req.user?._id;

  if (!projectId || !performedBy || !sourceId) {
    throw new Error('Annotation audit metadata is incomplete.');
  }

  await AnnotationAudit.create({
    project: projectId,
    sourceId,
    stableId: getStableId(feature, sourceId),
    featureName: feature?.name || after?.name || before?.name || '',
    action,
    performedBy,
    before: getFeatureSnapshot(before),
    after: getFeatureSnapshot(after),
  });
}

export function auditAnnotationMutation(action) {
  return async (req, res, next) => {
    try {
      const sourceId = req.params?.sourceId || req.body?.sourceId;
      const before = await findFeature(sourceId);
      const originalJson = res.json.bind(res);

      res.json = (body) => {
        const successful = res.statusCode >= 200 && res.statusCode < 300;
        const createdNow = action !== 'created' || res.statusCode === 201;

        if (!successful || !createdNow) {
          return originalJson(body);
        }

        persistAudit({ action, before, req, sourceId })
          .then(() => originalJson(body))
          .catch((error) => {
            console.error('[AnnotationAudit] Failed to persist annotation audit event:', error);
            next(error);
          });

        return res;
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}
