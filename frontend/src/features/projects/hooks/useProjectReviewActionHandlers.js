import { useMemo } from 'react';

import { addReviewComment, requestProjectRevision } from '@/api/projectAPI';

export default function useProjectReviewActionHandlers({
  projectId,
  currentProject,
  remarks,
  runAction,
  onApprove,
  onReject,
  onNoPublication,
  onPublish,
}) {
  return useMemo(() => ({
    onAddComment: () => runAction(
      'comment',
      () => addReviewComment(projectId, remarks.trim()),
      { requireRemarks: true, closeOnSuccess: false },
    ),
    onRequestRevision: () => runAction(
      'revision',
      () => requestProjectRevision(projectId, remarks.trim()),
      { requireRemarks: true },
    ),
    onApprove: () => runAction(
      'approve',
      () => onApprove(currentProject),
      { closeOnSuccess: false },
    ),
    onReject: () => runAction(
      'reject',
      () => onReject(currentProject, remarks.trim()),
      { requireRemarks: true },
    ),
    onNoPublication: (reason) => runAction(
      'noPublication',
      () => onNoPublication(currentProject, { reason, notes: remarks.trim() }),
      { requireRemarks: true },
    ),
    onPublish: () => runAction('publish', () => onPublish(currentProject)),
  }), [currentProject, onApprove, onNoPublication, onPublish, onReject, projectId, remarks, runAction]);
}
