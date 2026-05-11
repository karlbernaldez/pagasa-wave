import ProjectDialogsHost from '@dashboards/forecaster/components/project-library/ProjectDialogsHost';
import {
  useDeleteProjectMutation,
  useRenameProjectMutation,
} from '@dashboards/forecaster/hooks/useProjectMutations';

export function useProjectLibraryDialogs() {
  const deleteProjectMutation = useDeleteProjectMutation();
  const renameProjectMutation = useRenameProjectMutation();

  return ProjectDialogsHost({
    onDeleteConfirm: (project) => deleteProjectMutation.mutate(project._id),
    onRenameConfirm: (project, name) =>
      renameProjectMutation.mutate({ id: project._id, name }),
  });
}
