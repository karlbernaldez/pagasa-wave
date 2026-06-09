import { useMemo } from 'react';

import {
  addReviewComment,
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
  const reviewTargetId = projectId;

  return useMemo(() => ({
    onAddComment: () => runAction(
      'comment',
      () => addReviewComment(reviewTargetId, remarks.trim()),
      { requireRemarks: true, closeOnSuccess: false },
    ),
    onRequestRevision: () => runAction(
      'revision',
      () => requestProjectRevision(reviewTargetId, remarks.trim()),
      { requireRemarks: true },
    ),
    onApprove: () => runAction('approve', () => onApprove(currentProject)),
    onReject: () => runAction(
      'reject',
      () => onReject(currentProject, remarks.trim()),
      { requireRemarks: true },
    ),
    onPublish: () => runAction('publish', () => onPublish(currentProject)),
  }), [currentProject, onApprove, onPublish, onReject, remarks, reviewTargetId, runAction]);
}
