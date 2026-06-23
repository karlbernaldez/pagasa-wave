import asyncHandler from '../utils/asyncHandler.js';
import { throwError } from '../utils/errorHelper.js';
import Feature from '../models/Feature.js';
import Notification from '../models/Notification.js';
import {
  ensureProjectExists,
  ensureFeatureExists,
  validateGeometry,
  buildNewSourceIdAndUpdateData,
} from '../utils/dbHelpers.js';
import { isForecastPackageChartProject } from '../utils/forecastPackageAccess.js';
import { canEditProjectStatus, getProjectEditLockMessage } from '../utils/projectWorkflow.js';
import { emitForecastChartUpdated } from '../socket/socketEmitter.js';
import { createNotification } from '../services/notification/notificationService.js';

function ensureProjectIsEditable(project) { if (!canEditProjectStatus(project.status)) throwError(getProjectEditLockMessage(project.status), 403); }
function buildFeatureProperties(properties, owner, sourceId) { const stableId = properties.stableId || properties.annotationId || properties.sourceId || sourceId; return { ...properties, owner, sourceId, stableId, annotationId: stableId }; }
function isSameId(left, right) { return String(left?._id || left || '') === String(right?._id || right || ''); }
function getFeatureOwner(feature) { return feature?.properties?.owner?._id || feature?.properties?.owner; }
function getFeatureProjectId(feature) { return feature?.properties?.project?._id || feature?.properties?.project; }
function featureCanEdit(feature, user) { return Boolean(user?.role === 'admin' || isSameId(getFeatureOwner(feature), user?.id)); }
function normalizeFeatureForClient(feature, user) {
  const plain = typeof feature.toObject === 'function' ? feature.toObject() : feature;
  const stableId = plain.properties?.stableId || plain.properties?.annotationId || plain.properties?.sourceId || plain.sourceId;
  return {
    ...plain,
    type: 'Feature',
    id: stableId,
    geometry: plain.geometry,
    properties: {
      ...(plain.properties || {}),
      name: plain.name,
      sourceId: plain.sourceId,
      stableId,
      annotationId: stableId,
      canEdit: featureCanEdit(plain, user),
      owner: plain.properties?.owner,
    },
  };
}
function featureToClient(feature, user) { return normalizeFeatureForClient(feature, user); }
function toGeoJsonFeature(feature, user) { return normalizeFeatureForClient(feature, user); }
function emitAnnotationUpdate(projectId, action, sourceId) { emitForecastChartUpdated(projectId, { action, resourceType: 'annotation', sourceId }); }
async function ensureFeatureMutationAllowed(sourceId, user) { const feature = await ensureFeatureExists(sourceId); const projectId = getFeatureProjectId(feature); const project = await ensureProjectExists(projectId, user.id); ensureProjectIsEditable(project); if (!featureCanEdit(feature, user)) throwError('Only the annotation owner or an admin can change this annotation. Send a request to the owner instead.', 403); return { feature, project }; }

export const createFeature = asyncHandler(async (req, res) => {
  const { geometry, properties = {}, name = 'Untitled Feature', sourceId } = req.body;
  const owner = req.user.id;
  const projectId = properties.project;
  validateGeometry(geometry);
  if (!sourceId || !owner || !projectId) throwError('Missing required fields: sourceId or properties.project.', 400);
  const project = await ensureProjectExists(projectId, owner);
  ensureProjectIsEditable(project);
  const fullProperties = buildFeatureProperties(properties, owner, sourceId);
  const result = await Feature.updateOne({ sourceId, 'properties.owner': owner, 'properties.project': projectId }, { $setOnInsert: { geometry, properties: fullProperties, name, sourceId } }, { upsert: true });
  if (result.upsertedCount > 0) emitAnnotationUpdate(projectId, 'annotation_created', sourceId);
  res.status(result.upsertedCount > 0 ? 201 : 200).json({ message: result.upsertedCount > 0 ? 'Feature saved successfully (new)' : 'Feature already exists. Skipped saving.', sourceId, stableId: fullProperties.stableId });
});

