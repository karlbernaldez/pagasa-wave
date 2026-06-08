import {
  ALLOWED_PROJECT_TRANSITIONS,
  EDITABLE_PROJECT_STATUSES,
  REVIEW_COMMENTABLE_STATUSES,
  STATUS_LABELS,
} from '../constants/projectWorkflowConstants.js';

export function canTransitionProjectStatus(
  fromStatus,
  toStatus
) {
  return Boolean(
    ALLOWED_PROJECT_TRANSITIONS[
      fromStatus
    ]?.includes(
      toStatus
    )
  );
}

export function canEditProjectStatus(
  status
) {
  return EDITABLE_PROJECT_STATUSES.includes(
    status
  );
}

export function canAddReviewCommentStatus(
  status
) {
  return REVIEW_COMMENTABLE_STATUSES.includes(
    status
  );
}

export function getStatusLabel(
  status
) {
  return (
    STATUS_LABELS[
      status
    ] || status
  );
}

export function getProjectEditLockMessage(
  status
) {
  return `Project is ${getStatusLabel(
    status
  )}. Editing is locked unless the project is Draft, Rejected, or Revision Requested.`;
}