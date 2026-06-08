import {
  buildPagination,
  buildSort,
  buildSearchFilter,
  buildStatusFilter,
  buildDateFilter,
} from './utils/projectQueryUtils.js';

export class ProjectQueryBuilder {
  static build(
    ownerId,
    params = {}
  ) {
    const {
      page,
      limit,
      search,
      status,
      dateRange,
      sortBy,
      sortDir,
    } = params;

    const filters = [];

    const searchFilter =
      buildSearchFilter(
        search
      );

    if (searchFilter) {
      filters.push(
        searchFilter
      );
    }

    const statusFilter =
      buildStatusFilter(
        status
      );

    if (statusFilter) {
      filters.push(
        statusFilter
      );
    }

    const dateFilter =
      buildDateFilter(
        dateRange
      );

    if (dateFilter) {
      filters.push(
        dateFilter
      );
    }

    const query = {
      owner: ownerId,
    };

    if (
      filters.length
    ) {
      query.$and =
        filters;
    }

    const pagination =
      buildPagination(
        page,
        limit
      );

    return {
      query,

      sort:
        buildSort(
          sortBy,
          sortDir
        ),

      ...pagination,
    };
  }
}