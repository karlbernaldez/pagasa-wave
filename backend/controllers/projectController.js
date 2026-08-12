import mongoose from 'mongoose';

import asyncHandler from '../utils/asyncHandler.js';
import { throwError } from '../utils/errorHelper.js';
import {
  ensureProjectExists,
  ensureUniqueProjectName,
  deleteProjectAndFeatures,
} from '../utils/dbHelpers.js';
import Project from '../models/Project.js';
import { saveProjectSnapshot } from '../utils/projectSnapshot.js';
import Feature from '../models/Feature.js';
import { createNotification } from '../services/notification/notificationService.js';
import {
  PROJECT_STATUS,
  canAddReviewCommentStatus,
  canEditProjectStatus,
  canTransitionProjectStatus,
} from '../utils/projectWorkflow.js';

const USER_PROJECT_SORT_FIELDS = {
  name: 'name',
  chartType: 'chartType',
  type: 'chartType',
  forecastDate: 'forecastDate',
  status: 'status',
  lastOpenedAt: 'lastOpenedAt',
  updatedAt: 'updatedAt',
  createdAt: 'createdAt',
};

const PROJECT_NOTIFICATION_COPY = {
  comment_added: {
    title: 'Admin commented on your project',
    message: (project, comment) => `Admin left a comment on "${project.name}": ${comment}`,
  },
  revision_requested: {
    title: 'Revision requested',
    message: (project, comment) => `Admin requested revisions on "${project.name}": ${comment}`,
  },
  approved: {
    title: 'Project approved',
    message: (project) => `"${project.name}" has been approved by Admin.`,
  },
  rejected: {
    title: 'Project rejected',
    message: (project, comment) => `"${project.name}" was rejected: ${comment}`,
  },
  marked_no_publication: {
    title: 'No publication recorded',
    message: (project, comment) => `"${project.name}" was marked as No Publication: ${comment}`,
  },
  published: {
    title: 'Project published',
    message: (project) => `"${project.name}" has been published.`,
  },
};

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getDateRangeFilter(dateRange) {
  const daysByRange = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
  };

  const days = daysByRange[dateRange];
  if (!days) return null;

  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function buildStatusCounts(rows) {
  return Object.values(PROJECT_STATUS).reduce(
    (counts, status) => {
      counts[status] = 0;
      return counts;
    },
    rows.reduce((counts, row) => {
      if (row?._id) counts[row._id] = row.count;
      return counts;
    }, {})
  );
}

function getRequiredComment(value, label = 'Comment') {
  const comment = String(value || '').trim();
  if (!comment) throwError(`${label} is required`, 400);
  if (comment.length > 1000) throwError(`${label} must be 1000 characters or less`, 400);
  return comment;
}

function getNoPublicationPayload(body = {}) {
  const reason = String(body.reason || body.noPublicationReason || '').trim();
  const notes = String(body.notes || body.noPublicationNotes || body.comment || '').trim();

  if (!reason) throwError('No-publication reason is required', 400);
  if (reason.length > 160) throwError('No-publication reason must be 160 characters or less', 400);
  if (notes.length > 1000) throwError('No-publication notes must be 1000 characters or less', 400);

  return {
    reason,
    notes,
    comment: notes ? `${reason}: ${notes}` : reason,
  };
}

function getStableFeatureId(feature) {
  return (
    feature.properties?.stableId ||
    feature.properties?.annotationId ||
    feature.properties?.sourceId ||
    feature.sourceId
  );
}

function toFeatureSnapshot(feature) {
  const stableId = getStableFeatureId(feature);

  return {
    type: 'Feature',
    id: stableId,
    geometry: feature.geometry,
    properties: {
      ...(feature.properties || {}),
      name: feature.name,
      sourceId: feature.sourceId,
      stableId,
      annotationId: stableId,
    },
  };
}

function getLatestVersionReason(project) {
  if (!project.versions?.length) return null;
  return project.versions[project.versions.length - 1]?.reason || null;
}

function getProjectNotificationResourcePath(project, type) {
  if (type === 'published') return `/forecasts/${project._id}`;
  return `/studio/${project._id}`;
}

