import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deleteForecastProjectById,
  deleteProjectById,
  renameForecastProject,
  renameProject as apiRenameProject,
} from "@/api/projectAPI";
import { projectLibraryQueryKeys } from "@/features/projects/services/projectLibraryQueryKeys";

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProjectById,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectLibraryQueryKeys.all });
    },
  });
}

export function useDeleteForecastProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteForecastProjectById,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectLibraryQueryKeys.all });
    },
  });
}

export function useRenameProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }) => apiRenameProject(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectLibraryQueryKeys.all });
    },
  });
}

export function useRenameForecastProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ forecastProjectId, name }) => renameForecastProject(forecastProjectId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectLibraryQueryKeys.all });
    },
  });
}
