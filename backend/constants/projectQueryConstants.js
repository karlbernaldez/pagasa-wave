export const PROJECT_SORT_FIELDS =
  Object.freeze({
    name: 'name',

    forecastDate:
      'forecastDate',

    status:
      'status',

    lastOpenedAt:
      'lastOpenedAt',

    updatedAt:
      'updatedAt',

    createdAt:
      'createdAt',
  });

/**
 * Pagination limits
 */
export const PROJECT_PAGINATION =
  Object.freeze({
    DEFAULT_PAGE: 1,

    DEFAULT_LIMIT: 10,

    MAX_LIMIT: 100,
  });

/**
 * Supported date range filters
 */
export const PROJECT_DATE_RANGES =
  Object.freeze({
    '7d': 7,

    '30d': 30,

    '90d': 90,
  });

/**
 * Search constraints
 */
export const PROJECT_SEARCH =
  Object.freeze({
    MAX_LENGTH: 80,
  });