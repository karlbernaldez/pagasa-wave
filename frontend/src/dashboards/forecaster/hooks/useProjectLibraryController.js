import { useEffect } from "react";

import { useProjects } from "@dashboards/forecaster/hooks/useProjects";
import {
  useDeleteProjectMutation,
  useRenameProjectMutation,
} from "@dashboards/forecaster/hooks/useProjectMutations";
import ProjectDialogsHost from "@dashboards/forecaster/components/project-library/ProjectDialogsHost";
import { getProjectStats } from "@dashboards/forecaster/components/project-library/projectLibraryUtils";

const PAGE_SIZE = 10;

export function useProjectLibraryController() {
  const {
    loading,
    error,
    isFetching,
    refetch,
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
  } = useProjects();

  const deleteProjectMutation = useDeleteProjectMutation();
  const renameProjectMutation = useRenameProjectMutation();

  const dialogs = ProjectDialogsHost({
    onDeleteConfirm: (project) => deleteProjectMutation.mutate(project._id),
    onRenameConfirm: (project, name) =>
      renameProjectMutation.mutate({ id: project._id, name }),
  });

  useEffect(() => {
    document.title = "WaveLab · Forecast Operations";
  }, []);

  const stats = !loading
    ? getProjectStats(paged, total)
    : [];

  return {
    header: {
      title: "Forecast Operations",
      description: "Track, manage, and continue active marine forecast projects.",
    },
    stats: {
      stats,
    },
    toolbar: {
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
      onClear: resetFilters,
      isFetching,
    },
    table: {
      projects: paged,
      loading,
      error,
      onRetry: refetch,
      onOpen: (project) => window.open(`/studio/${project._id}`, "_blank"),
      onRename: dialogs.openRename,
      onDelete: dialogs.openDelete,
    },
    pagination: {
      page,
      total,
      totalPages,
      pageSize: PAGE_SIZE,
      onPageChange: setPage,
    },
    dialogs: dialogs.dialogs,
  };
}
