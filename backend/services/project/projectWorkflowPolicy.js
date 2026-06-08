import {
  PROJECT_STATUS,
  canTransitionProjectStatus,
} from '../../utils/projectWorkflow.js';

const allowedFields = [
  'submittedAt',
  'reviewStartedAt',
  'reviewStartedBy',
  'reviewedAt',
  'approvedBy',
  'rejectedBy',
  'publishedAt',
  'reviewComment',
];

export default class ProjectWorkflowService {
  static assertTransition(currentStatus, nextStatus) {
    if (!canTransitionProjectStatus(currentStatus, nextStatus)) {
      throw new Error(`Invalid workflow transition: ${currentStatus} -> ${nextStatus}`);
    }
  }

  static transition(project, nextStatus, options = {}) {
    const {
      action,
      actorId,
      comment = '',
      metadata = {},
    } = options;

    const previousStatus = project.status;

    this.assertTransition(previousStatus, nextStatus);

    project.status = nextStatus;

    const allowedFields = [
      'submittedAt',
      'reviewStartedAt',
      'reviewStartedBy',
      'reviewedAt',
      'approvedBy',
      'rejectedBy',
      'publishedAt',
      'reviewComment',
    ];

    for (const field of allowedFields) {
      if (field in metadata) {
        project[field] =
          metadata[field];
      }
    }

    if (Array.isArray(project.auditLogs)) {
      project.auditLogs.push({
        action,
        performedBy: actorId,
        previousStatus,
        newStatus: nextStatus,
        comment,
        timestamp: new Date(),
      });
    }

    return project;
  }

  static submit(project, actorId, metadata = {}) {
    return this.transition(project, PROJECT_STATUS.SUBMITTED, {
      action: 'submitted',
      actorId,
      metadata,
    });
  }

  static startReview(project, actorId, metadata = {}) {
    return this.transition(project, PROJECT_STATUS.UNDER_REVIEW, {
      action: 'review_started',
      actorId,
      metadata,
    });
  }

  static requestRevision(project, actorId, comment = '', metadata = {}) {
    return this.transition(project, PROJECT_STATUS.REVISION_REQUESTED, {
      action: 'revision_requested',
      actorId,
      comment,
      metadata,
    });
  }

  static approve(project, actorId, metadata = {}) {
    return this.transition(project, PROJECT_STATUS.APPROVED, {
      action: 'approved',
      actorId,
      metadata,
    });
  }

  static reject(project, actorId, comment = '', metadata = {}) {
    return this.transition(project, PROJECT_STATUS.REJECTED, {
      action: 'rejected',
      actorId,
      comment,
      metadata,
    });
  }

  static publish(project, actorId, metadata = {}) {
    return this.transition(project, PROJECT_STATUS.PUBLISHED, {
      action: 'published',
      actorId,
      metadata,
    });
  }

  static archive(project, actorId, metadata = {}) {
    return this.transition(project, PROJECT_STATUS.ARCHIVED, {
      action: 'archived',
      actorId,
      metadata,
    });
  }
}
