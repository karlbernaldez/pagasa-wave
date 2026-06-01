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

  static submit(project) {
    this.assertTransition(project.status, PROJECT_STATUS.SUBMITTED);
    return PROJECT_STATUS.SUBMITTED;
  }

  static startReview(project) {
    this.assertTransition(project.status, PROJECT_STATUS.UNDER_REVIEW);
    return PROJECT_STATUS.UNDER_REVIEW;
  }

  static requestRevision(project) {
    this.assertTransition(project.status, PROJECT_STATUS.REVISION_REQUESTED);
    return PROJECT_STATUS.REVISION_REQUESTED;
  }

  static approve(project) {
    this.assertTransition(project.status, PROJECT_STATUS.APPROVED);
    return PROJECT_STATUS.APPROVED;
  }

  static reject(project) {
    this.assertTransition(project.status, PROJECT_STATUS.REJECTED);
    return PROJECT_STATUS.REJECTED;
  }

  static publish(project) {
    this.assertTransition(project.status, PROJECT_STATUS.PUBLISHED);
    return PROJECT_STATUS.PUBLISHED;
  }

  static archive(project) {
    this.assertTransition(project.status, PROJECT_STATUS.ARCHIVED);
    return PROJECT_STATUS.ARCHIVED;
  }
}
