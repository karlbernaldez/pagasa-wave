import ProjectDialogsHost from "@/features/projects/components/project-library/ProjectDialogsHost";
import {
  useDeleteProjectMutation,
  useRenameProjectMutation,
} from "@/features/projects/hooks/useProjectMutations";

export function useProjectLibraryDialogs() {
  const deleteProjectMutation = useDeleteProjectMutation();
  const renameProjectMutation = useRenameProjectMutation();

  return ProjectDialogsHost({
    onDeleteConfirm: (project) => {
      deleteProjectMutation.mutate(project._id);
    },
    onRenameConfirm: (project, name) => {
      renameProjectMutation.mutate({ id: project._id, name });
    },
  });
}
