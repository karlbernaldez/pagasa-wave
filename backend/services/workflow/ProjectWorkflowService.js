import {
  PROJECT_STATUS,
  canTransitionProjectStatus,
} from '../../utils/projectWorkflow.js';

export default class ProjectWorkflowService {
  static assertTransition(currentStatus, nextStatus) {
    if (!canTransitionProjectStatus(currentStatus, nextStatus)) {
      throw new Error(`Invalid workflow transition: ${currentStatus} -> ${nextStatus}`);
    }
  }

  static transition(project, nextStatus, { action, actorId, comment = '' } = {}) {
    const previousStatus = project.status;

    this.assertTransition(previousStatus, nextStatus);

    project.status = nextStatus;

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

  static submit(project, actorId) {
    return this.transition(project, PROJECT_STATUS.SUBMITTED, {
      action: 'submitted',
      actorId,
    });
  }

  static startReview(project, actorId) {
    return this.transition(project, PROJECT_STATUS.UNDER_REVIEW, {
      action: 'review_started',
      actorId,
    });
  }

  static requestRevision(project, actorId, comment = '') {
    return this.transition(project, PROJECT_STATUS.REVISION_REQUESTED, {
      action: 'revision_requested',
      actorId,
      comment,
    });
  }

  static approve(project, actorId) {
    return this.transition(project, PROJECT_STATUS.APPROVED, {
      action: 'approved',
      actorId,
    });
  }

  static reject(project, actorId, comment = '') {
    return this.transition(project, PROJECT_STATUS.REJECTED, {
      action: 'rejected',
      actorId,
      comment,
    });
  }

  static publish(project, actorId) {
    return this.transition(project, PROJECT_STATUS.PUBLISHED, {
      action: 'published',
      actorId,
    });
  }

  static archive(project, actorId) {
    return this.transition(project, PROJECT_STATUS.ARCHIVED, {
      action: 'archived',
      actorId,
    });
  }
}
