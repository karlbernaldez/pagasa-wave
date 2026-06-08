import ProjectDialogsHost from "@/features/projects/components/project-library/ProjectDialogsHost";
import {
  useDeleteForecastProjectMutation,
  useDeleteProjectMutation,
  useRenameForecastProjectMutation,
  useRenameProjectMutation,
} from "@/features/projects/hooks/useProjectMutations";

export function useProjectLibraryDialogs() {
  const deleteProjectMutation = useDeleteProjectMutation();
  const deleteForecastProjectMutation = useDeleteForecastProjectMutation();
  const renameProjectMutation = useRenameProjectMutation();
  const renameForecastProjectMutation = useRenameForecastProjectMutation();

  return ProjectDialogsHost({
    onDeleteConfirm: (project) => {
      if (project?.isForecastPackage && project?.forecastProjectId) {
        deleteForecastProjectMutation.mutate(project.forecastProjectId);
        return;
      }
      deleteProjectMutation.mutate(project._id);
    },
    onRenameConfirm: (project, name) => {
      if (project?.isForecastPackage && project?.forecastProjectId) {
        renameForecastProjectMutation.mutate({ forecastProjectId: project.forecastProjectId, name });
        return;
      }
      renameProjectMutation.mutate({ id: project._id, name });
    },
  });
}
