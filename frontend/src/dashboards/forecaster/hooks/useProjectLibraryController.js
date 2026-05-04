import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  approveProject,
  fetchAllProjectsForAdmin,
  publishProject,
  rejectProject,
  startReviewProject,
  submitProject,
} from "@/api/projectAPI";
import { useProjects } from "@dashboards/forecaster/hooks/useProjects";
import {
  useDeleteProjectMutation,
  useRenameProjectMutation,
} from "@dashboards/forecaster/hooks/useProjectMutations";
import ProjectDialogsHost from "@dashboards/forecaster/components/project-library/ProjectDialogsHost";
import {
  getAdminProjectStats,
  getProjectStats,
} from "@dashboards/forecaster/components/project-library/projectLibraryUtils";
import { adaptProjects, adaptProject } from "@/features/projects/projectAdapter";
import {
  PROJECT_STATUS,
  isProjectSubmitted,
  isProjectUnderReview,
} from "@/features/projects/projectStatuses";

const PAGE_SIZE = 10;
const ADMIN_PAGE_SIZE = 12;

function getProjectId(project) {
  return project?._id || project?.id;
}

function getProjectFromResponse(data, fallbackProject) {
  return data?.project || data?.data?.project || data?.data || data || fallbackProject;
}

function useDebouncedValue(value, delay = 350) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debouncedValue;
}

function useAdminProjectLibrary() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [dateRangeFilter, setDateRangeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, typeFilter, dateRangeFilter, sortBy, sortDir]);

  const queryParams = {
    page,
    limit: ADMIN_PAGE_SIZE,
    search: debouncedSearch,
    status: statusFilter,
    type: typeFilter,
    dateRange: dateRangeFilter,
    sortBy,
    sortDir,
  };

  const query = useQuery({
    queryKey: ["admin-project-library", queryParams],
    queryFn: ({ signal }) => fetchAllProjectsForAdmin({ ...queryParams, signal }),
    staleTime: 30000,
    keepPreviousData: true,
  });

  const response = query.data ?? {};
  const paged = adaptProjects(response.projects ?? []);
  const total = response.total ?? 0;
  const totalPages = Math.max(1, response.totalPages ?? 1);
  const currentPage = response.page ?? page;

  const activeFilterCount = [
    statusFilter !== "All",
    typeFilter !== "All",
    dateRangeFilter !== "All",
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setTypeFilter("All");
    setDateRangeFilter("All");
    setSortBy("updatedAt");
    setSortDir("desc");
  };

  return {
    loading: query.isLoading,
    error: query.error,
    isFetching: query.isFetching,
    refetch: query.refetch,
    replaceProject: undefined,
    paged,
    total,
    totalPages,
    page: currentPage,
    setPage,
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
  };
}

export function useProjectLibraryController({ role = "forecaster", title, description } = {}) {
  const isAdmin = role === "admin";
  const [submittingProjectId, setSubmittingProjectId] = useState(null);

  const forecasterProjects = useProjects();
  const adminProjects = useAdminProjectLibrary();

  const projectState = isAdmin
    ? adminProjects
    : {
        ...forecasterProjects,
        paged: adaptProjects(forecasterProjects.paged),
      };

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
  } = projectState;

  const deleteProjectMutation = useDeleteProjectMutation();
  const renameProjectMutation = useRenameProjectMutation();

  const dialogs = ProjectDialogsHost({
    onDeleteConfirm: (project) => deleteProjectMutation.mutate(project._id),
    onRenameConfirm: (project, name) =>
      renameProjectMutation.mutate({ id: project._id, name }),
  });

  useEffect(() => {
    document.title = isAdmin
      ? "WaveLab · Project Review"
      : "WaveLab · Forecast Operations";
  }, [isAdmin]);

  const handleSubmit = async (project) => {
    const projectId = getProjectId(project);
    if (!projectId || submittingProjectId) return;

    setSubmittingProjectId(projectId);
    try {
      await submitProject(projectId);
      await refetch();
    } finally {
      setSubmittingProjectId(null);
    }
  };

  const handleStartReview = async (project) => {
    const projectId = getProjectId(project);
    if (!projectId) throw new Error("Project ID is missing.");

    if (isProjectUnderReview(project.status)) {
      return project;
    }

    if (!isProjectSubmitted(project.status)) {
      return project;
    }

    const response = await startReviewProject(projectId);
    const transitionedProject = adaptProject({
      ...project,
      ...getProjectFromResponse(response, project),
      status: PROJECT_STATUS.UNDER_REVIEW,
    });

    replaceProject?.(transitionedProject);
    await refetch?.();
    return transitionedProject;
  };

  const handleApprove = async (project) => {
    await approveProject(getProjectId(project));
    await refetch();
  };

  const handleReject = async (project, comment = "Needs revision") => {
    await rejectProject(getProjectId(project), comment);
    await refetch();
  };

  const handlePublish = async (project) => {
    await publishProject(getProjectId(project));
    await refetch();
  };

  const stats = !loading
    ? isAdmin
      ? getAdminProjectStats(paged, total)
      : getProjectStats(paged, total)
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
      onSubmit: isAdmin ? undefined : handleSubmit,
      submittingProjectId,
      onStartReview: isAdmin ? handleStartReview : undefined,
      onApprove: isAdmin ? handleApprove : undefined,
      onReject: isAdmin ? handleReject : undefined,
      onPublish: isAdmin ? handlePublish : undefined,
      mode: isAdmin ? "review" : "library",
    },
    pagination: {
      page,
      total,
      totalPages,
      pageSize: isAdmin ? ADMIN_PAGE_SIZE : PAGE_SIZE,
      onPageChange: setPage,
    },
    dialogs: isAdmin ? null : dialogs.dialogs,
  };
}
