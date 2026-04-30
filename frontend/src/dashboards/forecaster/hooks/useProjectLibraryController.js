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

const WORKFLOW_STATUS_LABELS = {
  draft: "Draft",
  submitted: "Submitted",
  underreview: "Under Review",
  under_review: "Under Review",
  review: "Under Review",
  revisionrequested: "Revision Requested",
  revision_requested: "Revision Requested",
  needsrevision: "Revision Requested",
  needs_revision: "Revision Requested",
  approved: "Approved",
  published: "Published",
  rejected: "Rejected",
  archived: "Archived",
};

function normalizeWorkflowStatus(status, fallback = "Draft") {
  const rawStatus = String(status || "").trim();
  if (!rawStatus) return fallback;

  const compactKey = rawStatus.toLowerCase().replace(/[\s-]+/g, "");
  const snakeKey = rawStatus.toLowerCase().replace(/[\s-]+/g, "_");

  return WORKFLOW_STATUS_LABELS[compactKey] || WORKFLOW_STATUS_LABELS[snakeKey] || rawStatus;
}

function getProjectId(project) {
  return project?._id || project?.id;
}

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
  const id = getProjectId(project);

  return {
    ...project,
    _id: id,
    id,
    name: project.name || project.title || "Untitled Project",
    title: project.name || project.title || "Untitled Project",
    owner: formatOwner(project.owner),
    rawOwner: project.owner,
    chartType: project.chartType || project.type || "forecast",
    status: normalizeWorkflowStatus(project.status),
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
    const status = normalizeWorkflowStatus(project?.status);

    if (!projectId) {
      throw new Error("Project ID is missing.");
    }

    if (status !== "Submitted") {
      return normalizeAdminProject({ ...project, status });
    }

    const updatedProject = await startReviewProject(projectId);
    await refetch();
    return normalizeAdminProject(updatedProject);
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
