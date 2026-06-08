import asyncHandler from '../../utils/asyncHandler.js';
import { ProjectWorkflowService } from '../../services/project/projectWorkflowService.js';
import { ProjectQueryService } from '../../services/project/projectQueryService.js';
import { throwError } from '../../utils/errorHelper.js';
import Project from '../../models/Project.js';
import { PROJECT_STATUS } from '../../constants/projectWorkflowConstants.js';

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

export const getAllProjectsForAdmin =
  asyncHandler(async (req, res) => {
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
      .populate('reviewStartedBy', 'firstName lastName email username')
      .populate('approvedBy', 'firstName lastName email username')
      .populate('rejectedBy', 'firstName lastName email username')
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

// ─── START REVIEW ─────────────────────────────────────────────────────────────

export const startReviewProject =
  asyncHandler(async (req, res) => {
    requireAdmin(req.user);

    await ProjectWorkflowService.startReview(
      req.params.id,
      req.user.id
    );

    const response =
      await ProjectQueryService.getProjectWithCharts(
        req.params.id
      );

    res.json(response);
  });

// ─── ADD REVIEW COMMENT ───────────────────────────────────────────────────────

export const addReviewComment =
  asyncHandler(async (req, res) => {
    requireAdmin(req.user);

    await ProjectWorkflowService.addComment(
      req.params.id,
      req.user.id,
      req.body.comment
    );

    const response =
      await ProjectQueryService.getProjectWithCharts(
        req.params.id
      );

    res.json(response);
  });

// ─── REQUEST REVISION ─────────────────────────────────────────────────────────

export const requestProjectRevision =
  asyncHandler(async (req, res) => {
    requireAdmin(req.user);

    await ProjectWorkflowService.requestRevision(
      req.params.id,
      req.user.id,
      req.body.comment
    );

    const response =
      await ProjectQueryService.getProjectWithCharts(
        req.params.id
      );

    res.json(response);
  });

// ─── APPROVE ──────────────────────────────────────────────────────────────────

export const approveProject =
  asyncHandler(async (req, res) => {
    requireAdmin(req.user);

    await ProjectWorkflowService.approve(
      req.params.id,
      req.user.id
    );

    const response =
      await ProjectQueryService.getProjectWithCharts(
        req.params.id
      );

    res.json(response);
  });

// ─── REJECT ───────────────────────────────────────────────────────────────────

export const rejectProject =
  asyncHandler(async (req, res) => {
    requireAdmin(req.user);

    await ProjectWorkflowService.reject(
      req.params.id,
      req.user.id,
      req.body.comment
    );

    const response =
      await ProjectQueryService.getProjectWithCharts(
        req.params.id
      );

    res.json(response);
  });

// ─── PUBLISH ──────────────────────────────────────────────────────────────────

export const publishProject =
  asyncHandler(async (req, res) => {
    requireAdmin(req.user);

    await ProjectWorkflowService.publish(
      req.params.id,
      req.user.id
    );

    const response =
      await ProjectQueryService.getProjectWithCharts(
        req.params.id
      );

    res.json(response);
  });

// ─── ARCHIVE ──────────────────────────────────────────────────────────────────

export const archiveProject =
  asyncHandler(async (req, res) => {
    requireAdmin(req.user);

    await ProjectWorkflowService.archive(
      req.params.id,
      req.user.id
    );

    const response =
      await ProjectQueryService.getProjectWithCharts(
        req.params.id
      );

    res.json(response);
  });