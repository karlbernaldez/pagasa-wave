import { useState } from 'react';

import { mergeProjectState } from '@/features/projects/utils/projectReviewViewModel';

export default function useProjectReviewActions({
  currentProject,
  remarks,
  hasRemarks,
  setCurrentProject,
  setRemarks,
  onActionComplete,
  onActionSuccess,
  onClose,
}) {
  const [busyAction, setBusyAction] = useState(null);
  const [actionError, setActionError] = useState('');

  const runAction = async (key, action, { requireRemarks = false, closeOnSuccess = true } = {}) => {
    if (busyAction) return;

    setActionError('');

    if (requireRemarks && !hasRemarks) {
      setActionError('Remarks are required for this action.');
      return;
    }

    try {
      setBusyAction(key);
      const updatedProject = await action?.(currentProject, remarks.trim());
      const nextProject = updatedProject ? mergeProjectState(currentProject, updatedProject) : currentProject;

      setCurrentProject(nextProject);
      await onActionComplete?.(nextProject);
      const shouldClose = await onActionSuccess?.({ key, project: nextProject, closeOnSuccess });
      setRemarks('');
      if (closeOnSuccess && shouldClose !== false) onClose?.();
    } catch (error) {
      console.error(error);
      setActionError(error.message || 'Action failed. Please try again.');
    } finally {
      setBusyAction(null);
    }
  };

  return {
    busyAction,
    actionError,
    clearActionError: () => setActionError(''),
    runAction,
  };
}
