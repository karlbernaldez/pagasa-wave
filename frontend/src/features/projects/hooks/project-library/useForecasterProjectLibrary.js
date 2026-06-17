import { adaptProjects } from "@/features/projects/projectAdapter";
import { useProjects } from "@/features/projects/hooks/useProjects";

export const FORECASTER_PAGE_SIZE = 12;

export function useForecasterProjectLibrary() {
  const projects = useProjects();

  return {
    ...projects,
    paged: adaptProjects(projects.paged),
  };
}
