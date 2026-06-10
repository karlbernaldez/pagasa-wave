import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { createProject } from "@/api/projectAPI";

import {
  getCreatedProjectId,
} from "@/features/projects/utils/projectLibraryUtils";

export function useCreateProject({
  onRetry,
  onError,
  onSuccess,
}) {
  const navigate = useNavigate();

  const [isCreating, setIsCreating] =
    useState(false);

  const create = useCallback(
    async ({
      projectName,
      description,
      forecastDate,
    }) => {
      const name =
        projectName?.trim();

      if (!name || isCreating)
        return;

      setIsCreating(true);

      try {
        const response =
          await createProject({
            name,
            description,
            forecastDate,
          });

        const projectId =
          getCreatedProjectId(
            response
          );

        await onRetry?.();

        onSuccess?.();

        if (!projectId) {
          throw new Error(
            "Project created but ID missing."
          );
        }

        navigate(
          `/studio/${projectId}`
        );
      } catch (error) {
        onError?.(
          error?.message ||
          "Failed to create project."
        );
      } finally {
        setIsCreating(false);
      }
    },
    [
      navigate,
      isCreating,
      onRetry,
      onError,
      onSuccess,
    ]
  );

  return {
    create,
    isCreating,
  };
}