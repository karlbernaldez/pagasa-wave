const FORMULA_PREFIX_RE = /^[=+\-@\t\r]/;

export function escapeCsvCell(value) {
  if (value === null || value === undefined) return '';

  let text = value instanceof Date ? value.toISOString() : String(value);
  if (typeof value === 'string' && FORMULA_PREFIX_RE.test(text)) {
    text = `'${text}`;
  }

  return `"${text.replaceAll('"', '""')}"`;
}

export function toCsv(headers, rows) {
  return [headers, ...rows]
    .map((row) => row.map((value) => escapeCsvCell(value)).join(','))
    .join('\n');
}
