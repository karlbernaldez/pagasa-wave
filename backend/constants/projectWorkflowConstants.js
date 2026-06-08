export const PROJECT_STATUS =
  Object.freeze({
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

export const STATUS_LABELS =
  Object.freeze({
    draft: 'Draft',
    submitted: 'Submitted',
    under_review: 'Under Review',
    revision_requested:
      'Revision Requested',
    approved: 'Approved',
    rejected: 'Rejected',
    published: 'Published',
    archived: 'Archived',
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

export const REVIEW_COMMENTABLE_STATUSES =
  Object.freeze([
    PROJECT_STATUS.SUBMITTED,
    PROJECT_STATUS.UNDER_REVIEW,
  ]);