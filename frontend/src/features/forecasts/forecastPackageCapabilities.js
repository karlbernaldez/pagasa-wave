const EDITABLE_STATUSES = new Set(['Draft', 'Revision Requested']);
const REVIEWABLE_STATUSES = new Set(['Submitted', 'Under Review', 'Revision Requested']);
const APPROVABLE_STATUSES = new Set(['Under Review', 'Revision Requested']);
const PUBLISHABLE_STATUSES = new Set(['Approved']);

function hasPermission(permissions, permission) {
  return Array.isArray(permissions) && permissions.includes(permission);
}

function normalizeWorkflowStatus(status) {
  return status === 'In Production' ? 'Draft' : status;
}

export function getForecastPackageCapabilities({ permissions = [], status = '' } = {}) {
  const workflowStatus = normalizeWorkflowStatus(status);
  const canView = hasPermission(permissions, 'forecast.view');
  const canEdit =
    canView && hasPermission(permissions, 'forecast.edit') && EDITABLE_STATUSES.has(workflowStatus);
  const canSubmit =
    canView && hasPermission(permissions, 'forecast.submit') && EDITABLE_STATUSES.has(workflowStatus);
  const canReview =
    canView && hasPermission(permissions, 'forecast.review') && REVIEWABLE_STATUSES.has(workflowStatus);
  const canApprove =
    canView && hasPermission(permissions, 'forecast.approve') && APPROVABLE_STATUSES.has(workflowStatus);
  const canPublish =
    canView && hasPermission(permissions, 'forecast.publish') && PUBLISHABLE_STATUSES.has(workflowStatus);

  return {
    canView,
    canEdit,
    canSubmit,
    canReview,
    canApprove,
    canPublish,
    isEditableState: EDITABLE_STATUSES.has(workflowStatus),
    isReviewableState: REVIEWABLE_STATUSES.has(workflowStatus),
    isApprovableState: APPROVABLE_STATUSES.has(workflowStatus),
    isPublishableState: PUBLISHABLE_STATUSES.has(workflowStatus),
  };
}
