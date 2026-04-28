import ProjectStats from "@dashboards/forecaster/components/project-library/ProjectStats";
import ProjectToolbar from "@dashboards/forecaster/components/project-library/ProjectToolbar";
import ProjectTable from "@dashboards/forecaster/components/project-library/ProjectTable";
import ProjectPagination from "@dashboards/forecaster/components/project-library/ProjectPagination";

import { useProjectLibraryController } from "@dashboards/forecaster/hooks/useProjectLibraryController";

export default function ProjectLibraryPage() {
  const controller = useProjectLibraryController();

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-[1400px] space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              {controller.header.title}
            </h1>
            <p className="text-sm text-slate-500">
              {controller.header.description}
            </p>
          </div>
        </div>

        <ProjectStats {...controller.stats} />

        <ProjectToolbar {...controller.toolbar} />

        <ProjectTable {...controller.table} />

        <ProjectPagination {...controller.pagination} />
      </div>

      {controller.dialogs}
    </div>
  );
}
