import { useState } from 'react';

import { mergeProjectState } from '@/features/projects/utils/projectReviewViewModel';

export default function useProjectReviewActions({
  currentProject,
  remarks,
  hasRemarks,
  setCurrentProject,
  setRemarks,
  onActionComplete,
  onClose,
}) {
  const [busyAction, setBusyAction] = useState(null);

  const runAction = async (key, action, { requireRemarks = false, closeOnSuccess = true } = {}) => {
    if (busyAction) return;
    if (requireRemarks && !hasRemarks) {
      alert('Remarks are required for this action.');
      return;
    }

    try {
      setBusyAction(key);
      const updatedProject = await action?.(currentProject, remarks.trim());
      const nextProject = updatedProject ? mergeProjectState(currentProject, updatedProject) : currentProject;

      setCurrentProject(nextProject);
      await onActionComplete?.(nextProject);
      setRemarks('');
      if (closeOnSuccess) onClose?.();
    } catch (error) {
      console.error(error);
      alert(error.message || 'Action failed. Please try again.');
    } finally {
      setBusyAction(null);
    }
  };

  return {
    busyAction,
    runAction,
  };
}
