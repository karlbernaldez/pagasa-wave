import { useEffect } from "react";

import { useProjects } from "@dashboards/forecaster/components/StudioBase/hooks/useProjects";
import ProjectStats from "@dashboards/forecaster/components/project-library/ProjectStats";
import ProjectToolbar from "@dashboards/forecaster/components/project-library/ProjectToolbar";
import ProjectTable from "@dashboards/forecaster/components/project-library/ProjectTable";
import ProjectPagination from "@dashboards/forecaster/components/project-library/ProjectPagination";
import ProjectDialogsHost from "@dashboards/forecaster/components/project-library/ProjectDialogsHost";

import { getProjectStats } from "@dashboards/forecaster/components/project-library/projectLibraryUtils";

export default function ProjectLibraryPage() {
  const {
    loading,
    allProjects,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    dateRangeFilter,
    setDateRangeFilter,
    sortBy,
    setSortBy,
    sortDir,
    setSortDir,
    activeFilterCount,
    resetFilters,
    paged,
    page,
    setPage,
    total,
    totalPages,
    deleteProject,
    renameProject,
  } = useProjects();

  const dialogs = ProjectDialogsHost({
    onDeleteConfirm: (project) => deleteProject(project._id),
    onRenameConfirm: (project, name) => renameProject(project._id, name),
  });

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
            <p className="text-sm text-slate-500">
              Track, manage, and continue active marine forecast projects.
            </p>
          </div>
        </div>

        <ProjectStats stats={stats} />

        <ProjectToolbar
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          dateRangeFilter={dateRangeFilter}
          setDateRangeFilter={setDateRangeFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortDir={sortDir}
          setSortDir={setSortDir}
          activeFilterCount={activeFilterCount}
          onClear={resetFilters}
        />

        <ProjectTable
          projects={paged}
          onOpen={(project) => window.open(`/studio/${project._id}`, "_blank")}
          onRename={dialogs.openRename}
          onDelete={dialogs.openDelete}
        />

        <ProjectPagination
          page={page}
          total={total}
          totalPages={totalPages}
          pageSize={10}
          onPageChange={setPage}
        />
      </div>

      {dialogs.dialogs}
    </div>
  );
}
