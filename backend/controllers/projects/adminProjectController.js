import asyncHandler from '../../utils/asyncHandler.js';
import { throwError } from '../../utils/errorHelper.js';
import Project from '../../models/Project.js';
import {
  PROJECT_STATUS,
  canAddReviewCommentStatus,
  canTransitionProjectStatus,
} from '../../utils/projectWorkflow.js';
import {
  getRequiredComment,
  getLatestVersionReason,
  createProjectVersionSnapshot,
  getProjectForAdmin,
  sendProject,
  notifyProjectOwner,
} from './projectHelpers.js';

// ─── Guard ────────────────────────────────────────────────────────────────────

function requireAdmin(user) {
  if (user?.role !== 'admin') throwError('Admin access required', 403);
}

// ─── GET ALL PROJECTS ─────────────────────────────────────────────────────────

const ALLOWED_ADMIN_STATUSES = [
  PROJECT_STATUS.SUBMITTED,
  PROJECT_STATUS.UNDER_REVIEW,
  PROJECT_STATUS.REVISION_REQUESTED,
  PROJECT_STATUS.APPROVED,
  PROJECT_STATUS.PUBLISHED,
  PROJECT_STATUS.REJECTED,
  PROJECT_STATUS.ARCHIVED,
];

export const getAllProjectsForAdmin = asyncHandler(async (req, res) => {
  requireAdmin(req.user);

  const { status } = req.query;
  const filter = { status: { $in: ALLOWED_ADMIN_STATUSES } };

  if (status) {
    if (!ALLOWED_ADMIN_STATUSES.includes(status)) {
      throwError('Invalid or unauthorized status filter', 400);
    }
    filter.status = status;
  }

  const projects = await Project.find(filter)
    .populate('owner', 'firstName lastName email username')
    .populate('charts')
    .populate('reviewStartedBy', 'firstName lastName email username')
    .populate('approvedBy', 'firstName lastName email username')
    .populate('rejectedBy', 'firstName lastName email username')
    .populate('auditLogs.performedBy', 'firstName lastName email username')
    .sort({ lastOpenedAt: -1, updatedAt: -1, submittedAt: -1, createdAt: -1 })
    .lean();

  res.json(projects);
});

// ─── START REVIEW ─────────────────────────────────────────────────────────────

export const startReviewProject = asyncHandler(async (req, res) => {
  requireAdmin(req.user);

  const project = await getProjectForAdmin(req.params.id, req.user.id);

  // Idempotent — already under review
  if (project.status === PROJECT_STATUS.UNDER_REVIEW) return sendProject(project, res);

  if (!canTransitionProjectStatus(project.status, PROJECT_STATUS.UNDER_REVIEW)) {
    throwError('Invalid status transition', 400);
  }

  const previousStatus = project.status;
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

  await project.save();
  return sendProject(project, res);
});

// ─── ADD REVIEW COMMENT ───────────────────────────────────────────────────────

export const addReviewComment = asyncHandler(async (req, res) => {
  requireAdmin(req.user);

  const comment = getRequiredComment(req.body?.comment);
  const project = await getProjectForAdmin(req.params.id, req.user.id);

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

// ─── REQUEST REVISION ─────────────────────────────────────────────────────────

export const requestProjectRevision = asyncHandler(async (req, res) => {
  requireAdmin(req.user);

  const comment = getRequiredComment(req.body?.comment, 'Revision comment');
  const project = await getProjectForAdmin(req.params.id, req.user.id);

  if (!canTransitionProjectStatus(project.status, PROJECT_STATUS.REVISION_REQUESTED)) {
    throwError('Invalid status transition', 400);
  }

  const previousStatus = project.status;
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

  await project.save();
  await notifyProjectOwner(project, req.user.id, 'revision_requested', comment);
  return sendProject(project, res);
});

// ─── APPROVE ──────────────────────────────────────────────────────────────────

export const approveProject = asyncHandler(async (req, res) => {
  requireAdmin(req.user);

  const project = await getProjectForAdmin(req.params.id, req.user.id);

  if (!canTransitionProjectStatus(project.status, PROJECT_STATUS.APPROVED)) {
    throwError('Invalid status transition', 400);
  }

  const previousStatus = project.status;
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

  await project.save();
  await notifyProjectOwner(project, req.user.id, 'approved');
  return sendProject(project, res);
});

// ─── REJECT ───────────────────────────────────────────────────────────────────

export const rejectProject = asyncHandler(async (req, res) => {
  requireAdmin(req.user);

  const comment = getRequiredComment(req.body?.comment, 'Rejection comment');
  const project = await getProjectForAdmin(req.params.id, req.user.id);

  if (!canTransitionProjectStatus(project.status, PROJECT_STATUS.REJECTED)) {
    throwError('Invalid status transition', 400);
  }

  const previousStatus = project.status;
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

  await project.save();
  await notifyProjectOwner(project, req.user.id, 'rejected', comment);
  return sendProject(project, res);
});

// ─── PUBLISH ──────────────────────────────────────────────────────────────────

export const publishProject = asyncHandler(async (req, res) => {
  requireAdmin(req.user);

  const project = await getProjectForAdmin(req.params.id, req.user.id);

  if (!canTransitionProjectStatus(project.status, PROJECT_STATUS.PUBLISHED)) {
    throwError('Invalid status transition', 400);
  }

  const previousStatus = project.status;
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

  await project.save();
  await notifyProjectOwner(project, req.user.id, 'published');
  return sendProject(project, res);
});

// ─── ARCHIVE ──────────────────────────────────────────────────────────────────

export const archiveProject = asyncHandler(async (req, res) => {
  requireAdmin(req.user);

  const project = await getProjectForAdmin(req.params.id, req.user.id);

  if (!canTransitionProjectStatus(project.status, PROJECT_STATUS.ARCHIVED)) {
    throwError('Only published projects can be archived', 400);
  }

  const previousStatus = project.status;
  project.status = PROJECT_STATUS.ARCHIVED;
  project.auditLogs.push({
    action: 'archived',
    performedBy: req.user.id,
    previousStatus,
    newStatus: PROJECT_STATUS.ARCHIVED,
    comment: 'Project archived',
  });

  await project.save();
  return sendProject(project, res);
});