async function notifyProjectOwner(project, actorId, type, comment = '') {
  const copy = PROJECT_NOTIFICATION_COPY[type];
  if (!copy || !project?.owner) return;

  try {
    await createNotification({
      type,
      title: copy.title,
      message: copy.message(project, comment),
      recipientUser: project.owner,
      actorUser: actorId,
      resourceType: 'project',
      resourceId: project._id,
      resourcePath: getProjectNotificationResourcePath(project, type),
      projectName: project.name,
    });
  } catch (error) {
    console.error('[ProjectNotifications] Failed to create notification:', error);
  }
}

async function createProjectVersionSnapshot(project, userId, reason = 'submit') {
  const projectId = project?._id;
  const features = mongoose.isValidObjectId(projectId)
    ? await Feature.find({
        'properties.project': projectId,
      }).lean()
    : [];

  const featureCollection = {
    type: 'FeatureCollection',
    features: features.map(toFeatureSnapshot),
  };

  const lastVersion = project.versions?.length
    ? project.versions[project.versions.length - 1].versionNumber
    : 0;
  const nextVersion = lastVersion + 1;

  project.version = nextVersion;
  project.versions.push({
    versionNumber: nextVersion,
    snapshot: featureCollection,
    features: featureCollection.features,
    featureCollection,
    createdBy: userId,
    reason,
  });
}

async function sendProject(project, res) {
  await project.populate([
    { path: 'owner', select: 'firstName lastName email username' },
    { path: 'reviewStartedBy', select: 'firstName lastName email username' },
    { path: 'approvedBy', select: 'firstName lastName email username' },
    { path: 'rejectedBy', select: 'firstName lastName email username' },
    { path: 'noPublicationBy', select: 'firstName lastName email username' },
    { path: 'auditLogs.performedBy', select: 'firstName lastName email username' },
  ]);
  res.json(project);
}

/* =========================================================
   ADMIN: GET ALL PROJECTS
--------------------------------------------------------- */
export const getAllProjectsForAdmin = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    throwError('Admin access required', 403);
  }

  const allowedAdminStatuses = [
    PROJECT_STATUS.SUBMITTED,
    PROJECT_STATUS.UNDER_REVIEW,
    PROJECT_STATUS.REVISION_REQUESTED,
    PROJECT_STATUS.APPROVED,
    PROJECT_STATUS.PUBLISHED,
    PROJECT_STATUS.REJECTED,
    PROJECT_STATUS.NO_PUBLICATION,
    PROJECT_STATUS.ARCHIVED,
  ];

  const { status } = req.query;

  const filter = {
    status: { $in: allowedAdminStatuses },
  };

  if (status) {
    if (!allowedAdminStatuses.includes(status)) {
      throwError('Invalid or unauthorized status filter', 400);
    }
    filter.status = status;
  }

  const projects = await Project.find(filter)
    .populate('owner', 'firstName lastName email username')
    .populate('reviewStartedBy', 'firstName lastName email username')
    .populate('approvedBy', 'firstName lastName email username')
    .populate('rejectedBy', 'firstName lastName email username')
    .populate('noPublicationBy', 'firstName lastName email username')
    .populate('auditLogs.performedBy', 'firstName lastName email username')
    .sort({
      lastOpenedAt: -1,
      updatedAt: -1,
      submittedAt: -1,
      createdAt: -1,
    })
    .lean();

  res.json(projects);
});

/* =========================================================
   CREATE PROJECT
--------------------------------------------------------- */
export const createProject = asyncHandler(async (req, res) => {
  const { name, description, chartType, forecastDate } = req.body;

  if (!req.user) throwError('Unauthorized', 401);
  if (!name || !chartType || !forecastDate) {
    throwError('name, chartType and forecastDate are required', 400);
  }

  await ensureUniqueProjectName(name, req.user.id);

  const project = await Project.create({
    name: name.trim(),
    description: description?.trim() || '',
    chartType: chartType.trim(),
    forecastDate,
    owner: req.user.id,
    status: PROJECT_STATUS.DRAFT,
    version: 1,
    auditLogs: [
      {
        action: 'created',
        performedBy: req.user.id,
        previousStatus: null,
        newStatus: PROJECT_STATUS.DRAFT,
        comment: 'Project created',
      },
    ],
  });

  res.status(201).json(project);
});