export const getAllFeatures = asyncHandler(async (req, res) => { const features = await Feature.find().sort({ createdAt: -1 }); res.json(features.map((feature) => featureToClient(feature, req.user))); });
export const getProjectFeatureCollection = asyncHandler(async (req, res) => { const { projectId } = req.params; if (!projectId) throwError('Missing projectId.', 400); const features = await Feature.find({ 'properties.project': projectId }); res.json({ type: 'FeatureCollection', features: features.map((feature) => toGeoJsonFeature(feature, req.user)) }); });
export const getFeaturesByUserAndProject = asyncHandler(async (req, res) => { const userId = req.user.id; const { projectId } = req.params; if (!projectId) throwError('Missing projectId in route.', 400); const sharedForecastChart = await isForecastPackageChartProject(projectId); const query = sharedForecastChart ? { 'properties.project': projectId } : { 'properties.owner': userId, 'properties.project': projectId }; const features = await Feature.find(query).sort({ createdAt: -1 }); res.json(features.map((feature) => featureToClient(feature, req.user))); });

export const requestFeatureChange = asyncHandler(async (req, res) => {
  const { sourceId } = req.params;
  const { requestType, requestedName = '', comment = '' } = req.body || {};
  const normalizedType = String(requestType || '').trim();
  const normalizedComment = String(comment || '').trim();
  const normalizedRequestedName = String(requestedName || '').trim();
  if (!['rename', 'delete', 'label_change'].includes(normalizedType)) throwError('requestType must be rename, delete, or label_change.', 400);
  if ((normalizedType === 'rename' || normalizedType === 'label_change') && !normalizedRequestedName) throwError('requestedName is required for rename or label change requests.', 400);
  const feature = await ensureFeatureExists(sourceId);
  const projectId = getFeatureProjectId(feature);
  const project = await ensureProjectExists(projectId, req.user.id);
  const owner = getFeatureOwner(feature);
  if (isSameId(owner, req.user.id)) throwError('You own this annotation and can edit it directly.', 400);
  await createNotification({
    type: 'annotation_change_request',
    title: normalizedType === 'delete' ? 'Annotation delete requested' : 'Annotation change requested',
    message: normalizedType === 'delete' ? `${req.user.email || 'A forecaster'} requested deletion of "${feature.name || sourceId}".${normalizedComment ? ` ${normalizedComment}` : ''}` : `${req.user.email || 'A forecaster'} requested "${feature.name || sourceId}" be changed to "${normalizedRequestedName}".${normalizedComment ? ` ${normalizedComment}` : ''}`,
    recipientUser: owner,
    actorUser: req.user.id,
    resourceType: 'Feature',
    resourceId: feature._id,
    resourcePath: `/studio/${projectId}`,
    projectName: project?.name || '',
    metadata: { sourceId, projectId: String(projectId), requestType: normalizedType, requestedName: normalizedRequestedName, comment: normalizedComment, status: 'pending' },
  });
  res.status(201).json({ message: 'Request sent to annotation owner.' });
});

export const approveFeatureChangeRequest = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const notification = await Notification.findById(notificationId);
  if (!notification) throwError('Request notification not found.', 404);
  if (notification.type !== 'annotation_change_request') throwError('Notification is not an annotation change request.', 400);
  if (!isSameId(notification.recipientUser, req.user.id) && req.user.role !== 'admin') throwError('Only the annotation owner or an admin can approve this request.', 403);
  if (notification.metadata?.status === 'approved') return res.json({ message: 'Request already approved.', status: 'approved', projectId: notification.metadata?.projectId, sourceId: notification.metadata?.sourceId, requestType: notification.metadata?.requestType });
  if (notification.metadata?.status === 'declined') throwError('Request was already declined.', 400);
  const { sourceId, requestType, requestedName } = notification.metadata || {};
  if (!sourceId || !requestType) throwError('Request metadata is incomplete. Please recreate the request so it includes approval details.', 400);
  const feature = await ensureFeatureExists(sourceId);
  const projectId = getFeatureProjectId(feature);
  const project = await ensureProjectExists(projectId, req.user.id);
  ensureProjectIsEditable(project);
  if (!featureCanEdit(feature, req.user)) throwError('Only the annotation owner or an admin can approve this request.', 403);
  let newSourceId = sourceId;
  if (requestType === 'delete') {
    await Feature.deleteOne({ sourceId, 'properties.project': projectId });
  } else {
    const updateData = buildNewSourceIdAndUpdateData(feature, requestedName);
    newSourceId = updateData.newSourceId;
    await Feature.updateOne({ sourceId }, { $set: updateData.updateFields });
  }
  notification.metadata.status = 'approved';
  notification.metadata.approvedAt = new Date();
  notification.metadata.newSourceId = newSourceId;
  await notification.save();
  emitAnnotationUpdate(projectId, requestType === 'delete' ? 'annotation_deleted' : 'annotation_updated', sourceId);
  res.json({ message: 'Request approved.', status: 'approved', projectId, sourceId, newSourceId, requestType });
});
