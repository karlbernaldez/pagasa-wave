import { useState } from "react";

import {
  approveProject,
  approveForecastProject,
  publishProject,
  publishForecastProject,
  rejectProject,
  rejectForecastProject,
  startReviewProject,
  startReviewForecastProject,
  submitForecastProject,
  submitProject,
} from "@/api/projectAPI";
import { adaptProject } from "@/features/projects/projectAdapter";
import {
  PROJECT_STATUS,
  isProjectSubmitted,
  isProjectUnderReview,
} from "@/features/projects/projectStatuses";
import { getProjectFromResponse, getProjectId } from "./projectLibraryHelpers";

export function useProjectLibraryActions({ isAdmin, refetch, replaceProject }) {
  const [submittingProjectId, setSubmittingProjectId] = useState(null);

  const handleSubmit = async (project) => {
    const projectId = getProjectId(project);
    if (!projectId || submittingProjectId) return;

    setSubmittingProjectId(projectId);
    try {
      if (project?.isForecastPackage && project?.forecastProjectId) {
        await submitForecastProject(project.forecastProjectId);
      } else {
        await submitProject(projectId);
      }
      await refetch();
    } finally {
      setSubmittingProjectId(null);
    }
  };

  const handleStartReview = async (project) => {
    const projectId = getProjectId(project);
    if (!projectId) throw new Error("Project ID is missing.");

    if (isProjectUnderReview(project.status)) return project;
    if (!isProjectSubmitted(project.status)) return project;

    const response = project?.isForecastPackage && project?.forecastProjectId
      ? await startReviewForecastProject(project.forecastProjectId)
      : await startReviewProject(projectId);
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
    if (project?.isForecastPackage && project?.forecastProjectId) {
      await approveForecastProject(project.forecastProjectId);
    } else {
      await approveProject(getProjectId(project));
    }
    await refetch();
  };

  const handleReject = async (project, comment = "Needs revision") => {
    if (project?.isForecastPackage && project?.forecastProjectId) {
      await rejectForecastProject(project.forecastProjectId, comment);
    } else {
      await rejectProject(getProjectId(project), comment);
    }
    await refetch();
  };

  const handlePublish = async (project) => {
    if (project?.isForecastPackage && project?.forecastProjectId) {
      await publishForecastProject(project.forecastProjectId);
    } else {
      await publishProject(getProjectId(project));
    }
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