/* =========================================================
   GET USER PROJECTS
--------------------------------------------------------- */
export const getUserProjects = asyncHandler(async (req, res) => {
  if (!req.user) throwError('Unauthorized', 401);

  const {
    page = 1,
    limit = 10,
    search = '',
    status = '',
    type = '',
    dateRange = '',
    sortBy = 'updatedAt',
    sortDir = 'desc',
  } = req.query;

  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const skip = (pageNumber - 1) * limitNumber;

  const query = { owner: req.user.id };
  const filters = [];
  const trimmedSearch = search.trim();

  if (trimmedSearch) {
    const safeSearch = escapeRegex(trimmedSearch.slice(0, 80));
    filters.push({
      $or: [
        { name: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } },
      ],
    });
  }

  if (status && status !== 'All') {
    filters.push({ status });
  }

  if (type && type !== 'All') {
    filters.push({ chartType: type });
  }

  const cutoffDate = getDateRangeFilter(dateRange);
  if (cutoffDate) {
    const dateQuery = { $gte: cutoffDate };
    filters.push({
      $or: [{ updatedAt: dateQuery }, { forecastDate: dateQuery }],
    });
  }

  if (filters.length > 0) {
    query.$and = filters;
  }

  const sortField = USER_PROJECT_SORT_FIELDS[sortBy] || 'updatedAt';
  const sortDirection = sortDir === 'asc' ? 1 : -1;
  const sortQuery = {
    [sortField]: sortDirection,
    updatedAt: -1,
    createdAt: -1,
    _id: -1,
  };

  const [projects, total, statusCountRows] = await Promise.all([
    Project.find(query).sort(sortQuery).skip(skip).limit(limitNumber).lean(),
    Project.countDocuments(query),
    Project.aggregate([{ $match: query }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  res.json({
    projects,
    total,
    page: pageNumber,
    limit: limitNumber,
    totalPages: Math.max(1, Math.ceil(total / limitNumber)),
    statusCounts: buildStatusCounts(statusCountRows),
  });
});

/* =========================================================
   GET LATEST USER PROJECT
--------------------------------------------------------- */
export const getLatestUserProject = asyncHandler(async (req, res) => {
  if (!req.user) throwError('Unauthorized', 401);

  const project = await Project.findOne({ owner: req.user.id }).sort({ updatedAt: -1 }).lean();

  if (!project) {
    return res.json({
      project: null,
      message: 'No projects found for this user',
    });
  }

  res.json({ project });
});

/* =========================================================
   GET PROJECT BY ID
--------------------------------------------------------- */
export const getProjectById = asyncHandler(async (req, res) => {
  const project = await ensureProjectExists(req.params.id, req.user.id);

  await project.populate('owner', 'firstName lastName email position');

  project.lastOpenedAt = new Date();
  project.lastOpenedBy = req.user.id;
  project.openCount += 1;

  await project.save();

  res.json(project);
});

/* =========================================================
   UPDATE PROJECT NAME
--------------------------------------------------------- */
export const renameProject = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    throwError('name is required', 400);
  }

  const project = await ensureProjectExists(req.params.id, req.user.id);

  if (!canEditProjectStatus(project.status)) {
    throwError('Only Draft, Rejected, or Revision Requested projects can be renamed', 403);
  }

  if (project.name === name.trim()) {
    return res.json(project);
  }

  await ensureUniqueProjectName(name.trim(), req.user.id, project._id);

  const previousName = project.name;
  project.name = name.trim();

  project.auditLogs.push({
    action: 'renamed',
    performedBy: req.user.id,
    previousStatus: project.status,
    newStatus: project.status,
    comment: `Renamed from "${previousName}" to "${name.trim()}"`,
  });

  await project.save();

  res.json(project);
});

