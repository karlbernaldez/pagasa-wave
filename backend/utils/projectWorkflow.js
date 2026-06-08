export const PROJECT_STATUS = Object.freeze({
  DRAFT: 'draft',

  SUBMITTED: 'submitted',

  UNDER_REVIEW: 'under_review',

  REVISION_REQUESTED:
    'revision_requested',

  APPROVED: 'approved',

  REJECTED: 'rejected',

  PUBLISHED: 'published',

  ARCHIVED: 'archived',
});

export const ALLOWED_PROJECT_TRANSITIONS =
  Object.freeze({
    [PROJECT_STATUS.DRAFT]: [
      PROJECT_STATUS.SUBMITTED,
    ],

    [PROJECT_STATUS.SUBMITTED]: [
      PROJECT_STATUS.UNDER_REVIEW,
    ],

    [PROJECT_STATUS.UNDER_REVIEW]: [
      PROJECT_STATUS.REVISION_REQUESTED,
      PROJECT_STATUS.APPROVED,
      PROJECT_STATUS.REJECTED,
    ],

    [PROJECT_STATUS.REVISION_REQUESTED]: [
      PROJECT_STATUS.SUBMITTED,
    ],

    [PROJECT_STATUS.APPROVED]: [
      PROJECT_STATUS.PUBLISHED,
    ],

    [PROJECT_STATUS.REJECTED]: [
      PROJECT_STATUS.DRAFT,
    ],

    [PROJECT_STATUS.PUBLISHED]: [
      PROJECT_STATUS.ARCHIVED,
    ],
  });

export const EDITABLE_PROJECT_STATUSES =
  Object.freeze([
    PROJECT_STATUS.DRAFT,
    PROJECT_STATUS.REJECTED,
    PROJECT_STATUS.REVISION_REQUESTED,
  ]);

export const REVIEW_COMMENTABLE_STATUSES = Object.freeze([
  PROJECT_STATUS.SUBMITTED,
  PROJECT_STATUS.UNDER_REVIEW,
]);

export function canTransitionProjectStatus(fromStatus, toStatus) {
  return Boolean(ALLOWED_PROJECT_TRANSITIONS[fromStatus]?.includes(toStatus));
}

export function canEditProjectStatus(status) {
  return EDITABLE_PROJECT_STATUSES.includes(status);
}

export function canAddReviewCommentStatus(status) {
  return REVIEW_COMMENTABLE_STATUSES.includes(status);
}

export function getProjectEditLockMessage(status) {
  return `Project is ${status}. Editing is locked unless the project is Draft, Rejected, or Revision Requested.`;
}
