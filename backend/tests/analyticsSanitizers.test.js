import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildUserAnalyticsExportRows,
  USER_ANALYTICS_EXPORT_HEADERS,
} from '../utils/analyticsSanitizers.js';
import { toCsv } from '../utils/csv.js';

test('user analytics CSV export is aggregate-only', () => {
  assert.deepEqual([...USER_ANALYTICS_EXPORT_HEADERS], ['metric', 'value', 'count']);

  const rows = buildUserAnalyticsExportRows({
    total: 4,
    statusRows: [
      { _id: 'active', count: 3 },
      { _id: 'pending', count: 1 },
    ],
    roleRows: [
      { _id: 'forecaster', count: 2 },
      { _id: 'reviewer', count: 2 },
    ],
  });

  assert.deepEqual(rows, [
    ['accounts.total', 'all', 4],
    ['accounts.status', 'active', 3],
    ['accounts.status', 'pending', 1],
    ['accounts.user_type', 'forecaster', 2],
    ['accounts.user_type', 'reviewer', 2],
  ]);
});

test('aggregate user analytics export has no row-level identity or PII columns', () => {
  const headers = USER_ANALYTICS_EXPORT_HEADERS.join(',').toLowerCase();
  for (const blocked of [
    'user_id',
    'name',
    'email',
    'contact',
    'phone',
    'address',
    'agency',
    'position',
  ]) {
    assert.equal(headers.includes(blocked), false, `unexpected PII column: ${blocked}`);
  }
});


test('aggregate user analytics export neutralizes spreadsheet formulas in dynamic labels', () => {
  const rows = buildUserAnalyticsExportRows({
    roleRows: [{ _id: '=HYPERLINK("https://example.invalid")', count: 1 }],
    contributions: {
      totalEvents: 1,
      activeContributors: 1,
      actionMix: [{ action: '+SUM(A1:A2)', count: 1 }],
      trend: [{ date: '2026-09-15', total: 1 }],
    },
  });

  const csv = toCsv(USER_ANALYTICS_EXPORT_HEADERS, rows);

  assert.match(csv, /"'=HYPERLINK/);
  assert.match(csv, /"'\+SUM\(A1:A2\)"/);
  assert.equal(csv.includes('"=HYPERLINK'), false);
  assert.equal(csv.includes('"+SUM(A1:A2)"'), false);
});