/* =========================================================
   UPDATE PROJECT (DRAFT, REJECTED, OR REVISION REQUESTED)
--------------------------------------------------------- */
export const updateProject = asyncHandler(async (req, res) => {
  const { name, description, chartType, forecastDate } = req.body;

  const project = await ensureProjectExists(req.params.id, req.user.id);

  if (!canEditProjectStatus(project.status)) {
    throwError('Only Draft, Rejected, or Revision Requested projects can be edited', 400);
  }

  if (!name || !chartType || !forecastDate) {
    throwError('All fields are required', 400);
  }

  await ensureUniqueProjectName(name, req.user.id, project._id);

  project.name = name.trim();
  project.description = description?.trim() || '';
  project.chartType = chartType.trim();
  project.forecastDate = forecastDate;

  project.auditLogs.push({
    action: 'edited',
    performedBy: req.user.id,
    previousStatus: project.status,
    newStatus: project.status,
    comment: 'Project edited',
  });

  await project.save();

  res.json(project);
});

/* =========================================================
   SUBMIT PROJECT (OWNER)
--------------------------------------------------------- */
export const submitProject = asyncHandler(async (req, res) => {
  const project = await ensureProjectExists(req.params.id, req.user.id);

  if (!canTransitionProjectStatus(project.status, PROJECT_STATUS.SUBMITTED)) {
    throwError('Invalid status transition', 400);
  }

  const previousStatus = project.status;
  const expectedUpdatedAt = project.updatedAt;
  await createProjectVersionSnapshot(
    project,
    req.user.id,
    previousStatus === PROJECT_STATUS.REVISION_REQUESTED ? 'resubmit' : 'submit'
  );

  project.status = PROJECT_STATUS.SUBMITTED;
  project.submittedAt = new Date();

  project.auditLogs.push({
    action: 'submitted',
    performedBy: req.user.id,
    previousStatus,
    newStatus: PROJECT_STATUS.SUBMITTED,
    comment:
      previousStatus === PROJECT_STATUS.REVISION_REQUESTED
        ? 'Revision resubmitted for review'
        : 'Submitted for review',
  });

  await saveProjectSnapshot(project, {
    expectedStatus: previousStatus,
    expectedUpdatedAt,
    conflictMessage:
      'Project workflow changed while this operation was in progress. Reload and try again.',
  });

  res.json(project);
});

/* =========================================================
   START PROJECT REVIEW (ADMIN)
--------------------------------------------------------- */
export const startReviewProject = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throwError('Admin access required', 403);
  }

  const project = await Project.findById(req.params.id);
  if (!project) throwError('Project not found', 404);

  if (project.status === PROJECT_STATUS.UNDER_REVIEW) {
    return sendProject(project, res);
  }

  if (!canTransitionProjectStatus(project.status, PROJECT_STATUS.UNDER_REVIEW)) {
    throwError('Invalid status transition', 400);
  }

  const previousStatus = project.status;
  const expectedUpdatedAt = project.updatedAt;
  project.status = PROJECT_STATUS.UNDER_REVIEW;
  project.reviewStartedAt = new Date();
  project.reviewStartedBy = req.user.id;

  project.auditLogs.push({
    action: 'review_started',
    performedBy: req.user.id,
    previousStatus,
    newStatus: PROJECT_STATUS.UNDER_REVIEW,
    comment: 'Project review started',
  });

  await saveProjectSnapshot(project, {
    expectedStatus: previousStatus,
    expectedUpdatedAt,
    conflictMessage:
      'Project workflow changed while this operation was in progress. Reload and try again.',
  });

  return sendProject(project, res);
});

/* =========================================================
   ADD REVIEW COMMENT (ADMIN)
--------------------------------------------------------- */
export const addReviewComment = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throwError('Admin access required', 403);
  }

  const comment = getRequiredComment(req.body?.comment);
  const project = await Project.findById(req.params.id);
  if (!project) throwError('Project not found', 404);

  if (!canAddReviewCommentStatus(project.status)) {
    throwError('Comments can only be added while a project is submitted or under review', 400);
  }

  project.auditLogs.push({
    action: 'comment_added',
    performedBy: req.user.id,
    previousStatus: project.status,
    newStatus: project.status,
    comment,
  });

  await project.save();
  await notifyProjectOwner(project, req.user.id, 'comment_added', comment);
  return sendProject(project, res);
});

