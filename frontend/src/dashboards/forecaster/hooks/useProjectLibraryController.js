import { useEffect, useMemo, useState } from "react";

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
  getProjectStats,
  sortProjects,
} from "@dashboards/forecaster/components/project-library/projectLibraryUtils";

const PAGE_SIZE = 10;
const ADMIN_PAGE_SIZE = 12;

function formatOwner(owner) {
  if (!owner) return "Project Owner";
  if (typeof owner === "string") return owner;

  const fullName = `${owner.firstName ?? ""} ${owner.lastName ?? ""}`.trim();
  return fullName || owner.email || "Project Owner";
}

function getAdminProjectsFromResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.projects)) return data.projects;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function normalizeAdminProject(project) {
  return {
    ...project,
    _id: project._id || project.id,
    id: project._id || project.id,
    name: project.name || project.title || "Untitled Project",
    title: project.name || project.title || "Untitled Project",
    owner: formatOwner(project.owner),
    rawOwner: project.owner,
    chartType: project.chartType || project.type || "forecast",
    status: (project.status || "Draft").trim(),
  };
}

function useAdminProjectLibrary() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [dateRangeFilter, setDateRangeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);

  const load = async () => {
    setIsFetching(true);
    setError(null);

    try {
      const data = await fetchAllProjectsForAdmin();
      setProjects(getAdminProjectsFromResponse(data).map(normalizeAdminProject));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, typeFilter, dateRangeFilter, sortBy, sortDir]);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesSearch = !normalizedSearch ||
        project.name?.toLowerCase().includes(normalizedSearch) ||
        project.title?.toLowerCase().includes(normalizedSearch) ||
        project.owner?.toLowerCase().includes(normalizedSearch);

      const matchesStatus = statusFilter === "All" || project.status === statusFilter;
      const projectType = String(project.chartType || project.type || "").toLowerCase();
      const matchesType = typeFilter === "All" || projectType === typeFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [dateRangeFilter, projects, search, statusFilter, typeFilter]);

  const sorted = useMemo(
    () => sortProjects(filtered, sortBy, sortDir),
    [filtered, sortBy, sortDir]
  );

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const paged = sorted.slice((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE);

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
    loading,
    error,
    isFetching,
    refetch: load,
    paged,
    total,
    totalPages,
    page,
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

export function useProjectLibraryController({
  role = "forecaster",
  title,
  description,
} = {}) {
  const isAdmin = role === "admin";
  const [submittingProjectId, setSubmittingProjectId] = useState(null);

  const forecasterProjects = useProjects();
  const adminProjects = useAdminProjectLibrary();
  const projectState = isAdmin ? adminProjects : forecasterProjects;

  const {
    loading,
    error,
    isFetching,
    refetch,
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
    const projectId = project?._id || project?.id;
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
    if (project.status !== "Submitted") {
      return normalizeAdminProject(project);
    }

    const updatedProject = await startReviewProject(project._id);
    await refetch();
    return normalizeAdminProject(updatedProject);
  };

  const handleApprove = async (project) => {
    await approveProject(project._id);
    await refetch();
  };

  const handleReject = async (project, comment = "Needs revision") => {
    await rejectProject(project._id, comment);
    await refetch();
  };

  const handlePublish = async (project) => {
    await publishProject(project._id);
    await refetch();
  };

  const stats = !loading
    ? getProjectStats(paged, total)
    : [];

  return {
    role,
    header: {
      title: title || "Forecast Operations",
      description: description || "Track, manage, and continue active marine forecast projects.",
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
