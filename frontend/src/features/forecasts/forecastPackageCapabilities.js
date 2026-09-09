const EDITABLE_STATUSES = new Set(['Draft', 'Revision Requested']);
const REVIEWABLE_STATUSES = new Set(['Submitted', 'Under Review', 'Revision Requested']);
const APPROVABLE_STATUSES = new Set(['Under Review', 'Revision Requested']);
const PUBLISHABLE_STATUSES = new Set(['Approved']);

function hasPermission(permissions, permission) {
  return Array.isArray(permissions) && permissions.includes(permission);
}

export function getForecastPackageCapabilities({ permissions = [], status = '' } = {}) {
  const canView = hasPermission(permissions, 'forecast.view');
  const canEdit = canView && hasPermission(permissions, 'forecast.edit') && EDITABLE_STATUSES.has(status);
  const canSubmit = canView && hasPermission(permissions, 'forecast.submit') && EDITABLE_STATUSES.has(status);
  const canReview = canView && hasPermission(permissions, 'forecast.review') && REVIEWABLE_STATUSES.has(status);
  const canApprove = canView && hasPermission(permissions, 'forecast.approve') && APPROVABLE_STATUSES.has(status);
  const canPublish = canView && hasPermission(permissions, 'forecast.publish') && PUBLISHABLE_STATUSES.has(status);

  return {
    canView,
    canEdit,
    canSubmit,
    canReview,
    canApprove,
    canPublish,
    isEditableState: EDITABLE_STATUSES.has(status),
    isReviewableState: REVIEWABLE_STATUSES.has(status),
    isApprovableState: APPROVABLE_STATUSES.has(status),
    isPublishableState: PUBLISHABLE_STATUSES.has(status),
  };
}