/* =========================================================
   REQUEST REVISION (ADMIN)
--------------------------------------------------------- */
export const requestProjectRevision = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throwError('Admin access required', 403);
  }

  const comment = getRequiredComment(req.body?.comment, 'Revision comment');
  const project = await Project.findById(req.params.id);
  if (!project) throwError('Project not found', 404);

  if (!canTransitionProjectStatus(project.status, PROJECT_STATUS.REVISION_REQUESTED)) {
    throwError('Invalid status transition', 400);
  }

  const previousStatus = project.status;
  const expectedUpdatedAt = project.updatedAt;

  if (getLatestVersionReason(project) !== 'revision_baseline') {
    await createProjectVersionSnapshot(project, req.user.id, 'revision_baseline');
  }

  project.status = PROJECT_STATUS.REVISION_REQUESTED;
  project.rejectedBy = undefined;
  project.reviewComment = comment;
  project.reviewedAt = new Date();

  project.auditLogs.push({
    action: 'revision_requested',
    performedBy: req.user.id,
    previousStatus,
    newStatus: PROJECT_STATUS.REVISION_REQUESTED,
    comment,
  });

  await saveProjectSnapshot(project, {
    expectedStatus: previousStatus,
    expectedUpdatedAt,
    conflictMessage:
      'Project workflow changed while this operation was in progress. Reload and try again.',
  });
  await notifyProjectOwner(project, req.user.id, 'revision_requested', comment);
  return sendProject(project, res);
});

/* =========================================================
   APPROVE PROJECT (ADMIN)
--------------------------------------------------------- */
export const approveProject = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throwError('Admin access required', 403);
  }

  const project = await Project.findById(req.params.id);
  if (!project) throwError('Project not found', 404);

  if (!canTransitionProjectStatus(project.status, PROJECT_STATUS.APPROVED)) {
    throwError('Invalid status transition', 400);
  }

  if (project.owner.toString() === req.user.id) {
    throwError('You cannot approve your own project', 400);
  }

  const previousStatus = project.status;
  const expectedUpdatedAt = project.updatedAt;
  project.status = PROJECT_STATUS.APPROVED;
  project.reviewedAt = new Date();
  project.approvedBy = req.user.id;

  project.auditLogs.push({
    action: 'approved',
    performedBy: req.user.id,
    previousStatus,
    newStatus: PROJECT_STATUS.APPROVED,
    comment: 'Project approved',
  });

  await saveProjectSnapshot(project, {
    expectedStatus: previousStatus,
    expectedUpdatedAt,
    conflictMessage:
      'Project workflow changed while this operation was in progress. Reload and try again.',
  });
  await notifyProjectOwner(project, req.user.id, 'approved');

  return sendProject(project, res);
});

/* =========================================================
   REJECT PROJECT (ADMIN)
--------------------------------------------------------- */
export const rejectProject = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throwError('Admin access required', 403);
  }

  const comment = getRequiredComment(req.body?.comment, 'Rejection comment');

  const project = await Project.findById(req.params.id);
  if (!project) throwError('Project not found', 404);

  if (!canTransitionProjectStatus(project.status, PROJECT_STATUS.REJECTED)) {
    throwError('Invalid status transition', 400);
  }

  const previousStatus = project.status;
  const expectedUpdatedAt = project.updatedAt;
  project.status = PROJECT_STATUS.REJECTED;
  project.rejectedBy = req.user.id;
  project.reviewComment = comment;
  project.reviewedAt = new Date();

  project.auditLogs.push({
    action: 'rejected',
    performedBy: req.user.id,
    previousStatus,
    newStatus: PROJECT_STATUS.REJECTED,
    comment,
  });

  await saveProjectSnapshot(project, {
    expectedStatus: previousStatus,
    expectedUpdatedAt,
    conflictMessage:
      'Project workflow changed while this operation was in progress. Reload and try again.',
  });
  await notifyProjectOwner(project, req.user.id, 'rejected', comment);

  return sendProject(project, res);
});

