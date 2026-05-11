import { useEffect } from "react";

import {
  getAdminProjectStats,
  getProjectStats,
} from "@dashboards/forecaster/components/project-library/projectLibraryUtils";
import { ADMIN_PAGE_SIZE, useAdminProjectLibrary } from "@dashboards/forecaster/hooks/project-library/useAdminProjectLibrary";
import { FORECASTER_PAGE_SIZE, useForecasterProjectLibrary } from "@dashboards/forecaster/hooks/project-library/useForecasterProjectLibrary";
import { useProjectLibraryActions } from "@dashboards/forecaster/hooks/project-library/useProjectLibraryActions";
import { useProjectLibraryDialogs } from "@dashboards/forecaster/hooks/project-library/useProjectLibraryDialogs";
import { getProjectId } from "@dashboards/forecaster/hooks/project-library/projectLibraryHelpers";

export function useProjectLibraryController({ role = "forecaster", title, description } = {}) {
  const isAdmin = role === "admin";

  const forecasterProjects = useForecasterProjectLibrary();
  const adminProjects = useAdminProjectLibrary();
  const dialogs = useProjectLibraryDialogs();

  const projectState = isAdmin ? adminProjects : forecasterProjects;

  const {
    loading,
    error,
    isFetching,
    refetch,
    replaceProject,
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
    statusCounts,
  } = projectState;

  const actions = useProjectLibraryActions({
    isAdmin,
    refetch,
    replaceProject,
  });

  useEffect(() => {
    document.title = isAdmin
      ? "WaveLab · Project Review"
      : "WaveLab · Forecast Operations";
  }, [isAdmin]);

  const stats = !loading
    ? isAdmin
      ? getAdminProjectStats(paged, total, statusCounts)
      : getProjectStats(paged, total, statusCounts)
    : [];

  return {
    role,
    header: {
      title: title || "Forecast Operations",
      description: description || "Track, manage, and continue active marine forecast projects.",
    },
    stats: { stats },
    toolbar: {
      role,
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
      onOpen: (project) => window.open(`/studio/${getProjectId(project)}`, "_blank"),
      onRename: isAdmin ? undefined : dialogs.openRename,
      onDelete: isAdmin ? undefined : dialogs.openDelete,
      onSubmit: actions.onSubmit,
      submittingProjectId: actions.submittingProjectId,
      onStartReview: actions.onStartReview,
      onApprove: actions.onApprove,
      onReject: actions.onReject,
      onPublish: actions.onPublish,
      mode: isAdmin ? "review" : "library",
    },
    pagination: {
      page,
      total,
      totalPages,
      pageSize: isAdmin ? ADMIN_PAGE_SIZE : FORECASTER_PAGE_SIZE,
      onPageChange: setPage,
    },
    dialogs: isAdmin ? null : dialogs.dialogs,
  };
}
