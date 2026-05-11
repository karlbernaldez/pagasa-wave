import { adaptProjects } from '@/features/projects/projectAdapter';
import { useProjects } from '@dashboards/forecaster/hooks/useProjects';

export const FORECASTER_PAGE_SIZE = 10;

export function useForecasterProjectLibrary() {
  const projects = useProjects();

  return {
    ...projects,
    paged: adaptProjects(projects.paged),
  };
}
