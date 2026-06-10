import {
  useState,
  useCallback,
} from "react";

import { isProjectPublished }
  from "@/features/projects/projectStatuses";

import {
  getProjectId,
} from "@/features/projects/utils/projectLibraryUtils";

export function useProjectReviewFlow({
  role,
  navigate,
  onOpen,
  onStartReview,
  onError,
}) {
  const [
    reviewProject,
    setReviewProject,
  ] = useState(null);

  const [
    isStartingReview,
    setIsStartingReview,
  ] = useState(false);

  const handleOpen =
    useCallback(
      async (project) => {
        const projectId =
          getProjectId(project);

        if (!projectId) return;

        if (
          isProjectPublished(
            project?.status
          )
        ) {
          navigate(
            `/forecasts/${projectId}`
          );
          return;
        }

        if (role === "admin") {
          setIsStartingReview(
            true
          );

          try {
            const updated =
              await onStartReview?.(
                project
              );

            setReviewProject(
              updated ||
              project
            );
          } catch (error) {
            onError?.(
              error?.message ||
              "Failed to start review."
            );
          } finally {
            setIsStartingReview(
              false
            );
          }

          return;
        }

        onOpen(project);
      },
      [
        role,
        navigate,
        onOpen,
        onStartReview,
        onError,
      ]
    );

  return {
    reviewProject,
    setReviewProject,

    isStartingReview,

    handleOpen,
  };
}