/* =========================================================
   MARK NO PUBLICATION (ADMIN)
--------------------------------------------------------- */
export const markProjectNoPublication = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throwError('Admin access required', 403);
  }

  const { reason, notes, comment } = getNoPublicationPayload(req.body);
  const project = await Project.findById(req.params.id);
  if (!project) throwError('Project not found', 404);

  if (!canTransitionProjectStatus(project.status, PROJECT_STATUS.NO_PUBLICATION)) {
    throwError('Invalid status transition', 400);
  }

  const previousStatus = project.status;
  const expectedUpdatedAt = project.updatedAt;
  project.status = PROJECT_STATUS.NO_PUBLICATION;
  project.noPublicationAt = new Date();
  project.noPublicationBy = req.user.id;
  project.noPublicationReason = reason;
  project.noPublicationNotes = notes;
  project.reviewComment = comment;
  project.reviewedAt = new Date();

  project.auditLogs.push({
    action: 'marked_no_publication',
    performedBy: req.user.id,
    previousStatus,
    newStatus: PROJECT_STATUS.NO_PUBLICATION,
    comment,
  });

  await saveProjectSnapshot(project, {
    expectedStatus: previousStatus,
    expectedUpdatedAt,
    conflictMessage:
      'Project workflow changed while this operation was in progress. Reload and try again.',
  });
  await notifyProjectOwner(project, req.user.id, 'marked_no_publication', comment);

  return sendProject(project, res);
});

/* =========================================================
   PUBLISH PROJECT (ADMIN)
--------------------------------------------------------- */
export const publishProject = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throwError('Admin access required', 403);
  }

  const project = await Project.findById(req.params.id);
  if (!project) throwError('Project not found', 404);

  if (!canTransitionProjectStatus(project.status, PROJECT_STATUS.PUBLISHED)) {
    throwError('Invalid status transition', 400);
  }

  const previousStatus = project.status;
  const expectedUpdatedAt = project.updatedAt;

  if (getLatestVersionReason(project) !== 'publish') {
    await createProjectVersionSnapshot(project, req.user.id, 'publish');
  }

  project.status = PROJECT_STATUS.PUBLISHED;
  project.publishedAt = new Date();

  project.auditLogs.push({
    action: 'published',
    performedBy: req.user.id,
    previousStatus,
    newStatus: PROJECT_STATUS.PUBLISHED,
    comment: 'Project published',
  });

  await saveProjectSnapshot(project, {
    expectedStatus: previousStatus,
    expectedUpdatedAt,
    conflictMessage:
      'Project workflow changed while this operation was in progress. Reload and try again.',
  });
  await notifyProjectOwner(project, req.user.id, 'published');

  return sendProject(project, res);
});

/* =========================================================
   DELETE PROJECT
--------------------------------------------------------- */
export const deleteProject = asyncHandler(async (req, res) => {
  const deletedFeaturesCount = await deleteProjectAndFeatures(req.params.id, req.user.id);

  res.json({
    message: 'Project and related features deleted successfully',
    deletedFeatures: deletedFeaturesCount,
  });
});

/* =========================================================
   ARCHIVE PROJECT (ADMIN)
--------------------------------------------------------- */
export const archiveProject = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throwError('Admin access required', 403);
  }

  const project = await Project.findById(req.params.id);
  if (!project) throwError('Project not found', 404);

  if (!canTransitionProjectStatus(project.status, PROJECT_STATUS.ARCHIVED)) {
    throwError('Only published or no-publication projects can be archived', 400);
  }

  const previousStatus = project.status;
  const expectedUpdatedAt = project.updatedAt;
  project.status = PROJECT_STATUS.ARCHIVED;

  project.auditLogs.push({
    action: 'archived',
    performedBy: req.user.id,
    previousStatus,
    newStatus: PROJECT_STATUS.ARCHIVED,
    comment: 'Project archived',
  });

  await saveProjectSnapshot(project, {
    expectedStatus: previousStatus,
    expectedUpdatedAt,
    conflictMessage:
      'Project workflow changed while this operation was in progress. Reload and try again.',
  });

  return sendProject(project, res);
});
