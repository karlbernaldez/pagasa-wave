import {
  PROJECT_STATUS,
  canTransitionProjectStatus,
} from '../../utils/projectWorkflow.js';

import { throwError }
  from '../../utils/errorHelper.js';

export default class ProjectWorkflowPolicy {
  static assertTransition(
    currentStatus,
    nextStatus
  ) {
    if (
      !canTransitionProjectStatus(
        currentStatus,
        nextStatus
      )
    ) {
      throwError(
        `Invalid workflow transition: ${currentStatus} -> ${nextStatus}`,
        400
      );
    }
  }

  static transition(
    project,
    nextStatus,
    options = {}
  ) {
    const {
      action,
      actorId,
      comment = '',
      metadata = {},
    } = options;

    const previousStatus =
      project.status;

    this.assertTransition(
      previousStatus,
      nextStatus
    );

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

    if (
      Array.isArray(
        project.auditLogs
      )
    ) {
      project.auditLogs.push({
        action,
        performedBy: actorId,
        previousStatus,
        newStatus: nextStatus,
        comment,
      });
    }

    return project;
  }

  /* =====================================================
     WORKFLOW TRANSITIONS
  ===================================================== */

  static submit(
    project,
    actorId,
    metadata = {}
  ) {
    return this.transition(
      project,
      PROJECT_STATUS.SUBMITTED,
      {
        action: 'submitted',
        actorId,
        metadata,
      }
    );
  }

  static startReview(
    project,
    actorId,
    metadata = {}
  ) {
    return this.transition(
      project,
      PROJECT_STATUS.UNDER_REVIEW,
      {
        action: 'review_started',
        actorId,
        metadata,
      }
    );
  }

  static requestRevision(
    project,
    actorId,
    comment = '',
    metadata = {}
  ) {
    return this.transition(
      project,
      PROJECT_STATUS.REVISION_REQUESTED,
      {
        action:
          'revision_requested',
        actorId,
        comment,
        metadata,
      }
    );
  }

  static approve(
    project,
    actorId,
    metadata = {}
  ) {
    return this.transition(
      project,
      PROJECT_STATUS.APPROVED,
      {
        action: 'approved',
        actorId,
        metadata,
      }
    );
  }

  static reject(
    project,
    actorId,
    comment = '',
    metadata = {}
  ) {
    return this.transition(
      project,
      PROJECT_STATUS.REJECTED,
      {
        action: 'rejected',
        actorId,
        comment,
        metadata,
      }
    );
  }

  static publish(
    project,
    actorId,
    metadata = {}
  ) {
    return this.transition(
      project,
      PROJECT_STATUS.PUBLISHED,
      {
        action: 'published',
        actorId,
        metadata,
      }
    );
  }

  static archive(
    project,
    actorId,
    metadata = {}
  ) {
    return this.transition(
      project,
      PROJECT_STATUS.ARCHIVED,
      {
        action: 'archived',
        actorId,
        metadata,
      }
    );
  }

  /* =====================================================
     NON-TRANSITION ACTIONS
  ===================================================== */

  static addComment(
    project,
    actorId,
    comment = ''
  ) {
    const allowedStatuses = [
      PROJECT_STATUS.SUBMITTED,
      PROJECT_STATUS.UNDER_REVIEW,
    ];

    if (
      !allowedStatuses.includes(
        project.status
      )
    ) {
      throwError(
        'Comments can only be added to submitted or under review projects',
        400
      );
    }

    if (Array.isArray(project.auditLogs)) {
      project.auditLogs.push({
        action: 'comment_added',
        performedBy: actorId,
        previousStatus: project.status,
        newStatus: project.status,
        comment,
      });
    }

    return project;
  }
}