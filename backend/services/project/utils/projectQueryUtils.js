import { PROJECT_STATUS }
  from '../../../constants/projectWorkflowConstants.js';

import {
  PROJECT_SORT_FIELDS,
  PROJECT_PAGINATION,
  PROJECT_DATE_RANGES,
  PROJECT_SEARCH,
} from '../../../constants/projectQueryConstants.js';

/* =========================================================
   REGEX ESCAPE
========================================================= */

export function escapeRegex(
  value
) {
  return String(
    value ?? ''
  ).replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );
}

/* =========================================================
   DATE RANGE FILTER
========================================================= */

export function getDateRangeFilter(
  dateRange
) {
  const days =
    PROJECT_DATE_RANGES[
      dateRange
    ];

  if (!days) {
    return null;
  }

  return new Date(
    Date.now() -
      days *
        24 *
        60 *
        60 *
        1000
  );
}

/* =========================================================
   STATUS COUNTS
========================================================= */

export function buildStatusCounts(
  rows = []
) {
  const counts = {};

  Object.values(
    PROJECT_STATUS
  ).forEach(
    status => {
      counts[status] = 0;
    }
  );

  rows.forEach(row => {
    if (row?._id) {
      counts[row._id] =
        row.count;
    }
  });

  return counts;
}

/* =========================================================
   PAGINATION
========================================================= */

export function buildPagination(
  page =
    PROJECT_PAGINATION.DEFAULT_PAGE,

  limit =
    PROJECT_PAGINATION.DEFAULT_LIMIT
) {
  const pageNumber =
    Math.max(
      Number(page) ||
        PROJECT_PAGINATION.DEFAULT_PAGE,
      1
    );

  const limitNumber =
    Math.min(
      Math.max(
        Number(limit) ||
          PROJECT_PAGINATION.DEFAULT_LIMIT,
        1
      ),
      PROJECT_PAGINATION.MAX_LIMIT
    );

  return {
    page:
      pageNumber,

    limit:
      limitNumber,

    skip:
      (pageNumber - 1) *
      limitNumber,
  };
}

/* =========================================================
   SORT
========================================================= */

export function buildSort(
  sortBy = 'updatedAt',
  sortDir = 'desc'
) {
  const sortField =
    PROJECT_SORT_FIELDS[
      sortBy
    ] ||
    'updatedAt';

  return {
    [sortField]:
      sortDir === 'asc'
        ? 1
        : -1,

    updatedAt: -1,
    createdAt: -1,
    _id: -1,
  };
}

/* =========================================================
   SEARCH FILTER
========================================================= */

export function buildSearchFilter(
  search
) {
  const trimmed =
    search?.trim();

  if (!trimmed) {
    return null;
  }

  const safeSearch =
    escapeRegex(
      trimmed.slice(
        0,
        PROJECT_SEARCH.MAX_LENGTH
      )
    );

  return {
    $or: [
      {
        name: {
          $regex:
            safeSearch,
          $options: 'i',
        },
      },

      {
        description: {
          $regex:
            safeSearch,
          $options: 'i',
        },
      },
    ],
  };
}

/* =========================================================
   STATUS FILTER
========================================================= */

export function buildStatusFilter(
  status
) {
  if (
    !status ||
    status === 'All'
  ) {
    return null;
  }

  return {
    status,
  };
}

/* =========================================================
   DATE FILTER
========================================================= */

export function buildDateFilter(
  dateRange
) {
  const cutoffDate =
    getDateRangeFilter(
      dateRange
    );

  if (!cutoffDate) {
    return null;
  }

  return {
    $or: [
      {
        updatedAt: {
          $gte:
            cutoffDate,
        },
      },

      {
        forecastDate: {
          $gte:
            cutoffDate,
        },
      },
    ],
  };
}