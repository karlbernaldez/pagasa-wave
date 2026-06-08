import { useMemo } from 'react';

import {
  addForecastReviewComment,
  addReviewComment,
  requestForecastProjectRevision,
  requestProjectRevision,
} from '@/api/projectAPI';

export default function useProjectReviewActionHandlers({
  projectId,
  currentProject,
  remarks,
  runAction,
  onApprove,
  onReject,
  onPublish,
}) {
  const useForecastProjectRoute = currentProject?.isForecastPackage && currentProject?.forecastProjectId;
  const reviewTargetId = useForecastProjectRoute ? currentProject.forecastProjectId : projectId;

  return useMemo(() => ({
    onAddComment: () => runAction(
      'comment',
      () => useForecastProjectRoute
        ? addForecastReviewComment(reviewTargetId, remarks.trim())
        : addReviewComment(reviewTargetId, remarks.trim()),
      { requireRemarks: true, closeOnSuccess: false },
    ),
    onRequestRevision: () => runAction(
      'revision',
      () => useForecastProjectRoute
        ? requestForecastProjectRevision(reviewTargetId, remarks.trim())
        : requestProjectRevision(reviewTargetId, remarks.trim()),
      { requireRemarks: true },
    ),
    onApprove: () => runAction('approve', () => onApprove(currentProject)),
    onReject: () => runAction(
      'reject',
      () => onReject(currentProject, remarks.trim()),
      { requireRemarks: true },
    ),
    onPublish: () => runAction('publish', () => onPublish(currentProject)),
  }), [currentProject, onApprove, onPublish, onReject, remarks, reviewTargetId, runAction, useForecastProjectRoute]);
}
