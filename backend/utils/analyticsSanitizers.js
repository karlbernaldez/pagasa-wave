export const USER_ANALYTICS_EXPORT_HEADERS = Object.freeze(['metric', 'value', 'count']);

export function buildUserAnalyticsExportRows({ total = 0, statusRows = [], roleRows = [] } = {}) {
  return [
    ['accounts.total', 'all', Number(total) || 0],
    ...statusRows.map((row) => ['accounts.status', String(row._id || 'unknown'), row.count || 0]),
    ...roleRows.map((row) => ['accounts.user_type', String(row._id || 'unknown'), row.count || 0]),
  ];
}
