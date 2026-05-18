import { ROLES } from '@/core/auth/roles';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { useAdminProjectLibrary } from '@/features/projects/hooks/project-library/useAdminProjectLibrary';

export function useProjectsData({ role }) {
  if (role === ROLES.ADMIN) {
    return useAdminProjectsData();
  }

  return useForecasterProjectsData();
}

function useForecasterProjectsData() {
  const data = useProjects();

  return {
    role: ROLES.FORECASTER,
    projects: data.paged,
    allProjects: data.allProjects,
    loading: data.loading,
    error: data.error,
    isFetching: data.isFetching,
    refetch: data.refetch,
    total: data.total,
    totalPages: data.totalPages,
    page: data.page,
    setPage: data.setPage,
    filters: {
      search: data.search,
      setSearch: data.setSearch,
      statusFilter: data.statusFilter,
      setStatusFilter: data.setStatusFilter,
      typeFilter: data.typeFilter,
      setTypeFilter: data.setTypeFilter,
      dateRangeFilter: data.dateRangeFilter,
      setDateRangeFilter: data.setDateRangeFilter,
      sortBy: data.sortBy,
      setSortBy: data.setSortBy,
      sortDir: data.sortDir,
      setSortDir: data.setSortDir,
      activeFilterCount: data.activeFilterCount,
      resetFilters: data.resetFilters,
    },
  };
}

function useAdminProjectsData() {
  const data = useAdminProjectLibrary();

  return {
    role: ROLES.ADMIN,
    projects: data.paged,
    allProjects: data.paged,
    loading: data.loading,
    error: data.error,
    isFetching: data.isFetching,
    refetch: data.refetch,
    total: data.total,
    totalPages: data.totalPages,
    page: data.page,
    setPage: data.setPage,
    filters: {
      activeStatus: data.statusFilter,
      setActiveStatus: data.setStatusFilter,
      search: data.search,
      setSearch: data.setSearch,
      statusFilter: data.statusFilter,
      setStatusFilter: data.setStatusFilter,
      typeFilter: data.typeFilter,
      setTypeFilter: data.setTypeFilter,
      dateRangeFilter: data.dateRangeFilter,
      setDateRangeFilter: data.setDateRangeFilter,
      sortBy: data.sortBy,
      setSortBy: data.setSortBy,
      sortDir: data.sortDir,
      setSortDir: data.setSortDir,
      activeFilterCount: data.activeFilterCount,
      resetFilters: data.resetFilters,
    },
  };
}
