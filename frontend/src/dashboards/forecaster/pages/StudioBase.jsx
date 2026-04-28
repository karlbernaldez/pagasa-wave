import { useEffect } from "react";
import { useTheme } from "@/app/providers/ThemeProvider";
import CreateProjectModal from "@/components/ui/modals/CreateProjectModal";

import { useProjects } from "@dashboards/forecaster/components/StudioBase/hooks/useProjects";
import ProjectStats from "@dashboards/forecaster/components/project-library/ProjectStats";
import ProjectToolbar from "@dashboards/forecaster/components/project-library/ProjectToolbar";
import ProjectTable from "@dashboards/forecaster/components/project-library/ProjectTable";

import { getProjectStats } from "@dashboards/forecaster/components/project-library/projectLibraryUtils";

export default function StudioBase() {
  const { isDarkMode } = useTheme();

  const {
    loading,
    allProjects,
    search,
    setSearch,
    paged,
    createProject,
  } = useProjects();

  useEffect(() => {
    document.title = "WaveLab · Forecast Operations";
  }, []);

  const stats = !loading && allProjects.length > 0 ? getProjectStats(allProjects) : [];

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-[1400px] space-y-6 p-6">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Forecast Operations</h1>
            <p className="text-sm text-slate-500">Track, manage, and continue active marine forecast projects.</p>
          </div>

          <button
            onClick={() => createProject({}, () => {})}
            className="rounded-lg bg-blue-700 px-5 py-2 text-sm font-bold text-white"
          >
            + New Project
          </button>
        </div>

        <ProjectStats stats={stats} />

        <ProjectToolbar search={search} setSearch={setSearch} />

        <ProjectTable
          projects={paged}
          onOpen={(p) => window.open(`/studio/${p._id}`, "_blank")}
        />
      </div>

      <CreateProjectModal
        visible={false}
        onClose={() => {}}
        onSubmit={(fd) => createProject(fd)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
