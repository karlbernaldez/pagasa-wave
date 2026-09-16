export const USER_ANALYTICS_EXPORT_HEADERS = Object.freeze(['metric', 'value', 'count']);

export function buildUserAnalyticsExportRows({
  total = 0,
  statusRows = [],
  roleRows = [],
  contributions = null,
} = {}) {
  return [
    ['accounts.total', 'all', Number(total) || 0],
    ...statusRows.map((row) => ['accounts.status', String(row._id || 'unknown'), row.count || 0]),
    ...roleRows.map((row) => ['accounts.user_type', String(row._id || 'unknown'), row.count || 0]),
    ...(contributions
      ? [
          ['contributions.total_events', 'all', Number(contributions.totalEvents) || 0],
          [
            'contributions.active_participants',
            'all',
            Number(contributions.activeContributors) || 0,
          ],
          ...(contributions.actionMix || []).map((row) => [
            'contributions.action',
            String(row.action || 'unknown'),
            Number(row.count) || 0,
          ]),
          ...(contributions.trend || []).map((row) => [
            'contributions.daily_events',
            String(row.date || 'unknown'),
            Number(row.total) || 0,
          ]),
        ]
      : []),
  ];
}
