import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { fetchAllProjectsForAdmin } from '@/api/projectAPI';
import { adaptProjects } from '@/features/projects/projectAdapter';
import { useDebouncedValue } from './useDebouncedValue';

export const ADMIN_PAGE_SIZE = 12;

export function useAdminProjectLibrary() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [dateRangeFilter, setDateRangeFilter] = useState('All');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, typeFilter, dateRangeFilter, sortBy, sortDir]);

  const queryParams = useMemo(() => ({
    page,
    limit: ADMIN_PAGE_SIZE,
    search: debouncedSearch,
    status: statusFilter,
    type: typeFilter,
    dateRange: dateRangeFilter,
    sortBy,
    sortDir,
  }), [page, debouncedSearch, statusFilter, typeFilter, dateRangeFilter, sortBy, sortDir]);

  const query = useQuery({
    queryKey: ['admin-project-library', queryParams],
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
    statusFilter !== 'All',
    typeFilter !== 'All',
    dateRangeFilter !== 'All',
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setTypeFilter('All');
    setDateRangeFilter('All');
    setSortBy('updatedAt');
    setSortDir('desc');
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
