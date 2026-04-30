import { useMemo, useState } from 'react';

import { ROLES } from '@/core/auth/roles';
import { useProjects } from '@dashboards/forecaster/hooks/useProjects';
import { useAdminProjects } from '@dashboards/admin/sections/chart-review/hooks/useAdminProject';

function toStatusLabel(status) {
  if (!status || status === 'all') return 'All';
  return status
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function sortProjects(projects, sortBy, sortDir) {
  return [...projects].sort((a, b) => {
    let valA;
    let valB;

    if (sortBy === 'name' || sortBy === 'status') {
      valA = (a[sortBy] ?? '').toLowerCase();
      valB = (b[sortBy] ?? '').toLowerCase();
    } else {
      valA = new Date(a[sortBy] ?? 0).getTime();
      valB = new Date(b[sortBy] ?? 0).getTime();
    }

    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });
}

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
  const { projects = [], isLoading, error, refetch } = useAdminProjects();

  const [activeStatus, setActiveStatus] = useState('submitted');
  const [sortBy, setSortBy] = useState('submittedAt');
  const [sortDir, setSortDir] = useState('desc');

  const filteredProjects = useMemo(() => {
    const statusLabel = toStatusLabel(activeStatus);
    const filtered = statusLabel === 'All'
      ? projects
      : projects.filter((project) => project.status === statusLabel);

    return sortProjects(filtered, sortBy, sortDir);
  }, [projects, activeStatus, sortBy, sortDir]);

  return {
    role: ROLES.ADMIN,
    projects: filteredProjects,
    allProjects: projects,
    loading: isLoading,
    error,
    isFetching: false,
    refetch,
    total: filteredProjects.length,
    totalPages: 1,
    page: 1,
    setPage: () => {},
    filters: {
      activeStatus,
      setActiveStatus,
      sortBy,
      setSortBy,
      sortDir,
      setSortDir,
    },
  };
}
