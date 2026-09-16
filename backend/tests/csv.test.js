import assert from 'node:assert/strict';
import test from 'node:test';

import { escapeCsvCell, toCsv } from '../utils/csv.js';

test('CSV serializer quotes values and escapes embedded quotes', () => {
  assert.equal(escapeCsvCell('Wave "Alpha"'), '"Wave ""Alpha"""');
});

test('CSV serializer neutralizes spreadsheet formula prefixes in text fields', () => {
  for (const value of ['=1+1', '+SUM(A1:A2)', '-10+20', '@cmd', '\tformula', '\rformula']) {
    assert.equal(escapeCsvCell(value), `"'${value}"`);
  }
});

test('CSV serializer preserves numbers and ISO-formats dates', () => {
  assert.equal(escapeCsvCell(42), '"42"');
  assert.equal(escapeCsvCell(new Date('2026-09-15T00:00:00.000Z')), '"2026-09-15T00:00:00.000Z"');
});

test('CSV rows use the hardened serializer for headers and data', () => {
  assert.equal(
    toCsv(['name', 'status'], [['=unsafe', 'Published']]),
    '"name","status"\n"\'=unsafe","Published"'
  );
});
