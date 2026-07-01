export const PROJECT_STATUS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  REVISION_REQUESTED: 'Revision Requested',
  APPROVED: 'Approved',
  PUBLISHED: 'Published',
  REJECTED: 'Rejected',
  NO_PUBLICATION: 'No Publication',
  ARCHIVED: 'Archived',
};

export const PROJECT_STATUS_LABEL = {
  [PROJECT_STATUS.DRAFT]: 'Draft',
  [PROJECT_STATUS.SUBMITTED]: 'Submitted',
  [PROJECT_STATUS.UNDER_REVIEW]: 'Under Review',
  [PROJECT_STATUS.REVISION_REQUESTED]: 'Revision Requested',
  [PROJECT_STATUS.APPROVED]: 'Approved',
  [PROJECT_STATUS.PUBLISHED]: 'Published',
  [PROJECT_STATUS.REJECTED]: 'Rejected',
  [PROJECT_STATUS.NO_PUBLICATION]: 'No Publication',
  [PROJECT_STATUS.ARCHIVED]: 'Archived',
};

export const PROJECT_STATUS_STYLE = {
  [PROJECT_STATUS.DRAFT]: 'bg-slate-100 text-slate-700 border-slate-300',
  [PROJECT_STATUS.SUBMITTED]: 'bg-sky-100 text-sky-800 border-sky-300',
  [PROJECT_STATUS.UNDER_REVIEW]: 'bg-violet-100 text-violet-800 border-violet-300',
  [PROJECT_STATUS.REVISION_REQUESTED]: 'bg-orange-100 text-orange-800 border-orange-300',
  [PROJECT_STATUS.APPROVED]: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  [PROJECT_STATUS.PUBLISHED]: 'bg-teal-100 text-teal-800 border-teal-300',
  [PROJECT_STATUS.REJECTED]: 'bg-rose-100 text-rose-800 border-rose-300',
  [PROJECT_STATUS.NO_PUBLICATION]: 'bg-amber-100 text-amber-900 border-amber-300',
  [PROJECT_STATUS.ARCHIVED]: 'bg-zinc-100 text-zinc-600 border-zinc-300',
};

const STATUS_ALIASES = {
  draft: PROJECT_STATUS.DRAFT,
  submitted: PROJECT_STATUS.SUBMITTED,
  underreview: PROJECT_STATUS.UNDER_REVIEW,
  under_review: PROJECT_STATUS.UNDER_REVIEW,
  review: PROJECT_STATUS.UNDER_REVIEW,
  inreview: PROJECT_STATUS.UNDER_REVIEW,
  in_review: PROJECT_STATUS.UNDER_REVIEW,
  revisionrequested: PROJECT_STATUS.REVISION_REQUESTED,
  revision_requested: PROJECT_STATUS.REVISION_REQUESTED,
  needsrevision: PROJECT_STATUS.REVISION_REQUESTED,
  needs_revision: PROJECT_STATUS.REVISION_REQUESTED,
  approved: PROJECT_STATUS.APPROVED,
  published: PROJECT_STATUS.PUBLISHED,
  rejected: PROJECT_STATUS.REJECTED,
  nopublication: PROJECT_STATUS.NO_PUBLICATION,
  no_publication: PROJECT_STATUS.NO_PUBLICATION,
  operationalexception: PROJECT_STATUS.NO_PUBLICATION,
  operational_exception: PROJECT_STATUS.NO_PUBLICATION,
  archived: PROJECT_STATUS.ARCHIVED,
};

function getStatusKeys(value) {
  const raw = String(value || '').trim().toLowerCase();

  return [
    raw,
    raw.replace(/[\s-]+/g, ''),
    raw.replace(/[\s-]+/g, '_'),
  ];
}

export function normalizeProjectStatus(status, fallback = PROJECT_STATUS.DRAFT) {
  for (const key of getStatusKeys(status)) {
    if (STATUS_ALIASES[key]) return STATUS_ALIASES[key];
  }

  return String(status || '').trim() || fallback;
}

export function getProjectStatusLabel(status) {
  const normalizedStatus = normalizeProjectStatus(status);
  return PROJECT_STATUS_LABEL[normalizedStatus] || normalizedStatus;
}

export function getProjectStatusStyle(status) {
  const normalizedStatus = normalizeProjectStatus(status);
  return PROJECT_STATUS_STYLE[normalizedStatus] || 'bg-sky-100 text-sky-800 border-sky-300';
}

export function isProjectSubmitted(status) {
  return normalizeProjectStatus(status) === PROJECT_STATUS.SUBMITTED;
}

export function isProjectUnderReview(status) {
  return normalizeProjectStatus(status) === PROJECT_STATUS.UNDER_REVIEW;
}

export function isProjectRevisionRequested(status) {
  return normalizeProjectStatus(status) === PROJECT_STATUS.REVISION_REQUESTED;
}

export function isProjectReviewable(status) {
  return [PROJECT_STATUS.SUBMITTED, PROJECT_STATUS.UNDER_REVIEW].includes(
    normalizeProjectStatus(status)
  );
}

export function isProjectApproved(status) {
  return normalizeProjectStatus(status) === PROJECT_STATUS.APPROVED;
}

export function isProjectPublished(status) {
  return normalizeProjectStatus(status) === PROJECT_STATUS.PUBLISHED;
}

export function isProjectNoPublication(status) {
  return normalizeProjectStatus(status) === PROJECT_STATUS.NO_PUBLICATION;
}

export function canEditProjectStatus(status) {
  return [
    PROJECT_STATUS.DRAFT,
    PROJECT_STATUS.REJECTED,
    PROJECT_STATUS.REVISION_REQUESTED,
  ].includes(normalizeProjectStatus(status));
}

export function canSubmitProjectStatus(status) {
  return canEditProjectStatus(status);
}
