import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchUserProjects } from "@/api/projectAPI";
import { PAGE_LIMIT } from "@dashboards/forecaster/constants/projectLibrary";
import { sortProjects } from "@dashboards/forecaster/components/project-library/projectLibraryUtils";
import { projectLibraryQueryKeys, PROJECT_LIBRARY_QUERY_LIMIT } from "@dashboards/forecaster/services/projectLibraryQueryKeys";

function getProjectType(project) {
  return String(project.chartType || project.type || project.category || "").toLowerCase();
}

function isWithinDateRange(project, dateRange) {
  if (dateRange === "All") return true;

  const rawDate = project.forecastDate || project.updatedAt || project.createdAt;
  if (!rawDate) return false;

  const date = new Date(rawDate);
  const now = new Date();
  const days = Math.ceil((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (dateRange === "7d") return days <= 7;
  if (dateRange === "30d") return days <= 30;
  if (dateRange === "90d") return days <= 90;
  return true;
}

export function useProjects() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [dateRangeFilter, setDateRangeFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortDir, setSortDir] = useState("desc");

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, typeFilter, dateRangeFilter, sortBy, sortDir]);

  const query = useQuery({
    queryKey: projectLibraryQueryKeys.list({ limit: PROJECT_LIBRARY_QUERY_LIMIT }),
    queryFn: ({ signal }) => fetchUserProjects({ limit: PROJECT_LIBRARY_QUERY_LIMIT, signal }),
    staleTime: 30000,
    keepPreviousData: true,
  });

  const allProjects = query.data?.projects ?? [];

  const filtered = useMemo(() => {
    let result = allProjects;

    if (statusFilter !== "All") {
      result = result.filter((project) => (project.status || "Draft") === statusFilter);
    }

    if (typeFilter !== "All") {
      result = result.filter((project) =>
        getProjectType(project).includes(typeFilter.toLowerCase())
      );
    }

    if (dateRangeFilter !== "All") {
      result = result.filter((project) => isWithinDateRange(project, dateRangeFilter));
    }

    if (debouncedSearch.trim()) {
      const queryText = debouncedSearch.toLowerCase();
      result = result.filter(
        (project) =>
          project.name?.toLowerCase().includes(queryText) ||
          project.description?.toLowerCase().includes(queryText) ||
          project.region?.toLowerCase().includes(queryText)
      );
    }

    return result;
  }, [allProjects, statusFilter, typeFilter, dateRangeFilter, debouncedSearch]);

  const sorted = useMemo(
    () => sortProjects(filtered, sortBy, sortDir),
    [filtered, sortBy, sortDir]
  );

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));
  const paged = sorted.slice((page - 1) * PAGE_LIMIT, page * PAGE_LIMIT);

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

    allProjects,
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
    activeFilterCount,
    resetFilters,
    sortBy,
    setSortBy,
    sortDir,
    setSortDir,
  };
}
