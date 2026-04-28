import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchUserProjects } from "@/api/projectAPI";
import { PAGE_LIMIT } from "@dashboards/forecaster/constants/projectLibrary";
import { projectLibraryQueryKeys } from "@dashboards/forecaster/services/projectLibraryQueryKeys";

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

  const queryParams = {
    page,
    limit: PAGE_LIMIT,
    search: debouncedSearch,
    status: statusFilter,
    type: typeFilter,
    dateRange: dateRangeFilter,
    sortBy,
    sortDir,
  };

  const query = useQuery({
    queryKey: projectLibraryQueryKeys.list(queryParams),
    queryFn: ({ signal }) => fetchUserProjects({ ...queryParams, signal }),
    staleTime: 30000,
    keepPreviousData: true,
  });

  const response = query.data ?? {};
  const paged = response.projects ?? [];
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

    allProjects: paged,
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
    activeFilterCount,
    resetFilters,
    sortBy,
    setSortBy,
    sortDir,
    setSortDir,
  };
}
