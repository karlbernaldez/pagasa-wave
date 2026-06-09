import { adaptProjects } from "@/features/projects/projectAdapter";
import { useProjects } from "@/features/projects/hooks/useProjects";

export const FORECASTER_PAGE_SIZE = 10;

export function useForecasterProjectLibrary({ enabled = true } = {}) {
  const projects = useProjects({ enabled });

  return {
    ...projects,
    paged: adaptProjects(projects.paged),
  };
}
