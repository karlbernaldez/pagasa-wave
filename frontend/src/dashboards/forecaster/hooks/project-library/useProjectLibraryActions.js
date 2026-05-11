import { useState } from 'react';

import {
  approveProject,
  publishProject,
  rejectProject,
  startReviewProject,
  submitProject,
} from '@/api/projectAPI';
import { adaptProject } from '@/features/projects/projectAdapter';
import {
  PROJECT_STATUS,
  isProjectSubmitted,
  isProjectUnderReview,
} from '@/features/projects/projectStatuses';
import { getProjectFromResponse, getProjectId } from './projectLibraryHelpers';

export function useProjectLibraryActions({ isAdmin, refetch, replaceProject }) {
  const [submittingProjectId, setSubmittingProjectId] = useState(null);

  const handleSubmit = async (project) => {
    const projectId = getProjectId(project);
    if (!projectId || submittingProjectId) return;

    setSubmittingProjectId(projectId);
    try {
      await submitProject(projectId);
      await refetch();
    } finally {
      setSubmittingProjectId(null);
    }
  };

  const handleStartReview = async (project) => {
    const projectId = getProjectId(project);
    if (!projectId) throw new Error('Project ID is missing.');

    if (isProjectUnderReview(project.status)) {
      return project;
    }

    if (!isProjectSubmitted(project.status)) {
      return project;
    }

    const response = await startReviewProject(projectId);
    const transitionedProject = adaptProject({
      ...project,
      ...getProjectFromResponse(response, project),
      status: PROJECT_STATUS.UNDER_REVIEW,
    });

    replaceProject?.(transitionedProject);
    await refetch?.();
    return transitionedProject;
  };

  const handleApprove = async (project) => {
    await approveProject(getProjectId(project));
    await refetch();
  };

  const handleReject = async (project, comment = 'Needs revision') => {
    await rejectProject(getProjectId(project), comment);
    await refetch();
  };

  const handlePublish = async (project) => {
    await publishProject(getProjectId(project));
    await refetch();
  };

  return {
    submittingProjectId,
    onSubmit: isAdmin ? undefined : handleSubmit,
    onStartReview: isAdmin ? handleStartReview : undefined,
    onApprove: isAdmin ? handleApprove : undefined,
    onReject: isAdmin ? handleReject : undefined,
    onPublish: isAdmin ? handlePublish : undefined,
  };
}
